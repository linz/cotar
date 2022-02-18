import o from 'ospec';
import { writeHeaderFooter } from '../binary.index.builder.js';
import { CotarMetadataParser } from '../binary.index.js';

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

o.spec('CotarBinaryHeaderFooter', () => {
  o('should create a standard header', () => {
    const header = Buffer.alloc(8);
    const count = 1234567890;
    header.write('COT', 0);
    header.writeUInt8(2, 3);
    header.writeUInt32LE(count, 4);
    o(header.toString('base64')).equals(Example.v2.buf.toString('base64'));
  });

  o('should parse v1 header', () => {
    const header = CotarMetadataParser.read(Example.v1.buf);
    o(header.offset).equals(8);
    o(header.value).deepEquals(Example.v1.header);
  });

  o('should parse v2 header', () => {
    const header = CotarMetadataParser.read(Example.v2.buf);
    o(header.offset).equals(8);
    o(header.value).deepEquals(Example.v2.header);
  });

  o('should write a header and a footer', () => {
    const buf = Buffer.alloc(32);
    writeHeaderFooter(buf, Example.v2.header.count);

    const buf64 = buf.toString('base64');
    console.log(buf64);
    // Should start and end with the same data
    o(buf64.startsWith('Q09UAtIClkk')).equals(true);
    o(buf64.endsWith('Q09UAtIClkk=')).equals(true);

    const headStart = CotarMetadataParser.read(buf);
    const headEnd = CotarMetadataParser.read(buf, buf.length - 8);

    o(headStart.value).deepEquals(Example.v2.header);
    o(headEnd.value).deepEquals(Example.v2.header);
  });
});
