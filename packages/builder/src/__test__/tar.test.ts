/** Start Header */
// ^-- this line is used for testing
import { SourceMemory } from '@chunkd/source-memory';
import { SourceFile } from '@chunkd/source-file';
import * as cp from 'child_process';
import { promises as fs } from 'fs';
import { FileHandle } from 'fs/promises';
import { describe, before, beforeEach, afterEach, it } from 'node:test';
import assert from 'node:assert';
import * as path from 'path';
import url from 'url';
import { CotarIndexBuilder } from '../binary.index.builder.js';
import { Cotar, CotarIndex } from '@cotar/core';
import { TarFileHeader, TarReader } from '../tar.js';
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

describe('TarReader', () => {
  // Create a Tar file of the built source
  before(() => {
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
  beforeEach(async () => {
    fd = await fs.open(tarFilePath, 'r');
  });
  afterEach(() => fd?.close());

  it('should iterate files', async () => {
    const files: TarFileHeader[] = [];
    for await (const file of TarReader.iterate(readBytes)) files.push(file);
    assert.deepEqual(
      files.map((c) => c.header.path),
      ['tar.test.d.ts', 'tar.test.d.ts.map', 'tar.test.js', 'tar.test.js.map'],
    );
  });

  it('should create a index', async () => {
    const tarTestStat = await fs.stat(path.join(__dirname, 'tar.test.js'));
    const source = await fs.open(tarFilePath, 'r');

    const res = await CotarIndexBuilder.create(source);

    const index = await CotarIndex.create(new SourceMemory('memory://index', res.buffer));
    assert.equal(res.count >= 3, true);

    const tarTest = await index.find('tar.test.js');
    assert.notEqual(tarTest, null);
    assert.equal(tarTest?.size, tarTestStat.size);

    const buf = Buffer.alloc(tarTest?.size ?? 0);
    await source.read(buf, 0, tarTest?.size, tarTest?.offset);
    assert.equal(buf.toString().startsWith(`/** Start Header */`), true);

    await source.close();
  });

  it('should work with a .tar.co', async () => {
    const tarTestStat = await fs.stat(path.join(__dirname, 'tar.test.js'));

    const source = await fs.open(tarFilePath, 'r');
    const res = await CotarIndexBuilder.create(source);
    await source.close();

    const coTarFilePath = tarFilePath + '.co';

    await fs.copyFile(tarFilePath, coTarFilePath);
    await fs.appendFile(coTarFilePath, res.buffer);

    const cotar = await Cotar.fromTar(new SourceFile(coTarFilePath));
    const tarTest = await cotar.index.find('tar.test.js');
    assert.notEqual(tarTest, null);
    assert.equal(tarTest?.size, tarTestStat.size);

    const data = await cotar.get('tar.test.js');
    assert.notEqual(data, null);
    const buf = Buffer.from(data!.slice(0, 100));
    assert.equal(buf.toString().startsWith(`/** Start Header */`), true);

    await cotar.source.close?.();
  });
});
