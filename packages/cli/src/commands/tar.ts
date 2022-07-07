import { fsa } from '@chunkd/fs';
import { TarBuilder } from '@cotar/tar';
import { Command, Flags } from '@oclif/core';
import { existsSync } from 'fs';
import { logger } from '../log.js';

export class CreateTar extends Command {
  static description = 'Create a reproducible tar';
  static flags = {
    force: Flags.boolean({ description: 'force overwriting existing files' }),
    verbose: Flags.boolean({ description: 'verbose logging' }),
  };

  static args = [
    { name: 'outputFile', required: true },
    { name: 'input', required: true },
  ];

  async run(): Promise<void> {
    const { args, flags } = await this.parse(CreateTar);
    if (flags.verbose) logger.level = 'debug';

    if (!args.outputFile.endsWith('.tar')) {
      throw new Error(`Invalid output, needs to be .tar :"${args.outputFile}"`);
    }

    if (existsSync(args.outputFile) && !flags.force) {
      logger.error({ output: args.outputFile }, 'Output file exists, aborting..');
      return;
    }

    const startTime = Date.now();

    const tarBuilder = new TarBuilder(args.outputFile);

    const files = await fsa.toArray(fsa.list(args.input));
    // Ensure files are put into the same order
    files.sort((a, b) => a.localeCompare(b));
    logger.info({ output: args.outputFile, files: files.length }, 'Tar:Create');

    for (const file of files) await tarBuilder.write(file, await fsa.read(file));

    await tarBuilder.close();

    logger.info(
      { output: args.outputFile, stats: tarBuilder.stats, duration: Date.now() - startTime },
      'Tar:Create:Done',
    );
  }
}
