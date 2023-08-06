import { SourceFile } from '@chunkd/source-file';
import { TarReader } from '@cotar/builder';
import { Cotar, CotarIndex } from '@cotar/core';
import { command, optional, positional, string } from 'cmd-ts';
import { promises as fs } from 'fs';
import { verbose } from '../common.js';
import { logger } from '../log.js';

export const commandValidate = command({
  name: 'validate',
  description: 'Validate cotar index matches tar',
  args: {
    verbose,
    input: positional({ displayName: 'Input', description: 'Input cotar file' }),
    inputIndex: positional({ displayName: 'Index', description: 'External cotar index', type: optional(string) }),
  },
  async handler(args) {
    if (args.verbose) logger.level = 'debug';
    logger.info({ fileName: args.input, index: args.inputIndex }, 'Cotar:Load');

    const index = await loadIndex(args.input, args.inputIndex);
    logger.info({ fileName: args.input, metadata: index.metadata }, 'Cotar:Loaded');

    const fd = await fs.open(args.input, 'r');
    const fileCount = await TarReader.validate(fd, index, logger);
    const hashCount = await countHashTable(index);
    await fd.close();

    if (fileCount !== hashCount) {
      logger.error({ fileName: args.input, files: fileCount, hashCount }, 'Cotar:Validated:Failed');
    } else {
      logger.info({ fileName: args.input, files: fileCount, hashCount }, 'Cotar:Validated');
    }
  },
});

/** Count the hashes found in the hash table */
async function countHashTable(index: CotarIndex): Promise<number> {
  if (index.metadata.version !== 2) throw new Error('Only cotar version >2 can be validated');
  const slotCount = index.metadata.count;

  let filled = 0;
  for (let i = 0; i < slotCount; i++) {
    const offset = index.sourceOffset + i * CotarIndex.Header.Record + CotarIndex.Header.Size;
    await index.source.loadBytes(offset, CotarIndex.Header.Record);
    if (index.source.getUint32(offset) > 0 || index.source.getUint32(offset + 4) > 0) filled++;
  }

  return filled;
}

async function loadIndex(tarFile: string, indexFile?: string): Promise<CotarIndex> {
  if (indexFile == null) {
    const source = new SourceFile(tarFile);
    const ct = await Cotar.fromTar(source);
    return ct.index;
  }

  const source = new SourceFile(indexFile);
  return await CotarIndex.create(source);
}
