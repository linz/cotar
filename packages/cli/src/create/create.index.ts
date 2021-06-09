import { TarReader } from '@cotar/core';
import { createWriteStream, promises as fs } from 'fs';
import type { Logger } from 'pino';

export async function toTarIndex(filename: string, indexFileName: string, logger: Logger): Promise<void> {
  const fd = await fs.open(filename, 'r');
  logger.info({ index: indexFileName }, 'Cotar.Index:Start');
  const outputBuffer = createWriteStream(indexFileName);
  const startTime = Date.now();

  const fileCount = await TarReader.index(fd, outputBuffer, logger);
  logger.info({ index: indexFileName, count: fileCount, duration: Date.now() - startTime }, 'Cotar.Index:Created');
}
