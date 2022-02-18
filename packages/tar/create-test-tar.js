import { TarBuilder } from './build/src/tar.js';

/** Create a testing archive with a large number of files for benchmarks */
const TestFileCount = 25000;
async function main() {
  console.log(`Creating test archive: "./test.tar" with ${TestFileCount} files`);
  const tarFile = new TarBuilder('./test.tar');

  for (let i = 0; i < TestFileCount; i++) {
    const fileName = 'tiles/' + i.toString(16) + '.pbf.gz';

    await tarFile.write(fileName, Buffer.from('This is a testing tar data: ' + i));
  }
}

main();
