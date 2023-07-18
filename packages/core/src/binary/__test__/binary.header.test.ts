import { describe, it } from 'node:test';
import assert from 'node:assert';
import { writeHeaderFooter } from '../binary.index.builder.js';
import { readMetadata } from '../binary.index.js';

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
    const header = readMetadata(Example.v1.buf);
    assert.deepEqual(header, Example.v1.header);
  });

  it('should parse v2 header', () => {
    const header = readMetadata(Example.v2.buf);
    assert.deepEqual(header, Example.v2.header);
  });

  it('should write a header and a footer', () => {
    const buf = Buffer.alloc(32);
    writeHeaderFooter(buf, Example.v2.header.count);

    const buf64 = buf.toString('base64');
    // Should start and end with the same data
    assert.equal(buf64.startsWith('Q09UAtIClkk'), true);
    assert.equal(buf64.endsWith('Q09UAtIClkk='), true);

    const headStart = readMetadata(buf);
    const headEnd = readMetadata(buf.slice(buf.length - 8));

    assert.deepEqual(headStart, Example.v2.header);
    assert.deepEqual(headEnd, Example.v2.header);
  });
});
