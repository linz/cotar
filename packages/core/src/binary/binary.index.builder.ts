import { LogType, SourceMemory } from '@chunkd/core';
import { AsyncFileDescriptor, AsyncFileRead, AsyncReader, TarIndexResult } from '../tar.index.js';
import { TarReader } from '../tar.js';
import { CotarIndex } from './binary.index.js';
import { IndexHeaderSize, IndexMagic, IndexV2RecordSize, IndexSize, IndexVersion } from './format.js';

/** Write the header/footer into the buffer */
export function writeHeaderFooter(output: Buffer, count: number, version = IndexVersion): void {
  if (output.length < IndexSize * 2) {
    throw new Error('Buffer is too small for CotarHeader, minimum size: ' + IndexSize * 2);
  }
  // Write the header at the start of the buffer
  output.write(IndexMagic, 0);
  output.writeUInt8(version, 3);
  output.writeUInt32LE(count, 4);

  // Write the header at the end of the buffer
  output.write(IndexMagic, output.length - 8);
  output.writeUInt8(version, output.length - 5);
  output.writeUInt32LE(count, output.length - 4);
}

const Big0 = BigInt(0);
// Max number of records to allow searching this should easily fit within one range request of ~32KB
// 32KB / 16 bytes = 2048
const DefaultMaxSearch = 256;
export interface CotarIndexOptions {
  packingFactor?: number;
  maxSearch?: number;
}

export const CotarIndexBuilder = {
  async create(
    getBytes: AsyncFileRead | AsyncFileDescriptor,
    opts?: CotarIndexOptions,
    logger?: LogType,
  ): Promise<TarIndexResult> {
    if (typeof getBytes !== 'function') getBytes = TarReader.toFileReader(getBytes);
    let currentTime = Date.now();
    const files = [];

    // Loop over every file in the tar archive create a hash and validating there are no collisions
    const hashSeen = new Map();
    for await (const ctx of TarReader.iterate(getBytes)) {
      if (ctx.header.type === TarReader.Type.HardLink) {
        const hash = CotarIndex.hash(ctx.header.linkName);
        const target = hashSeen.get(hash);
        if (target == null) throw new Error('Link to unknown file: ' + ctx.header.linkName);
        files.push({ ...target, hash: CotarIndex.hash(ctx.header.path) });
      } else if (ctx.header.type === TarReader.Type.File) {
        const hash = CotarIndex.hash(ctx.header.path);
        const fileObj = { hash, path: ctx.header.path, offset: ctx.offset, size: ctx.header.size, index: -1 };
        if (hashSeen.has(hash)) {
          // Duplicate file??
          if (hashSeen.get(hash).path === ctx.header.path) {
            logger?.warn({ path: ctx.header.path }, 'DuplicateFilePath');
            continue;
          }
          throw new Error('HashCollision:' + hashSeen.get(hash).path + ' and ' + ctx.header.path);
        } else {
          hashSeen.set(hash, fileObj);
        }
        files.push(fileObj);
      } else {
        continue;
      }

      if (files.length % 25_000 === 0 && logger != null) {
        const duration = Date.now() - currentTime;
        currentTime = Date.now();
        logger.debug({ current: files.length, duration }, 'Cotar.Index:ReadTar');
      }
    }
    hashSeen.clear();

    const packingFactor = opts?.packingFactor ?? TarReader.PackingFactor;
    const slotCount = Math.ceil(files.length * packingFactor);
    const outputBuffer = Buffer.alloc(IndexSize + IndexV2RecordSize * slotCount);
    logger?.debug({ slotCount, fileCount: files.length }, 'Cotar.index:Allocate');

    // Allocate the hash slots for the files
    currentTime = Date.now();
    for (const file of files) file.index = Number(BigInt(file.hash) % BigInt(slotCount));
    files.sort((a, b) => {
      const indexDiff = a.index - b.index;
      if (indexDiff !== 0) return indexDiff;

      const offsetDiff = a.offset - b.offset;
      if (offsetDiff !== 0) return offsetDiff;

      // Hashes can not collide so a.hash must be > or < b.hash
      if (a.hash > b.hash) return 1;
      return -1;
    });
    logger?.debug({ duration: Date.now() - currentTime }, 'Cotar.index:Hash');

    currentTime = Date.now();

    const maxSearch = opts?.maxSearch ?? DefaultMaxSearch;

    // Find the first hash index slot for the file to go into
    // Since the packing factor is quite low there will be a number of hash index collisions
    // so find the first slot that is empty and put the content there
    let biggestSearch = 0;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      let index = file.index;

      let searchCount = 0;
      while (true) {
        if (index >= slotCount) index = 0;
        if (outputBuffer.readBigUInt64LE(index * IndexV2RecordSize + IndexHeaderSize) === Big0) break;
        searchCount++;
        index++;

        // Sanity, this should never happen unless the slot count < file count
        if (index === file.index) throw new Error('Hash index Looped');

        // Couldn't find a space fot this index within 50 index spots
        if (searchCount > maxSearch) {
          throw new Error('SearchCount too high: ' + searchCount + ' index:' + file.index + ' current:' + index);
        }
      }
      biggestSearch = Math.max(biggestSearch, searchCount);

      const offset = index * IndexV2RecordSize + IndexHeaderSize;
      outputBuffer.writeBigUInt64LE(BigInt(file.hash), offset);
      outputBuffer.writeUInt32LE(file.offset / 512, offset + 8); // Tar files are block aligned to 512 bytes
      outputBuffer.writeUInt32LE(file.size, offset + 12);

      if (i > 0 && i % 100_000 === 0 && logger != null) {
        const duration = Date.now() - currentTime;
        currentTime = Date.now();
        logger.debug({ current: i, duration, biggestSearch }, 'Cotar.Index:Write');
      }
    }
    // Store the slot count at the start and end of the file
    writeHeaderFooter(outputBuffer, slotCount);

    return { buffer: outputBuffer, count: files.length };
  },

  /** Validate that the index matches the input file */
  async validate(getBytes: AsyncReader, index: Buffer, logger?: LogType): Promise<number> {
    const binIndex = await CotarIndex.create(new SourceMemory('cotar', index));
    return TarReader.validate(getBytes, binIndex, logger);
  },
};
