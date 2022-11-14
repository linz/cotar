import { SourceFile } from '@chunkd/source-file';
import { Cotar, CotarIndexBinary, TarReader } from '@cotar/core';
import { command, positional } from 'cmd-ts';
import { promises as fs } from 'fs';
import { verbose } from '../common.js';
import { logger } from '../log.js';

export const commandValidate = command({
  name: 'validate',
  description: 'Validate cotar index matches tar',
  args: {
    verbose,
    input: positional({ displayName: 'Input', description: 'Input cotar file' }),
  },
  async handler(args) {
    if (args.verbose) logger.level = 'debug';
    logger.info({ fileName: args.input }, 'Cotar:Load');

    const index = await loadIndex(args.input);
    logger.info({ fileName: args.input, metadata: index.metadata }, 'Cotar:Loaded');

    const fd = await fs.open(args.input, 'r');
    const fileCount = await TarReader.validate(fd, index, logger);
    await fd.close();

    if (fileCount === 0) {
      logger.error({ fileName: args.input, files: fileCount }, 'Cotar:Validated:Failed');
    } else {
      logger.info({ fileName: args.input, files: fileCount }, 'Cotar:Validated');
    }
  },
});

async function loadIndex(tarFile: string, indexFile?: string): Promise<CotarIndexBinary> {
  if (indexFile == null) {
    const source = new SourceFile(tarFile);
    const ct = await Cotar.fromTar(source);
    return ct.index;
  }

  const source = new SourceFile(indexFile);
  return await CotarIndexBinary.create(source);
}
