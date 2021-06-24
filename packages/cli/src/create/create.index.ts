import { CotarIndexBuilder } from '@cotar/core';
import { promises as fs } from 'fs';
import type { LogType } from '@cogeotiff/chunk';

export async function toTarIndex(
  filename: string,
  indexFileName: string,
  binary: boolean,
  logger: LogType,
): Promise<void> {
  const fd = await fs.open(filename, 'r');
  logger.info({ index: indexFileName }, 'Cotar.Index:Start');
  const startTime = Date.now();

  const indexType = binary ? CotarIndexBuilder.Binary : CotarIndexBuilder.NdJson;
  const { buffer, count } = await CotarIndexBuilder.create(fd, indexType, logger);

  await fs.writeFile(indexFileName, buffer);

  logger.info(
    { index: indexFileName, count, size: buffer.length, duration: Date.now() - startTime },
    'Cotar.Index:Created',
  );
}
