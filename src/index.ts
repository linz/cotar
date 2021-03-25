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
  };

  static args = [
    { name: 'outputFile', required: true },
    { name: 'inputFile', required: true },
  ];

  async run(): Promise<void> {
    const { args, flags } = this.parse(CreateCovt);

    if (existsSync(args.outputFile) && !flags.force) {
      logger.error('Output file exists, aborting..');
      return;
    }

    if (!args.inputFile.endsWith('.mbtiles')) {
      logger.error('Input file must be a mbtiles file');
      return;
    }
    await toTTiles(args.inputFile, args.outputFile, logger);
    await toTTilesIndex(args.outputFile, args.outputFile + '.tari', logger);
  }
}
