import { SourceMemory } from '@chunkd/source-memory';
import { promises as fs } from 'fs';
import { CotarIndexBuilder } from '../binary.index.builder.js';
import { CotarIndex } from '@cotar/core';
import { TarReader } from '../tar.js';

/** Crate a binary tar index from a source tar, then validate all files inside the tar exist in the index */
async function main(): Promise<void> {
  const fd = await fs.open('test.tar', 'r');
  const res = await CotarIndexBuilder.create(fd);

  const source = new SourceMemory('memory://memory', res.buffer);
  const cotarIndex = new CotarIndex(source, { version: 2, count: res.count, magic: 'COT' });

  for (let i = 0; i < 5; i++) {
    await TarReader.validate(fd, cotarIndex);
  }
}

main();
