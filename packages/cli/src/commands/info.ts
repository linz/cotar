import { SourceFile } from '@chunkd/source-file';
import { Cotar, CotarIndexBinary, TarReader } from '@cotar/core';
import { Command, Flags } from '@oclif/core';
import { promises as fs } from 'fs';
import { logger } from '../log.js';

export class CotarInfo extends Command {
  static description = 'Validate that every file in the tar can be found in the index';
  static flags = {
    verbose: Flags.boolean({ description: 'verbose logging' }),
  };

  static args = [
    { name: 'inputFile', required: true },
    { name: 'indexFile', required: false },
  ];

  async loadIndex(tarFile: string, indexFile?: string): Promise<CotarIndexBinary> {
    if (indexFile == null) {
      const source = new SourceFile(tarFile);
      const ct = await Cotar.fromTar(source);
      return ct.index;
    }

    const source = new SourceFile(indexFile);
    return await CotarIndexBinary.create(source);
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(CotarInfo);
    if (flags.verbose) logger.level = 'debug';

    logger.info({ fileName: args.inputFile }, 'Cotar:Load');

    const index = await this.loadIndex(args.inputFile, args.indexFile);
    logger.info({ fileName: args.inputFile, indexFile: args.indexFile, metadata: index.metadata }, 'Cotar:Loaded');

    const fd = await fs.open(args.inputFile, 'r');
    const fileCount = await TarReader.validate(fd, index, logger);
    await fd.close();

    if (fileCount === 0) {
      logger.error({ fileName: args.inputFile, files: fileCount }, 'Cotar:Validated:Failed');
    } else {
      logger.info({ fileName: args.inputFile, files: fileCount }, 'Cotar:Validated');
    }
  }
}
