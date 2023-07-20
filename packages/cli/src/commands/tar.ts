import { fsa, toArray } from '@chunkd/fs';
import { TarBuilder } from '@cotar/tar';
import { command, positional, restPositionals } from 'cmd-ts';
import { existsSync } from 'fs';
import { performance } from 'perf_hooks';
import { force, toDuration, verbose } from '../common.js';
import { logger } from '../log.js';
import { Url } from '../url.js';

export const commandTar = command({
  name: 'tar',
  description: 'Create reproducible tar file',
  args: {
    force,
    verbose,
    output: positional({ displayName: 'Output', description: 'Output tar file location' }),
    input: restPositionals({ displayName: 'Input', description: 'Input locations', type: Url }),
  },
  async handler(args) {
    if (args.verbose) logger.level = 'debug';

    if (!args.output.endsWith('.tar')) {
      throw new Error(`Invalid output, needs to be .tar :"${args.output}"`);
    }

    if (existsSync(args.output) && !args.force) {
      logger.error({ output: args.output }, 'Output file exists, aborting..');
      return;
    }

    const startTime = performance.now();
    const tarBuilder = new TarBuilder(args.output);

    for (const input of args.input.sort()) {
      const files = await toArray(fsa.list(input));
      console.log(
        input,
        files.map((f) => f.href),
      );
      files.sort((a, b) => a.href.localeCompare(b.href));
      for (const file of files) await tarBuilder.write(file.href.slice(input.href.length - 1), await fsa.read(file));
    }

    await tarBuilder.close();
    logger.info({ output: args.output, stats: tarBuilder.stats, duration: toDuration(startTime) }, 'Tar:Create:Done');
  },
});
