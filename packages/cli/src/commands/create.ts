import { Command, flags } from '@oclif/command';
import { existsSync } from 'fs';
import { logger } from '../log';
import { toTarTiles } from '../create/mbtiles.to.ttiles';
import { toTarTilesIndex } from '../create/tar.to.ttiles';

export class CreateCovt extends Command {
  static flags = {
    force: flags.boolean({ description: 'force overwriting existing files' }),
    output: flags.string({ description: 'output file', required: true }),
    verbose: flags.boolean({ description: 'verbose logging' }),
    index: flags.boolean({ description: 'Only create the index', default: false }),
    limit: flags.integer({ description: 'Only ingest this many files' }),
  };

  static args = [{ name: 'inputFile', required: true }];

  async run(): Promise<void> {
    const { args, flags } = this.parse(CreateCovt);
    if (flags.verbose) logger.level = 'debug';

    if (existsSync(flags.output) && !flags.force) {
      logger.error({ output: flags.output }, 'Output file exists, aborting..');
      return;
    }

    if (!args.inputFile.endsWith('.mbtiles')) {
      logger.error({ input: args.inputFile }, 'Input file must be a mbtiles file');
      return;
    }
    logger.info({ output: flags.output }, 'Covt:Create');

    const startTime = Date.now();
    if (flags.index === false) await toTarTiles(args.inputFile, flags.output, flags.limit, logger);
    await toTarTilesIndex(flags.output, flags.output + '.index', logger);

    const duration = Date.now() - startTime;
    logger.info({ output: flags.output, duration }, 'Covt:Created');
  }
}
