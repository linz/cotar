import { CotarIndex } from '@cotar/core';
import { bp, StrutInfer, toHex } from 'binparse';

import { LogType } from './log.js';
import { AsyncFileDescriptor, AsyncFileRead, AsyncReader } from './tar.index.js';

export interface TarFileHeader {
  offset: number;
  header: StrutInfer<typeof TarHeader>;
}

export enum TarType {
  File = '0'.charCodeAt(0),
  HardLink = '1'.charCodeAt(0),
  SymLink = '2'.charCodeAt(0),
  CharDeviceNode = '3'.charCodeAt(0),
  BlockDeviceNode = '4'.charCodeAt(0),
  Directory = '5'.charCodeAt(0),
  FifoNode = '6'.charCodeAt(0),
  Reserved = '7'.charCodeAt(0),
  LongName = 'L'.charCodeAt(0),
  LongLink = 'K'.charCodeAt(0),
}

// It takes time to load all the header in, load in only the chunks we care about
const TarHeader = bp.static('TarHeader', {
  path: bp.string(100),
  skip1: bp.skip(24),
  // mode: bp.string(8),
  // uid: bp.string(8),
  // gid: bp.string(8),
  size: bp.bytes(12).refine((val) => parseInt(val.toString(), 8)),
  skip2: bp.skip(20),
  // unk1: bp.skip(8),
  type: bp.u8,
  linkName: bp.string(100),
  // magic: bp.string(6),
  // version: bp.bytes(2),
  // uName: bp.string(32),
  // gName: bp.string(32),
  // devMajor: bp.bytes(8),
  // devMinor: bp.bytes(8),
  // prefix: bp.bytes(155),
  // padding: bp.bytes(12),
});

/** Tar files are aligned to 512 byte blocks, loop to the closest block */
export function alignOffsetToBlock(ctx: { offset: number }): void {
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

      if (head.type === 0) head.type = TarType.File;
      if (TarType[head.type] == null) {
        throw new Error('Unknown header @ ' + toHex(ctx.offset) + ' type:' + head.type);
      }
      yield { header: head, offset: ctx.offset };

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

  /** Validate a index matches */
  async validate(getBytes: AsyncReader, cotar: CotarIndex, logger?: LogType): Promise<number> {
    if (typeof getBytes !== 'function') getBytes = TarReader.toFileReader(getBytes);
    let currentTime = Date.now();

    let i = 0;
    for await (const ctx of TarReader.iterate(getBytes)) {
      if (ctx.header.type !== TarReader.Type.File) continue;

      const index = await cotar.find(ctx.header.path);
      if (index == null) {
        logger?.fatal(
          { index, size: ctx.header.size, offset: ctx.offset, path: ctx.header.path },
          'Cotar.Index:Validate:Failed',
        );
        continue;
      }
      if (index?.offset !== ctx.offset || index?.size !== ctx.header.size) {
        logger?.fatal({ index, size: ctx.header.size, offset: ctx.offset }, 'Cotar.Index:Validate:Failed');
        throw new Error('Failed to validate file:' + ctx.header.path);
      }
      if (i % 25_000 === 0 && logger != null) {
        const duration = Date.now() - currentTime;
        currentTime = Date.now();
        logger.debug({ current: i, duration }, 'Cotar.Index:Validate');
      }
      i++;
    }
    return i;
  },
};
