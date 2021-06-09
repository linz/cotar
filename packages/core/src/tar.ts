import { LogType } from '@cogeotiff/chunk';
import { bp, StrutInfer, toHex } from 'binparse';

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
   * @param output stream to output the tar index into
   * @param logger optional logger for extra information
   * @returns
   */
  async index(
    getBytes: AsyncFileRead | AsyncFileDescriptor,
    output: AsyncFileOutput,
    logger?: LogType,
  ): Promise<number> {
    if (typeof getBytes !== 'function') getBytes = TarReader.toFileReader(getBytes);

    let fileCount = 0;
    let currentTime = Date.now();
    output.write(`[\n`);

    for await (const ctx of TarReader.iterate(getBytes)) {
      if (ctx.header.type !== TarReader.Type.File) continue;
      if (fileCount > 0) output.write(',\n');
      fileCount++;
      output.write(JSON.stringify([ctx.header.path, ctx.offset, ctx.header.size]));

      if (fileCount % 25_000 === 0 && logger != null) {
        const duration = Date.now() - currentTime;
        currentTime = Date.now();
        logger.debug({ current: fileCount, duration }, 'Cotar.Index:Write');
      }
    }

    await new Promise<void>((resolve) => output.write('\n]', () => resolve()));
    return fileCount;
  },
};
