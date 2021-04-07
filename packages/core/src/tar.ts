import { bp, StrutInfer, toHex } from 'binparse';

export interface MinimalBuffer {
  readonly [n: number]: number;
  length: number;
  slice(start: number, end: number): MinimalBuffer;
}

export type AsyncFileRead = (readCount: number, byteCount: number) => Promise<MinimalBuffer | null>;
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
async function* iterateTarFiles(getBytes: AsyncFileRead): AsyncGenerator<TarFileHeader> {
  const ctx = { offset: 0, startOffset: 0 };

  while (true) {
    alignOffsetToBlock(ctx);
    const headData = await getBytes(ctx.offset, 512);
    if (headData == null) return;
    const head = TarHeader.raw(headData);
    if (isNaN(head.size)) return;
    ctx.offset += head.size + 512;

    if (TarType[head.type] == null) throw new Error('Unknown header @ ' + toHex(ctx.offset));
    if (head.type === TarType.File) yield { header: head, offset: ctx.offset };
  }
}

export const TarReader = {
  Type: TarType,
  iterate: iterateTarFiles,
};
