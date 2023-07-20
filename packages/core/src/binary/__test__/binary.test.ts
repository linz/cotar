import { SourceMemory } from '@chunkd/source-memory';
import fnv1a from '@sindresorhus/fnv1a';
import assert from 'node:assert';
import { describe, it } from 'node:test';
import { CotarIndex } from '../../binary.index.js';
import { Cotar } from '../../cotar.js';
import { IndexHeaderSize, IndexMagic, IndexSize, IndexV2RecordSize, IndexVersion } from '../../format.js';

function abToChar(buf: ArrayBuffer | null, offset: number): string | null {
  if (buf == null) return null;
  return String.fromCharCode(new Uint8Array(buf)[offset]);
}

export function writeHeaderFooter(output: Buffer, count: number, version = IndexVersion): void {
  if (output.length < IndexSize * 2) {
    throw new Error('Buffer is too small for CotarHeader, minimum size: ' + IndexSize * 2);
  }
  // Write the header at the start of the buffer
  output.write(IndexMagic, 0);
  output.writeUInt8(version, 3);
  output.writeUInt32LE(count, 4);

  // Write the header at the end of the buffer
  output.write(IndexMagic, output.length - 8);
  output.writeUInt8(version, output.length - 5);
  output.writeUInt32LE(count, output.length - 4);
}

const ExpectedRecordV2 =
  'Q09UAgQAAAB0wPmDP22WfQIAAAAIAAAAAAAAAAAAAAAAAAAAAAAAACZjB1u0iLSnAAAAAAEAAAC/I5YiYFMqNwEAAAAEAAAAQ09UAgQAAAA=';

describe('CotarBinary.fake', () => {
  const TestFiles = [
    { path: 'tiles/0/0/0.pbf.gz', offset: 0, size: 1 },
    { path: 'tiles/1/1/1.pbf.gz', offset: 512, size: 4 },
    { path: 'tiles/1/1/2.pbf.gz', offset: 1024, size: 8 },
  ];
  const TestFileSize = TestFiles.length + 1;

  const tarIndexV2: Buffer = Buffer.alloc(TestFileSize * IndexV2RecordSize + IndexHeaderSize * 2);

  for (const record of TestFiles) {
    const hash = fnv1a(record.path, { size: 64 });
    const index = Number(hash % BigInt(TestFileSize));

    const offsetV2 = index * IndexV2RecordSize + IndexHeaderSize;
    tarIndexV2.writeBigUInt64LE(hash, offsetV2);
    tarIndexV2.writeUInt32LE(record.offset / 512, offsetV2 + 8);
    tarIndexV2.writeUInt32LE(record.size, offsetV2 + 12);
  }
  writeHeaderFooter(tarIndexV2, TestFileSize, 2);

  it('should load a tile from fake v2 index', async () => {
    assert.equal(tarIndexV2.toString('base64'), ExpectedRecordV2);

    const cotar = new Cotar(
      new SourceMemory(new URL('memory://tar'), Buffer.from('0123456789')),
      await CotarIndex.create(new SourceMemory(new URL('memory://index'), tarIndexV2)),
    );

    assert.deepEqual(await cotar.index.find('tiles/0/0/0.pbf.gz'), { offset: 0, size: 1 });
    assert.deepEqual(await cotar.index.find('tiles/1/1/1.pbf.gz'), { offset: 512, size: 4 });
    assert.deepEqual(await cotar.index.find('tiles/1/1/2.pbf.gz'), { offset: 1024, size: 8 });
    assert.equal(await cotar.index.find('tiles/1/1/3.pbf.gz'), null);

    const tile0 = await cotar.get('tiles/0/0/0.pbf.gz');
    assert.notEqual(tile0, null);
    assert.equal(abToChar(tile0, 0), '0');
  });

  it('should load v2 from a combined tar & header', async () => {
    const tar = Buffer.concat([Buffer.from('0123456789'), tarIndexV2]);
    const source = new SourceMemory(new URL('memory://combined'), tar);
    const cotar = await Cotar.fromTar(source);
    // assert.equal(cotar.index.sourceOffset, 10);
    assert.deepEqual(cotar.index.metadata, { magic: 'COT', version: 2, count: 4 });

    assert.deepEqual(await cotar.index.find('tiles/0/0/0.pbf.gz'), { offset: 0, size: 1 });
    assert.deepEqual(await cotar.index.find('tiles/1/1/1.pbf.gz'), { offset: 512, size: 4 });
    assert.deepEqual(await cotar.index.find('tiles/1/1/2.pbf.gz'), { offset: 1024, size: 8 });
    assert.equal(await cotar.index.find('tiles/1/1/3.pbf.gz'), null);

    const tile0 = await cotar.get('tiles/0/0/0.pbf.gz');
    assert.notEqual(tile0, null);
    assert.equal(abToChar(tile0, 0), '0');
  });
});
