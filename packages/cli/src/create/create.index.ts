import { TarReader } from '@cotar/core';
import { createWriteStream, promises as fs } from 'fs';
import type { Logger } from 'pino';

export async function toTarIndex(filename: string, indexFileName: string, logger: Logger): Promise<void> {
  const fd = await fs.open(filename, 'r');
  logger.info({ index: indexFileName }, 'Cotar.Index:Start');
  const startTime = Date.now();

  const lines = await TarReader.index(fd, logger);
  await fs.writeFile(indexFileName, lines.join('\n'));
  logger.info({ index: indexFileName, count: lines.length, duration: Date.now() - startTime }, 'Cotar.Index:Created');
}
