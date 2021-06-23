import { bp, StrutInfer, toHex } from 'binparse';
import { AsyncFileDescriptor, AsyncFileRead } from './tar.index';

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

/** Tar files are aligned to 512 byte blocks, loop to the closest block */
function alignOffsetToBlock(ctx: { offset: number }): void {
  let size = ctx.offset & 511;
  while (size !== 0) {
    ctx.offset += 512 - size;
    size = ctx.offset & 511;
  }
}

export const TarReader = {
  /** When packing indexes into a binary file allow upto this amount extra space so there are less index collisions */
  PackingFactor: 1.15,

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
};
