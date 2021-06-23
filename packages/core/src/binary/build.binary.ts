import { LogType, SourceMemory } from '@cogeotiff/chunk';
import { bp } from 'binparse';
import { TarReader } from '../tar';
import { AsyncFileDescriptor, AsyncFileRead, TarIndexBuilder, TarIndexResult } from '../tar.index';
import { CotarIndexBinary, IndexHeaderSize, IndexRecordSize } from './index';
import * as fh from 'farmhash';

export const BinaryIndexRecord = bp.object('TarIndexRecord', {
  hash: bp.bytes(8),
  offset: bp.lu32,
  size: bp.lu32,
});

export const BinaryIndex = bp.object('TarIndex', {
  count: bp.variable('count', bp.lu32),
  hashTable: bp.array('table', BinaryIndexRecord, 'count'),
});

export function toArrayBuffer(buf: Buffer): ArrayBuffer {
  if (buf.byteLength === buf.buffer.byteLength) return buf.buffer;
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

export const CotarIndexBinaryBuilder: TarIndexBuilder = {
  async create(getBytes: AsyncFileRead | AsyncFileDescriptor, logger?: LogType): Promise<TarIndexResult> {
    if (typeof getBytes !== 'function') getBytes = TarReader.toFileReader(getBytes);
    let fileCount = 0;
    let currentTime = Date.now();
    const files = [];

    // Loop over every file in the tar archive create a hash and validating there are no collisions
    const hashSeen = new Map();
    for await (const ctx of TarReader.iterate(getBytes)) {
      if (ctx.header.type !== TarReader.Type.File) continue;
      fileCount++;
      const hash = fh.hash64(ctx.header.path);
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

    const slotCount = Math.ceil(fileCount * TarReader.PackingFactor);
    const outputBuffer = Buffer.allocUnsafe(IndexHeaderSize + IndexRecordSize * slotCount);
    logger?.debug({ slotCount, fileCount }, 'Cotar.index:Allocate');

    // Allocate the hash slots for the files
    currentTime = Date.now();
    for (const file of files) file.index = Number(BigInt(file.hash) % BigInt(slotCount));
    files.sort((a, b) => a.index - b.index);
    logger?.debug({ duration: Date.now() - currentTime }, 'Cotar.index:Hash');

    const writtenAt = new Set<number>();
    currentTime = Date.now();

    // Find the first hash index slot for the file to go into
    // Since the packing factor is quite low there will be a number of hash index collisions
    // so find the first slot that is empty and put the content there
    let biggestSearch = 0;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      let index = file.index;

      let searchCount = 0;
      while (true) {
        if (index >= slotCount - 1) index = 0;
        if (!writtenAt.has(index)) break;
        searchCount++;
        index++;

        // Sanity, this should never happen unless the slot count < file count
        if (index === file.index) throw new Error('Hash index Looped');

        // Couldn't find a space fot this index within 50 index spots
        if (searchCount > 50) {
          throw new Error('SearchCount too high: ' + searchCount + ' index:' + file.index + ' current:' + index);
        }
      }
      biggestSearch = Math.max(biggestSearch, searchCount);

      writtenAt.add(index);

      const offset = index * IndexRecordSize + IndexHeaderSize;
      outputBuffer.writeBigUInt64LE(BigInt(file.hash), offset);
      outputBuffer.writeUInt32LE(file.offset, offset + 8);
      outputBuffer.writeUInt32LE(file.size, offset + 12);

      if (i > 0 && i % 100_000 === 0 && logger != null) {
        const duration = Date.now() - currentTime;
        currentTime = Date.now();
        logger.debug({ current: i, duration, biggestSearch }, 'Cotar.Index:Write');
      }
    }
    // Store the slot count at the start of the file, this is used to find the position later
    outputBuffer.writeUInt32LE(slotCount, 0);

    // Validate that every file was added correctly
    currentTime = Date.now();
    const cotar = new CotarIndexBinary(new SourceMemory('cotar', toArrayBuffer(outputBuffer)));
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const hash = BigInt(fh.hash64(file.path));

      const index = await cotar.find(file.path);
      if (index == null) console.log('Missing', file.path, hash);
      if (index?.offset !== file.offset || index?.size !== file.size) {
        logger?.fatal({ index, file }, 'Cotar.Index:Validate:Failed');
        throw new Error('Failed to validate file:' + file.path);
      }
      if (i % 25_000 === 0 && logger != null) {
        const duration = Date.now() - currentTime;
        currentTime = Date.now();
        logger.debug({ current: i, duration }, 'Cotar.Index:Validate');
      }
    }

    return { buffer: outputBuffer, count: files.length };
  },
};
