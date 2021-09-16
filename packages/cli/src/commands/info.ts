import { SourceFile } from '@chunkd/source-file';
import { Cotar, TarReader } from '@cotar/core';
import Command, { flags } from '@oclif/command';
import { promises as fs } from 'fs';
import { logger } from '../log.js';

export class CreateCotar extends Command {
  static description = 'Validate that every file in the tar can be found in the index';
  static flags = {
    verbose: flags.boolean({ description: 'verbose logging' }),
    mbtiles: flags.string({ description: 'Source MBTiles for validation' }),
  };

  static args = [{ name: 'inputFile', required: true }];

  async run(): Promise<void> {
    const { args, flags } = this.parse(CreateCotar);
    if (flags.verbose) logger.level = 'debug';

    logger.info({ fileName: args.inputFile }, 'Cotar:Load');

    const source = new SourceFile(args.inputFile);
    const cotar = await Cotar.fromTar(source);

    logger.info({ fileName: args.inputFile }, 'Cotar:Loaded');

    const fd = await fs.open(args.inputFile, 'r');
    const fileCount = await TarReader.validate(fd, cotar.index, logger);
    await fd.close();

    logger.info({ fileName: args.inputFile, files: fileCount }, 'Cotar:Validated');
  }
}
