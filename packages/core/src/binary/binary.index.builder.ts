import { LogType, SourceMemory } from '@chunkd/core';
import { AsyncFileDescriptor, AsyncFileRead, AsyncReader, TarIndexResult } from '../tar.index.js';
import { TarReader } from '../tar.js';
import { CotarIndex } from './binary.index.js';
import { IndexHeaderSize, IndexMagic, IndexRecordSize, IndexSize, IndexVersion } from './format.js';

/** Write the header/footer into the buffer */
export function writeHeaderFooter(output: Buffer, count: number): void {
  if (output.length < IndexSize * 2) {
    throw new Error('Buffer is too small for CotarHeader, minimum size: ' + IndexSize * 2);
  }
  // Write the header at the start of the buffer
  output.write(IndexMagic, 0);
  output.writeUInt8(IndexVersion, 3);
  output.writeUInt32LE(count, 4);

  // Write the header at the end of the buffer
  output.write(IndexMagic, output.length - 8);
  output.writeUInt8(IndexVersion, output.length - 5);
  output.writeUInt32LE(count, output.length - 4);
}

const Big0 = BigInt(0);

const DefaultMaxSearch = 50;
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
    let fileCount = 0;
    let currentTime = Date.now();
    const files = [];

    // Loop over every file in the tar archive create a hash and validating there are no collisions
    const hashSeen = new Map();
    for await (const ctx of TarReader.iterate(getBytes)) {
      if (ctx.header.type !== TarReader.Type.File) continue;
      fileCount++;
      const hash = CotarIndex.hash(ctx.header.path);
      if (hashSeen.has(hash)) {
        throw new Error('HashCollision:' + hashSeen.get(hash) + ' and ' + ctx.header.path);
      } else {
        hashSeen.set(hash, ctx.header.path);
      }
      files.push({ hash, path: ctx.header.path, offset: ctx.offset, size: ctx.header.size, index: -1 });

      if (fileCount % 25_000 === 0 && logger != null) {
        const duration = Date.now() - currentTime;
        currentTime = Date.now();
        logger.debug({ current: fileCount, duration }, 'Cotar.Index:ReadTar');
      }
    }
    hashSeen.clear();

    const packingFactor = opts?.packingFactor ?? TarReader.PackingFactor;
    const slotCount = Math.ceil(fileCount * packingFactor);
    const outputBuffer = Buffer.alloc(IndexSize + IndexRecordSize * slotCount);
    logger?.debug({ slotCount, fileCount }, 'Cotar.index:Allocate');

    // Allocate the hash slots for the files
    currentTime = Date.now();
    for (const file of files) file.index = Number(BigInt(file.hash) % BigInt(slotCount));
    files.sort((a, b) => a.index - b.index);
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
        if (outputBuffer.readBigUInt64LE(index * IndexRecordSize + IndexHeaderSize) === Big0) break;
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

      const offset = index * IndexRecordSize + IndexHeaderSize;
      outputBuffer.writeBigUInt64LE(BigInt(file.hash), offset);
      outputBuffer.writeBigUInt64LE(BigInt(file.offset), offset + 8); // TODO write uint8/16/24 based off size
      outputBuffer.writeBigUInt64LE(BigInt(file.size), offset + 16);

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
