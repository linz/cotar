import { CotarIndexBinary, CotarIndexBuilder, TarReader } from '@cotar/core';
import { Command, flags } from '@oclif/command';
import { existsSync, promises as fs } from 'fs';
import { logger } from '../log.js';
import { LogType, SourceMemory } from '@chunkd/core';

export class CreateCotar extends Command {
  static description = 'Create a cloud optimized tar';
  static flags = {
    force: flags.boolean({ description: 'force overwriting existing files' }),
    verbose: flags.boolean({ description: 'verbose logging' }),
    limit: flags.integer({ description: 'Only ingest this many files' }),
  };

  static args = [{ name: 'inputFile', required: true }];

  async run(): Promise<void> {
    const { args, flags } = this.parse(CreateCotar);
    if (flags.verbose) logger.level = 'debug';

    const outputFile = args.inputFile + '.co';
    if (existsSync(outputFile) && !flags.force) {
      logger.error({ output: outputFile }, 'Output file exists, aborting..');
      return;
    }
    logger.info({ output: outputFile }, 'Cotar:Create');

    const indexFile = args.inputFile + '.index';

    const startTime = Date.now();
    const buf = await this.toTarIndex(args.inputFile, indexFile, logger);

    logger.info({ output: outputFile }, 'Cotar:Craete:WriteTar');
    await fs.copyFile(args.inputFile, outputFile);
    await fs.appendFile(outputFile, buf);

    const duration = Date.now() - startTime;
    logger.info({ output: outputFile, duration }, 'Cotar:Created');
  }

  async toTarIndex(filename: string, indexFileName: string, logger: LogType): Promise<Buffer> {
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
}
