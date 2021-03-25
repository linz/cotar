import { Command, flags } from '@oclif/command';
import { existsSync } from 'fs';
import pino from 'pino';
import { PrettyTransform } from 'pretty-json-log';
import { toTTiles } from './mbtiles.to.ttiles';
import { toTTilesIndex } from './tar.to.ttiles';

const logger = process.stdout.isTTY ? pino(PrettyTransform.stream()) : pino();

export class CreateCovt extends Command {
  static flags = {
    force: flags.boolean({ description: 'force overwriting existing files' }),
    decompress: flags.boolean({
      description: 'decompress gzip encoded tiles before storing in tar',
      default: false,
    }),
    verbose: flags.boolean({ description: 'verbose logging' }),
  };

  static args = [
    { name: 'outputFile', required: true },
    { name: 'inputFile', required: true },
  ];

  async run(): Promise<void> {
    const { args, flags } = this.parse(CreateCovt);
    if (flags.verbose) logger.level = 'debug';

    if (existsSync(args.outputFile) && !flags.force) {
      logger.error({ output: args.outputFile }, 'Output file exists, aborting..');
      return;
    }

    if (!args.inputFile.endsWith('.mbtiles')) {
      logger.error({ input: args.inputFile }, 'Input file must be a mbtiles file');
      return;
    }
    logger.info({ output: args.outputFile }, 'Covt:Create');

    const startTime = Date.now();
    await toTTiles(args.inputFile, args.outputFile, flags.decompress, logger);
    await toTTilesIndex(args.outputFile, args.outputFile + '.tari', logger);

    const duration = Date.now() - startTime;
    logger.info({ output: args.outputFile, duration }, 'Covt:Created');
  }
}
