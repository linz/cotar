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
import { CotarIndex, toNumber } from '../binary.index.js';
import { IndexHeaderSize, IndexRecordSize } from '../format.js';
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

function abToChar(buf: ArrayBuffer | null, offset: number): string | null {
  if (buf == null) return null;
  return String.fromCharCode(new Uint8Array(buf)[offset]);
}

const ExpectedRecord =
  'Q09UAQQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAmYwdbtIi0pwAAAAAAAAAAAQAAAAAAAAC/I5YiYFMqNwQAAAAAAAAABAAAAAAAAABDT1QBBAAAAA==';

o.spec('CotarBinary.fake', () => {
  o('should load a tile from fake index', async () => {
    // Manually create a fake binary index
    const files = [
      { path: 'tiles/0/0/0.pbf.gz', offset: 0, size: 1 },
      { path: 'tiles/1/1/1.pbf.gz', offset: 4, size: 4 },
    ];

    const indexSize = 4;
    const tarIndex: Buffer = Buffer.alloc(indexSize * IndexRecordSize + IndexHeaderSize * 2);

    for (const record of files) {
      const hash = fnv1a.bigInt(record.path, { size: 64 });
      const index = Number(hash % BigInt(indexSize));
      const offset = index * IndexRecordSize + IndexHeaderSize;
      tarIndex.writeBigUInt64LE(hash, offset);
      tarIndex.writeBigUInt64LE(BigInt(record.offset), offset + 8);
      tarIndex.writeBigUInt64LE(BigInt(record.size), offset + 16);
    }
    tarIndex.writeUInt32LE(indexSize);

    writeHeaderFooter(tarIndex, indexSize);

    o(tarIndex.toString('base64')).equals(ExpectedRecord);

    const cotar = new Cotar(
      new SourceMemory('Tar', Buffer.from('0123456789')),
      await CotarIndex.create(new SourceMemory('index', tarIndex)),
    );

    o(await cotar.index.find('tiles/0/0/0.pbf.gz')).deepEquals({ offset: 0, size: 1 });
    o(await cotar.index.find('tiles/1/1/1.pbf.gz')).deepEquals({ offset: 4, size: 4 });
    o(await cotar.index.find('tiles/1/1/3.pbf.gz')).equals(null);

    const tile0 = await cotar.get('tiles/0/0/0.pbf.gz');
    o(tile0).notEquals(null);
    o(abToChar(tile0, 0)).equals('0');

    const tile1 = await cotar.get('tiles/1/1/1.pbf.gz');
    o(tile1).notEquals(null);
    o(tile1!.byteLength).equals(4);
    o(abToChar(tile1, 0)).equals('4');
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

    const index = await CotarIndex.create(sourceIndex as any);
    const cotar = new Cotar(source as any, index);

    const fileData = await cotar.get('binary.test.js');
    o(fileData).notEquals(null);
    o(Buffer.from(fileData!).toString().startsWith('import {')).equals(true);

    const fakeFile = await cotar.get('fake.file.md');
    o(fakeFile).equals(null);

    // Should validate
    await TarReader.validate(fd, index);
  });
});

o.spec('toNumber', () => {
  o('should fail for large numbers', () => {
    // Closest real "number" is 450359962737049530000
    o(() => toNumber(BigInt('450359962737049530001'))).throws(Error);
    o(() => toNumber(BigInt('450359962737049530002'))).throws(Error);
  });

  o('should not throw for large safe numbers', () => {
    o(toNumber(BigInt('450359962737049530000'))).equals(450359962737049530000);
  });

  o('should work for small bigints', () => {
    for (let i = 0; i < 1_000; i++) {
      o(toNumber(BigInt(i))).equals(i);
    }
  });
});
