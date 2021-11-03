import { SourceMemory } from '@chunkd/core';
import { promises as fs } from 'fs';
import { CotarIndexBuilder } from '../binary/binary.index.builder.js';
import { CotarIndexBinary } from '../index.js';
import { TarReader } from '../tar.js';

/** Crate a binary tar index from a source tar, then validate all files inside the tar exist in the index */
async function main(): Promise<void> {
  const fd = await fs.open('node_modules.tar', 'r');
  const res = await CotarIndexBuilder.create(fd);

  const source = new SourceMemory('Memory', res.buffer);
  const cotarIndex = new CotarIndexBinary(source, res.count);

  for (let i = 0; i < 50; i++) {
    await TarReader.validate(fd, cotarIndex);
  }
}

main();
