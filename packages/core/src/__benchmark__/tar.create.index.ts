import { promises as fs } from 'fs';
import { CotarIndexBuilder } from '../binary/binary.index.builder.js';

/** Crate a binary tar index 5 times from a source tar */
async function main(): Promise<void> {
  const fd = await fs.open('test.tar', 'r');

  for (let i = 0; i < 5; i++) {
    await CotarIndexBuilder.create(fd);
  }
}

main();
