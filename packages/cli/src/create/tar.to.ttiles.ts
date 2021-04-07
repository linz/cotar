import { TarReader } from '@cotar/core';
import { createWriteStream, promises as fs } from 'fs';
import type { Logger } from 'pino';

export async function toTarTilesIndex(filename: string, indexFileName: string, logger: Logger): Promise<void> {
  const fd = await fs.open(filename, 'r');

  const stat = await fd.stat();

  let fileCount = 0;
  const headBuffer = Buffer.alloc(512);
  logger.info({ index: indexFileName }, 'Cotar.Index:Start');
  const outputBuffer = createWriteStream(indexFileName);
  outputBuffer.write(`[\n`);

  const startTime = Date.now();

  async function readBytes(offset: number, count: number): Promise<Buffer | null> {
    const res = await fd.read(headBuffer, 0, count, offset);
    if (res.bytesRead < count) return null;
    return headBuffer;
  }

  let currentTime = startTime;
  for await (const ctx of TarReader.iterate(readBytes)) {
    if (ctx.header.type !== TarReader.Type.File) continue;
    if (fileCount > 0) outputBuffer.write(',\n');
    outputBuffer.write(JSON.stringify([ctx.header.path, ctx.offset, ctx.header.size]));

    fileCount++;
    if (fileCount % 25_000 === 0) {
      const duration = Date.now() - currentTime;
      currentTime = Date.now();
      const percent = ((ctx.offset / stat.size) * 100).toFixed(2);
      logger.debug({ current: fileCount, percent, duration }, 'Cotar.Index:Write');
    }
  }

  await new Promise<void>((r) => outputBuffer.write('\n]', () => r()));
  logger.info({ index: indexFileName, count: fileCount, duration: Date.now() - startTime }, 'Cotar.Index:Created');
}
