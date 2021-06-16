import { SourceFile } from '@cogeotiff/source-file';
import { Cotar } from '@cotar/core';
import Command, { flags } from '@oclif/command';
import { promises as fs } from 'fs';
import { logger } from '../log';

export class CreateCotar extends Command {
  static flags = {
    verbose: flags.boolean({ description: 'verbose logging' }),
    mbtiles: flags.string({ description: 'Source MBTiles for validation' }),
  };

  static args = [{ name: 'inputFile', required: true }];

  async run(): Promise<void> {
    const { args, flags } = this.parse(CreateCotar);
    if (flags.verbose) logger.level = 'debug';

    logger.info({ fileName: args.inputFile }, 'Cotar.Load');

    const source = new SourceFile(args.inputFile);
    logger.debug({ indexPath: args.inputFile + '.index' }, 'Index:Load');
    const sourceIndex = await fs.readFile(args.inputFile + '.index');

    const index = sourceIndex.toString().split('\n');

    const cotar = new Cotar(source, index);
    logger.info({ fileName: args.inputFile, files: cotar.index.size }, 'Cotar.Loaded');
  }
}
