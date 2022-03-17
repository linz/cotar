/** Start Header */
import { SourceMemory } from '@chunkd/core';
import { SourceFile } from '@chunkd/source-file';
import * as cp from 'child_process';
import { promises as fs } from 'fs';
import { FileHandle } from 'fs/promises';
import o from 'ospec';
import * as path from 'path';
import url from 'url';
import { CotarIndexBuilder } from '../binary/binary.index.builder.js';
import { CotarIndex } from '../binary/binary.index.js';
import { Cotar } from '../cotar.js';
import { TarFileHeader, TarReader } from '../tar.js';
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

o.spec('TarReader', () => {
  // Create a Tar file of the built source
  o.before(() => {
    cp.execSync(`tar cf ${tarFilePath} tar.test.*`, { cwd: __dirname });
  });
  const tarFilePath = path.join(__dirname, '_test.tar');

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

    const index = await CotarIndex.create(new SourceMemory('index', res.buffer));
    o(res.count >= 3).equals(true);

    const tarTest = await index.find('tar.test.js');
    o(tarTest).notEquals(null);
    o(tarTest?.size).equals(tarTestStat.size);

    const buf = Buffer.alloc(tarTest?.size ?? 0);
    await source.read(buf, 0, tarTest?.size, tarTest?.offset);
    o(buf.toString().startsWith(`/** Start Header */`)).equals(true);

    await source.close();
  });

  o('should work with a .tar.co', async () => {
    const tarTestStat = await fs.stat(path.join(__dirname, 'tar.test.js'));

    const source = await fs.open(tarFilePath, 'r');
    const res = await CotarIndexBuilder.create(source);
    await source.close();

    const coTarFilePath = tarFilePath + '.co';

    await fs.copyFile(tarFilePath, coTarFilePath);
    await fs.appendFile(coTarFilePath, res.buffer);

    const cotar = await Cotar.fromTar(new SourceFile(coTarFilePath));
    const tarTest = await cotar.index.find('tar.test.js');
    o(tarTest).notEquals(null);
    o(tarTest?.size).equals(tarTestStat.size);

    const data = await cotar.get('tar.test.js');
    o(data).notEquals(null);
    const buf = Buffer.from(data!.slice(0, 100));
    o(buf.toString().startsWith(`/** Start Header */`)).equals(true);

    await cotar.source.close?.();
  });
});
