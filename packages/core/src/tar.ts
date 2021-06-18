import { LogType } from '@cogeotiff/chunk';
import { bp, StrutInfer, toHex } from 'binparse';
import * as fh from 'farmhash';
import { Cotar } from './cotar';
import { CotarIndexBinary } from './cotar.index.binary';
import { MemorySource } from './source.memory';

export interface MinimalBuffer {
  readonly [n: number]: number;
  length: number;
  slice(start: number, end: number): MinimalBuffer;
}

export type AsyncFileRead = (readCount: number, byteCount: number) => Promise<MinimalBuffer | null>;
export type AsyncFileOutput = { write: (data: string, cb?: () => void) => void };

export type AsyncFileReader = (
  buffer: Buffer,
  off: number,
  count: number,
  offset: number,
) => Promise<{ bytesRead: number }>;
/** Simple interface that should be similar to the output of fs.open() */
export type AsyncFileDescriptor = { read: AsyncFileReader };

export interface TarFileHeader {
  offset: number;
  header: StrutInfer<typeof TarHeader>;
}

export enum TarType {
  File = 0,
  HardLink = 1,
  SymLink = 2,
  CharDeviceNode = 3,
  BlockDeviceNode = 4,
  Directory = 5,
  FifoNode = 6,
  Reserved = 7,
}
export const TarHeader = bp.object('TarHeader', {
  path: bp.string(100),
  mode: bp.string(8),
  uid: bp.string(8),
  gid: bp.string(8),
  size: bp.bytes(12).refine((val) => parseInt(val.toString(), 8)),
  mtime: bp.bytes(12),
  unk1: bp.bytes(8),
  type: bp.string(1).refine(Number),
  linkName: bp.string(100),
  magic: bp.string(6),
  version: bp.bytes(2),
  uName: bp.string(32),
  gName: bp.string(32),
  devMajor: bp.bytes(8),
  devMinor: bp.bytes(8),
  prefix: bp.bytes(155),
  padding: bp.bytes(12),
});

export const IndexRecord = bp.object('TarIndexRecord', {
  hash: bp.bytes(8),
  offset: bp.lu32,
  size: bp.lu32,
});

export const IndexRecordSize = 16;
export const IndexHeaderSize = 4;
const PackingFactor = 1.15;

function alignOffsetToBlock(ctx: { offset: number }): void {
  let size = ctx.offset & 511;
  while (size !== 0) {
    ctx.offset += 512 - size;
    size = ctx.offset & 511;
  }
}

export const TarReader = {
  Type: TarType,
  /** Iterate the tar file headers  */
  async *iterate(getBytes: AsyncFileRead): AsyncGenerator<TarFileHeader> {
    const ctx = { offset: 0, startOffset: 0 };

    while (true) {
      alignOffsetToBlock(ctx);
      const headData = await getBytes(ctx.offset, 512);
      if (headData == null) return;
      const head = TarHeader.raw(headData);
      if (isNaN(head.size)) return;
      ctx.offset += 512;

      if (TarType[head.type] == null) throw new Error('Unknown header @ ' + toHex(ctx.offset));
      if (head.type === TarType.File) yield { header: head, offset: ctx.offset };

      ctx.offset += head.size;
    }
  },

  /** Create a function to read into a shared buffer from a async file descriptor */
  toFileReader(fd: AsyncFileDescriptor): AsyncFileRead {
    const headBuffer = Buffer.alloc(512);

    async function readBytes(offset: number, count: number): Promise<Buffer | null> {
      const res = await fd.read(headBuffer, 0, count, offset);
      if (res.bytesRead < count) return null;
      return headBuffer;
    }
    return readBytes;
  },

  /**
   * Create a tar index give a source tar file
   * @param getBytes function to randomly read bytes from the tar
   * @param logger optional logger for extra information
   * @returns
   */
  async index(getBytes: AsyncFileRead | AsyncFileDescriptor, logger?: LogType): Promise<string[]> {
    if (typeof getBytes !== 'function') getBytes = TarReader.toFileReader(getBytes);

    let fileCount = 0;
    let currentTime = Date.now();
    const lines = [];

    for await (const ctx of TarReader.iterate(getBytes)) {
      if (ctx.header.type !== TarReader.Type.File) continue;
      fileCount++;
      lines.push(JSON.stringify([ctx.header.path, ctx.offset, ctx.header.size]));

      if (fileCount % 25_000 === 0 && logger != null) {
        const duration = Date.now() - currentTime;
        currentTime = Date.now();
        logger.debug({ current: fileCount, duration }, 'Cotar.Index:Write');
      }
    }
    // Make the index sorted so it can be searched easier
    lines.sort();

    return lines;
  },

  async indexBinary(getBytes: AsyncFileRead | AsyncFileDescriptor, logger?: LogType): Promise<Buffer> {
    if (typeof getBytes !== 'function') getBytes = TarReader.toFileReader(getBytes);
    let fileCount = 0;
    let currentTime = Date.now();
    const files = [];
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
      if (fileCount > 5000) break;
    }
    hashSeen.clear();

    const slotCount = Math.ceil(fileCount * PackingFactor);
    const outputBuffer = Buffer.allocUnsafe(IndexRecordSize * slotCount);
    console.log(outputBuffer.length, 'vs', IndexRecordSize * slotCount);
    logger?.debug({ slotCount, fileCount }, 'Cotar.index:Allocate');

    currentTime = Date.now();
    for (const file of files) file.index = Number(BigInt(file.hash) % BigInt(slotCount));
    files.sort((a, b) => a.index - b.index);
    logger?.debug({ duration: Date.now() - currentTime }, 'Cotar.index:Hash');

    const writtenAt = new Set<number>();
    currentTime = Date.now();

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
        if (index === file.index) throw new Error('Loop??');

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
    outputBuffer.writeUInt32LE(slotCount, 0);

    const cotar = new Cotar(new MemorySource('foo', ''), new CotarIndexBinary(new MemorySource('cotar', outputBuffer)));
    for (const file of files) {
      const hash = BigInt(fh.hash64(file.path));

      const index = await cotar.index.find(file.path);
      if (index == null) console.log('Missing', file.path, hash);

      if (index?.offset !== file.offset || index?.size !== file.size) {
        console.log('MissMatch', { file, index });
      }
    }

    logger?.debug({ biggestSearch }, 'Cotar.Index:Stats');
    return outputBuffer;
  },
};
