import { SourceMemory } from '@cogeotiff/chunk';
import * as fh from 'farmhash';
import o from 'ospec';
import path from 'path';
import { CotarIndexBinary, IndexHeaderSize, IndexRecordSize } from '..';
import { Cotar } from '../../cotar';
import * as cp from 'child_process';
import { promises as fs } from 'fs';
import { FileHandle } from 'fs/promises';
import { SourceFile } from '@cogeotiff/source-file';
import { CotarIndexBinaryBuilder, toArrayBuffer } from '../build.binary';

function abToChar(buf: ArrayBuffer | null, offset: number): string | null {
  if (buf == null) return null;
  return String.fromCharCode(new Uint8Array(buf)[offset]);
}

o.spec('CotarBinary.fake', () => {
  o('should load a tile from fake index', async () => {
    // Manually create a fake binary index
    const files = [
      { path: 'tiles/0/0/0.pbf.gz', offset: 0, size: 1 },
      { path: 'tiles/1/1/1.pbf.gz', offset: 4, size: 4 },
    ];

    const indexSize = 4;
    const tarIndex: Buffer = Buffer.alloc(indexSize * IndexRecordSize + IndexHeaderSize);

    for (const record of files) {
      const hash = BigInt(fh.hash64(record.path));
      const index = Number(hash % BigInt(indexSize));
      const offset = index * IndexRecordSize + IndexHeaderSize;
      tarIndex.writeBigUInt64LE(hash, offset);
      tarIndex.writeUInt32LE(record.offset, offset + 8);
      tarIndex.writeUInt32LE(record.size, offset + 12);
    }
    tarIndex.writeUInt32LE(indexSize);

    const cotar = new Cotar(
      new SourceMemory('Tar', toArrayBuffer(Buffer.from('0123456789'))),
      new CotarIndexBinary(new SourceMemory('index', toArrayBuffer(tarIndex))),
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
    const res = await CotarIndexBinaryBuilder.create(fd);
    o(res.count).equals(3);
    await fs.writeFile(tarFileIndexPath, res.buffer);

    const source = new SourceFile(tarFilePath);
    const sourceIndex = new SourceFile(tarFileIndexPath);

    const cotar = new Cotar(source, new CotarIndexBinary(sourceIndex));

    const fileData = await cotar.get('binary.test.js');
    o(fileData).notEquals(null);
    o(Buffer.from(fileData!).toString().startsWith('"use strict"')).equals(true);

    const fakeFile = await cotar.get('fake.file.md');
    o(fakeFile).equals(null);
  });
});
