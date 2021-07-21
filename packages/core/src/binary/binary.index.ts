import { ChunkSource, LogType } from '@cogeotiff/chunk';
import * as fh from 'farmhash';
import { CotarIndex, CotarIndexRecord } from '../cotar';
import { CotarIndexType } from '../tar.index';

// 8 bytes hash, 4 bytes file offset, 4 bytes file size
export const IndexRecordSize = 16;
// 4 bytes of total files indexed
export const IndexHeaderSize = 4;

const Big0 = BigInt(0);
const Big32 = BigInt(32);

export class CotarIndexBinary implements CotarIndex {
  type = CotarIndexType.Binary;
  source: ChunkSource;
  constructor(source: ChunkSource) {
    this.source = source;
  }

  get size(): number {
    return this.source.uint32(0);
  }
  /**
   * Search the index looking for the file
   * @param fileName file to search for
   * @returns the index if found, null otherwise
   */
  async find(fileName: string, logger?: LogType): Promise<CotarIndexRecord | null> {
    const hash = BigInt(fh.hash64(fileName));

    await this.source.loadBytes(0, IndexHeaderSize);
    const slotCount = this.size;
    const startIndex = Number(hash % BigInt(slotCount));
    let startHash: BigInt | null = null;

    let index = startIndex;
    while (true) {
      const offset = index * IndexRecordSize + IndexHeaderSize;
      await this.source.loadBytes(offset, IndexRecordSize, logger);
      const hashA = BigInt(this.source.uint32(offset));
      const hashB = BigInt(this.source.uint32(offset + 4)) << Big32;
      startHash = hashA + hashB;

      if (startHash === hash) return { offset: this.source.uint32(offset + 8), size: this.source.uint32(offset + 12) };
      if (startHash === Big0) return null;

      index++;
      if (index >= slotCount) index = 0;
      if (index === startIndex) return null;
    }
  }
}
