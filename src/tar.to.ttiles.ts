import { bp } from 'binparse';
import { promises as fs } from 'fs';
import type { Logger } from 'pino';

export enum TarFileType {
  File = 0,
  Directory = 5,
}
const tar = bp.object('TarHeader', {
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
  uname: bp.string(32),
  gname: bp.string(32),
  devMajog: bp.bytes(8),
  devMinor: bp.bytes(8),
  prefix: bp.bytes(155),
  unk3: bp.bytes(12),
});

function alignOffsetToBlock(ctx: { offset: number }): void {
  let size = ctx.offset & 511;
  while (size != 0) {
    ctx.offset += 512 - size;
    size = ctx.offset & 511;
  }
}

export async function toTTilesIndex(filename: string, indexFileName: string, logger: Logger): Promise<void> {
  const fd = await fs.open(filename, 'r');

  const stat = await fd.stat();

  const ctx = { offset: 0, startOffset: 0 };

  const Files: Record<string, { o: number; s: number }> = {};
  let fileCount = 0;
  const headBuffer = Buffer.alloc(512);

  let startTime = Date.now();
  while (ctx.offset < stat.size) {
    alignOffsetToBlock(ctx);

    const headData = await fd.read(headBuffer, 0, 512, ctx.offset);
    ctx.offset += 512;
    if (headData.bytesRead < 512) throw new Error('Failed to read header data');
    const head = tar.raw(headBuffer);

    if (head.path == '') break;
    if (TarFileType[head.type] == null) throw new Error('Unknown header');

    if (head.type == TarFileType.File) {
      Files[head.path] = { o: ctx.offset, s: head.size };
      fileCount++;
      if (fileCount % 25_000 == 0) {
        const duration = Date.now() - startTime;
        startTime = Date.now();
        const percent = ((ctx.offset / stat.size) * 100).toFixed(2);
        logger.debug({ count: fileCount, percent, duration }, 'TarIndex:Write');
      }
    }

    ctx.offset += head.size;
  }

  logger.info({ index: indexFileName, count: Object.keys(Files).length }, 'IndexCreated');
  await fs.writeFile(indexFileName, JSON.stringify(Files, null, 2));
}
