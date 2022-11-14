import { SourceMemory } from '@chunkd/core';
import { CotarIndexBinary, CotarIndexBuilder, CotarIndexOptions, TarReader } from '@cotar/core';
import { command, number, option, positional } from 'cmd-ts';
import { existsSync, promises as fs } from 'fs';
import pino from 'pino';
import { force, verbose } from '../common.js';
import { logger } from '../log.js';

export const commandCreate = command({
  name: 'create',
  description: 'Create a cotar from a tar',
  args: {
    force,
    verbose,
    packing: option({
      type: number,
      long: 'packing',
      description: 'Packing factor for the hash map',
      defaultValue: () => 25,
    }),
    maxSearch: option({ type: number, long: 'max-search', description: 'Max search factor', defaultValue: () => 50 }),
    input: positional({ displayName: 'Input', description: 'Input tar file' }),
  },
  async handler(args) {
    if (args.verbose) logger.level = 'debug';

    if (!args.input.endsWith('.tar')) {
      throw new Error(`Can only create a cotar from a tar file input:"${args.input}"`);
    }

    const outputFile = args.input + '.co';
    if (existsSync(outputFile) && !args.force) {
      logger.error({ output: outputFile }, 'Output file exists, aborting..');
      return;
    }
    logger.info({ output: outputFile }, 'Cotar:Create');

    const opts: CotarIndexOptions = { packingFactor: 1 + args.packing / 100, maxSearch: args.maxSearch };

    const indexFile = args.input + '.index';

    const startTime = Date.now();
    const buf = await toTarIndex(args.input, indexFile, opts, logger);

    logger.info({ output: outputFile }, 'Cotar:Craete:WriteTar');
    await fs.copyFile(args.input, outputFile);
    await fs.appendFile(outputFile, buf);

    const duration = Date.now() - startTime;
    logger.info({ output: outputFile, duration }, 'Cotar:Created');
  },
});

async function toTarIndex(
  filename: string,
  indexFileName: string,
  opts: CotarIndexOptions,
  logger: pino.Logger,
): Promise<Buffer> {
  const fd = await fs.open(filename, 'r');
  logger.info({ index: indexFileName }, 'Cotar.Index:Start');
  const startTime = Date.now();

  const { buffer, count } = await CotarIndexBuilder.create(fd, opts, logger);

  logger.info({ count, size: buffer.length, duration: Date.now() - startTime }, 'Cotar.Index:Created');
  const index = await CotarIndexBinary.create(new SourceMemory('index', buffer));
  await TarReader.validate(fd, index, logger);
  await fd.close();
  return buffer;
}
