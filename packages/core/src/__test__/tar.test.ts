import * as cp from 'child_process';
import { promises as fs } from 'fs';
import { FileHandle } from 'fs/promises';
import o from 'ospec';
import * as path from 'path';
import { SourceFile } from '@cogeotiff/source-file';
import { CotarIndexBinary } from '../binary/binary.index';
import { CotarIndexBuilder } from '../binary/binary.index.builder';
import { TarFileHeader, TarReader } from '../tar';

o.spec('TarReader', () => {
  // Create a Tar file of the built source
  o.before(() => {
    cp.execSync(`tar cf ${tarFilePath} tar.test.*`, { cwd: __dirname });
  });
  const tarFilePath = path.join(__dirname, 'test.tar');
  const tarFileIndexPath = path.join(__dirname, 'test.tar.index');

  let fd: FileHandle | null;
  const headBuffer = Buffer.alloc(512);
  async function readBytes(offset: number, count: number): Promise<Buffer | null> {
    if (fd == null) throw new Error('File is closed');
    const res = await fd.read(headBuffer, 0, count, offset);
    if (res.bytesRead < count) return null;
    return headBuffer;
  }
  o.beforeEach(async () => {
    fd = await fs.open(tarFilePath, 'r');
  });
  o.afterEach(() => fd?.close());

  o('should iterate files', async () => {
    const files: TarFileHeader[] = [];
    for await (const file of TarReader.iterate(readBytes)) files.push(file);
    o(files.map((c) => c.header.path)).deepEquals(['tar.test.d.ts', 'tar.test.d.ts.map', 'tar.test.js']);
  });

  o('should create a index', async () => {
    const tarTestStat = await fs.stat(path.join(__dirname, 'tar.test.js'));
    const source = await fs.open(tarFilePath, 'r');

    const res = await CotarIndexBuilder.create(source);
    await fs.writeFile(tarFileIndexPath, res.buffer);

    await source.close();

    const index = new CotarIndexBinary(new SourceFile(tarFileIndexPath));
    o(res.count >= 3).equals(true);

    const tarTest = await index.find('tar.test.js');
    o(tarTest).notEquals(null);
    o(tarTest?.size).equals(tarTestStat.size);
  });
});
