import o from 'ospec';
import { CotarMetadataParser } from '..';
import { writeHeaderFooter } from '../build.binary';

const Example = {
  v1: {
    buf: Buffer.from('Q09UAdIClkk=', 'base64'),
    header: {
      magic: 'COT',
      count: 1234567890,
      version: 1,
    },
  },
};

o.spec('CotarBinaryHeaderFooter', () => {
  o('should create a standard header', () => {
    const header = Buffer.alloc(8);
    const count = 1234567890;
    header.write('COT', 0);
    header.writeUInt8(1, 3);
    header.writeUInt32LE(count, 4);
    o(header.toString('base64')).equals(Example.v1.buf.toString('base64'));
  });

  o('should parse v1 header', () => {
    const header = CotarMetadataParser.read(Example.v1.buf);
    o(header.offset).equals(8);
    o(header.value).deepEquals(Example.v1.header);
  });

  o('should write a header and a footer', () => {
    const buf = Buffer.alloc(32);
    writeHeaderFooter(buf, Example.v1.header.count);

    const buf64 = buf.toString('base64');
    // Should start and end with the same data
    o(buf64.startsWith('Q09UAdIClkk')).equals(true);
    o(buf64.endsWith('Q09UAdIClkk=')).equals(true);

    const headStart = CotarMetadataParser.read(buf);
    const headEnd = CotarMetadataParser.read(buf, buf.length - 8);

    o(headStart.value).deepEquals(Example.v1.header);
    o(headEnd.value).deepEquals(Example.v1.header);
  });
});
