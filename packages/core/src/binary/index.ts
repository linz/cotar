import { ChunkSource, LogType } from '@cogeotiff/chunk';
import { CotarIndex, CotarIndexRecord } from '../cotar';
import * as fh from 'farmhash';

// 8 bytes hash, 4 bytes file offset, 4 bytes file size
export const IndexRecordSize = 16;
// 4 bytes of total files indexed
export const IndexHeaderSize = 4;

export class CotarIndexBinary implements CotarIndex {
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
      const record = new DataView(this.source.bytes(offset, IndexRecordSize).buffer);
      startHash = record.getBigUint64(0, true);
      if (startHash === hash) return { offset: record.getUint32(8, true), size: record.getUint32(12, true) };
      if (startHash == null) return null;
      index++;
      if (index >= slotCount) index = 0;

      if (index === startIndex) return null; // Looped?
    }
  }
}
