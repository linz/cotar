import assert from 'node:assert';
import { describe, it } from 'node:test';
import { readMetadata } from '../../binary.index.js';
import { SourceMemory } from '@chunkd/source-memory';

const Example = {
  v1: {
    buf: Buffer.from('Q09UAdIClkk=', 'base64'),
    header: {
      magic: 'COT',
      count: 1234567890,
      version: 1,
    },
  },
  v2: {
    buf: Buffer.from('Q09UAtIClkk=', 'base64'),
    header: {
      magic: 'COT',
      count: 1234567890,
      version: 2,
    },
  },
};

describe('CotarBinaryHeaderFooter', () => {
  it('should create a standard header', () => {
    const header = Buffer.alloc(8);
    const count = 1234567890;
    header.write('COT', 0);
    header.writeUInt8(2, 3);
    header.writeUInt32LE(count, 4);
    assert.equal(header.toString('base64'), Example.v2.buf.toString('base64'));
  });

  it('should parse v1 header', () => {
    const header = readMetadata(SourceMemory.toArrayBuffer(Example.v1.buf));
    assert.deepEqual(header, Example.v1.header);
  });

  it('should parse v2 header', () => {
    const header = readMetadata(SourceMemory.toArrayBuffer(Example.v2.buf));
    assert.deepEqual(header, Example.v2.header);
  });
});
