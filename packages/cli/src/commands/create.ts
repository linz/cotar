import { SourceMemory } from '@chunkd/core';
import { CotarIndexBinary, CotarIndexBuilder, CotarIndexOptions, TarReader } from '@cotar/core';
import { Command, Flags } from '@oclif/core';
import { existsSync, promises as fs } from 'fs';
import pino from 'pino';
import { logger } from '../log.js';

export class CreateCotar extends Command {
  static description = 'Create a cloud optimized tar';
  static flags = {
    force: Flags.boolean({ description: 'force overwriting existing files' }),
    packing: Flags.integer({ description: 'Packing factor for the hash map', default: 25 }),
    'max-search': Flags.integer({ description: 'Max search factor', default: 50 }),
    verbose: Flags.boolean({ description: 'verbose logging' }),
    limit: Flags.integer({ description: 'Only ingest this many files' }),
  };

  static args = [{ name: 'inputFile', required: true }];

  async run(): Promise<void> {
    const { args, flags } = await this.parse(CreateCotar);
    if (flags.verbose) logger.level = 'debug';

    const outputFile = args.inputFile + '.co';
    if (existsSync(outputFile) && !flags.force) {
      logger.error({ output: outputFile }, 'Output file exists, aborting..');
      return;
    }
    logger.info({ output: outputFile }, 'Cotar:Create');

    const opts: CotarIndexOptions = { packingFactor: 1 + flags.packing / 100, maxSearch: flags['max-search'] };

    const indexFile = args.inputFile + '.index';

    const startTime = Date.now();
    const buf = await this.toTarIndex(args.inputFile, indexFile, opts, logger);

    logger.info({ output: outputFile }, 'Cotar:Craete:WriteTar');
    await fs.copyFile(args.inputFile, outputFile);
    await fs.appendFile(outputFile, buf);

    const duration = Date.now() - startTime;
    logger.info({ output: outputFile, duration }, 'Cotar:Created');
  }

  async toTarIndex(
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
}
