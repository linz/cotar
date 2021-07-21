import { SourceFile } from '@chunkd/source-file';
import { Cotar, TarReader } from '@cotar/core';
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

    const cotar = await Cotar.fromTar(new SourceFile(args.inputFile));

    logger.info({ fileName: args.inputFile, files: cotar.index.size }, 'Cotar.Loaded');

    const fd = await fs.open(args.inputFile, 'r');
    await TarReader.validate(fd, cotar.index, logger);
    await fd.close();

    for (let i = 0; i < 32; i++) {
      const fakeFile = Math.random().toString(32) + Math.random().toString(32);
      const res = await cotar.index.find(fakeFile);
      if (res != null) throw new Error('Found fake file: ' + fakeFile);
    }
  }
}
