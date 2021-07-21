import { LogType, SourceMemory } from '@cogeotiff/chunk';
import { CotarIndexBinary, CotarIndexBuilder, TarReader, toArrayBuffer } from '@cotar/core';
import { promises as fs } from 'fs';

export async function toTarIndex(filename: string, indexFileName: string, logger: LogType): Promise<void> {
  const fd = await fs.open(filename, 'r');
  logger.info({ index: indexFileName }, 'Cotar.Index:Start');
  const startTime = Date.now();

  const { buffer, count } = await CotarIndexBuilder.create(fd, logger);

  await fs.writeFile(indexFileName, buffer);

  logger.info(
    { index: indexFileName, count, size: buffer.length, duration: Date.now() - startTime },
    'Cotar.Index:Created',
  );

  const index = new CotarIndexBinary(new SourceMemory('', toArrayBuffer(buffer)));
  await TarReader.validate(fd, index, logger);
  await fd.close();
}
