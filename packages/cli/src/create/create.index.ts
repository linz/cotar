import { LogType, SourceMemory } from '@chunkd/core';
import { CotarIndexBinary, CotarIndexBuilder, TarReader } from '@cotar/core';
import { promises as fs } from 'fs';

export async function toTarIndex(filename: string, indexFileName: string, logger: LogType): Promise<Buffer> {
  const fd = await fs.open(filename, 'r');
  logger.info({ index: indexFileName }, 'Cotar.Index:Start');
  const startTime = Date.now();

  const { buffer, count } = await CotarIndexBuilder.create(fd, logger);

  logger.info({ count, size: buffer.length, duration: Date.now() - startTime }, 'Cotar.Index:Created');
  const index = await CotarIndexBinary.create(new SourceMemory('index', buffer));
  await TarReader.validate(fd, index, logger);
  await fd.close();
  return buffer;
}
