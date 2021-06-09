import { TarReader } from '@cotar/core';
import { createWriteStream, promises as fs } from 'fs';
import type { Logger } from 'pino';

export async function toTarIndex(filename: string, indexFileName: string, logger: Logger): Promise<void> {
  const fd = await fs.open(filename, 'r');

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

  const fileCount = await TarReader.index(readBytes, outputBuffer, logger);
  logger.info({ index: indexFileName, count: fileCount, duration: Date.now() - startTime }, 'Cotar.Index:Created');
}
