import { Command, flags } from '@oclif/command';
import { existsSync, promises as fs } from 'fs';
import { toTarIndex } from '../create/create.index';
import { logger } from '../log';

export class CreateCotar extends Command {
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
    const buf = await toTarIndex(args.inputFile, indexFile, logger);

    await fs.copyFile(args.inputFile, outputFile);
    await fs.appendFile(outputFile, buf);

    const duration = Date.now() - startTime;
    logger.info({ output: outputFile, duration }, 'Cotar:Created');
  }
}
