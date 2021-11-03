import { promises as fs } from 'fs';
import { CotarIndexBuilder } from '../binary/binary.index.builder.js';

/** Crate a binary tar index 50 times from a source tar */
async function main(): Promise<void> {
  const fd = await fs.open('node_modules.tar', 'r');

  for (let i = 0; i < 50; i++) {
    await CotarIndexBuilder.create(fd);
  }
}

main();
