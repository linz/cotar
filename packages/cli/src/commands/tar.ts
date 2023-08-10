import { fsa, toArray } from '@chunkd/fs';
import { TarBuilder } from '@cotar/tar';
import { command, positional, restPositionals } from 'cmd-ts';
import { existsSync } from 'fs';
import { performance } from 'perf_hooks';
import { force, toDuration, verbose } from '../common.js';
import { logger } from '../log.js';
import { Url } from '../url.js';
import { cwd } from 'process';
import { pathToFileURL } from 'node:url';

function toRelative(url: URL, baseUrl: URL): string {
  if (!url.href.startsWith(baseUrl.href)) throw new Error('File is not relative: ' + url + ' vs ' + baseUrl);

  if (baseUrl.href.endsWith('/')) return url.href.slice(baseUrl.href.length);
  return url.href.slice(baseUrl.href.length + 1);
}

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

    const workingDir = pathToFileURL(cwd());

    const startTime = performance.now();
    const tarBuilder = new TarBuilder(args.output);

    for (const input of args.input) {
      const stat = await fsa.head(input);
      if (stat != null && !stat.isDirectory) {
        // Found a file add the file directly
        await tarBuilder.write(toRelative(input, workingDir), await fsa.read(input));
      } else {
        const files = await toArray(fsa.list(input));

        files.sort((a, b) => a.href.localeCompare(b.href));
        for (const file of files) {
          await tarBuilder.write(toRelative(file, workingDir), await fsa.read(file));
        }
      }
    }

    await tarBuilder.close();
    logger.info({ output: args.output, stats: tarBuilder.stats, duration: toDuration(startTime) }, 'Tar:Create:Done');
  },
});
