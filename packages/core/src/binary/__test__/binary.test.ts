import { SourceMemory } from '@chunkd/core';
import { SourceFile } from '@chunkd/source-file';
import fnv1a from '@sindresorhus/fnv1a';
import * as cp from 'child_process';
import { promises as fs } from 'fs';
import { FileHandle } from 'fs/promises';
import o from 'ospec';
import path from 'path';
import url from 'url';
import { Cotar } from '../../cotar.js';
import { TarReader } from '../../tar.js';
import { CotarIndexBuilder, writeHeaderFooter } from '../binary.index.builder.js';
import { CotarIndex } from '../binary.index.js';
import { IndexHeaderSize, IndexV2RecordSize } from '../format.js';
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

function abToChar(buf: ArrayBuffer | null, offset: number): string | null {
  if (buf == null) return null;
  return String.fromCharCode(new Uint8Array(buf)[offset]);
}

const ExpectedRecordV2 =
  'Q09UAgQAAAB0wPmDP22WfQIAAAAIAAAAAAAAAAAAAAAAAAAAAAAAACZjB1u0iLSnAAAAAAEAAAC/I5YiYFMqNwEAAAAEAAAAQ09UAgQAAAA=';

o.spec('CotarBinary.fake', () => {
  const TestFiles = [
    { path: 'tiles/0/0/0.pbf.gz', offset: 0, size: 1 },
    { path: 'tiles/1/1/1.pbf.gz', offset: 512, size: 4 },
    { path: 'tiles/1/1/2.pbf.gz', offset: 1024, size: 8 },
  ];
  const TestFileSize = TestFiles.length + 1;

  // const tarIndexV1: Buffer = Buffer.alloc(TestFileSize * IndexV1RecordSize + IndexHeaderSize * 2);
  const tarIndexV2: Buffer = Buffer.alloc(TestFileSize * IndexV2RecordSize + IndexHeaderSize * 2);

  for (const record of TestFiles) {
    const hash = fnv1a(record.path, { size: 64 });
    const index = Number(hash % BigInt(TestFileSize));

    const offsetV2 = index * IndexV2RecordSize + IndexHeaderSize;
    tarIndexV2.writeBigUInt64LE(hash, offsetV2);
    tarIndexV2.writeUInt32LE(record.offset / 512, offsetV2 + 8);
    tarIndexV2.writeUInt32LE(record.size, offsetV2 + 12);
  }
  writeHeaderFooter(tarIndexV2, TestFileSize);

  o('should load a tile from fake v2 index', async () => {
    o(tarIndexV2.toString('base64')).equals(ExpectedRecordV2);

    const cotar = new Cotar(
      new SourceMemory('Tar', Buffer.from('0123456789')),
      await CotarIndex.create(new SourceMemory('index', tarIndexV2)),
    );

    o(await cotar.index.find('tiles/0/0/0.pbf.gz')).deepEquals({ offset: 0, size: 1 });
    o(await cotar.index.find('tiles/1/1/1.pbf.gz')).deepEquals({ offset: 512, size: 4 });
    o(await cotar.index.find('tiles/1/1/2.pbf.gz')).deepEquals({ offset: 1024, size: 8 });
    o(await cotar.index.find('tiles/1/1/3.pbf.gz')).equals(null);

    const tile0 = await cotar.get('tiles/0/0/0.pbf.gz');
    o(tile0).notEquals(null);
    o(abToChar(tile0, 0)).equals('0');
  });

  o('should load v2 from a combined tar & header', async () => {
    const tar = Buffer.concat([Buffer.from('0123456789'), tarIndexV2]);

    const cotar = await Cotar.fromTar(new SourceMemory('Combined', tar));
    o(cotar.index.sourceOffset).equals(10);
    o(cotar.index.metadata).deepEquals({ magic: 'COT', version: 2, count: 4 });

    o(await cotar.index.find('tiles/0/0/0.pbf.gz')).deepEquals({ offset: 0, size: 1 });
    o(await cotar.index.find('tiles/1/1/1.pbf.gz')).deepEquals({ offset: 512, size: 4 });
    o(await cotar.index.find('tiles/1/1/2.pbf.gz')).deepEquals({ offset: 1024, size: 8 });
    o(await cotar.index.find('tiles/1/1/3.pbf.gz')).equals(null);

    const tile0 = await cotar.get('tiles/0/0/0.pbf.gz');
    o(tile0).notEquals(null);
    o(abToChar(tile0, 0)).equals('0');
  });
});

o.spec('CotarBinary', () => {
  // Create a Tar file of the built source
  o.before(() => {
    cp.execSync(`tar cf ${tarFilePath} *.test.*`, { cwd: __dirname });
  });
  const tarFilePath = path.join(__dirname, 'test.tar');
  const tarFileIndexPath = path.join(__dirname, 'test.tar.index');
  let fd: FileHandle | null;

  o.beforeEach(async () => {
    fd = await fs.open(tarFilePath, 'r');
  });
  o.afterEach(() => fd?.close());

  o('should create a binary index from a tar file', async () => {
    const fd = await fs.open(tarFilePath, 'r');
    const res = await CotarIndexBuilder.create(fd);
    o(res.count > 3).equals(true);
    await fs.writeFile(tarFileIndexPath, res.buffer);

    const source = new SourceFile(tarFilePath);
    const sourceIndex = new SourceFile(tarFileIndexPath);

    const index = await CotarIndex.create(sourceIndex);
    const cotar = new Cotar(source, index);

    const fileData = await cotar.get('binary.test.js');
    o(fileData).notEquals(null);
    o(Buffer.from(fileData!).toString().startsWith('import {')).equals(true);

    const fakeFile = await cotar.get('fake.file.md');
    o(fakeFile).equals(null);

    // Should validate
    await TarReader.validate(fd, index);
    await fd.close();
    await source.close?.();
    await sourceIndex.close?.();
  });
});
