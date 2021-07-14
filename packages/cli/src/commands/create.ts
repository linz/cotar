import { Command, flags } from '@oclif/command';
import { existsSync } from 'fs';
import { toTarIndex } from '../create/create.index';
import { logger } from '../log';

export class CreateCotar extends Command {
  static flags = {
    force: flags.boolean({ description: 'force overwriting existing files' }),
    ndjson: flags.boolean({ description: 'Create a ndjson index', default: false }),
    verbose: flags.boolean({ description: 'verbose logging' }),
    limit: flags.integer({ description: 'Only ingest this many files' }),
  };

  static args = [{ name: 'inputFile', required: true }];

  async run(): Promise<void> {
    const { args, flags } = this.parse(CreateCotar);
    if (flags.verbose) logger.level = 'debug';

    const outputFile = args.inputFile + '.index';
    if (existsSync(outputFile) && !flags.force) {
      logger.error({ output: outputFile }, 'Output file exists, aborting..');
      return;
    }
    logger.info({ output: outputFile }, 'Cotar:Create');

    const startTime = Date.now();
    await toTarIndex(args.inputFile, outputFile, !flags.ndjson, logger);

    const duration = Date.now() - startTime;
    logger.info({ output: outputFile, duration }, 'Cotar:Created');
  }
}
