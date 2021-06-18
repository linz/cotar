import { ChunkSource } from '@cogeotiff/chunk';
import { CotarIndex } from './cotar';
import { IndexHeaderSize, IndexRecordSize } from './tar';
import * as fh from 'farmhash';

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
  async find(fileName: string): Promise<{ offset: number; size: number } | null> {
    const hash = BigInt(fh.hash64(fileName));

    await this.source.loadBytes(0, IndexHeaderSize);
    const slotCount = this.size;
    const startIndex = Number(hash % BigInt(slotCount));
    let startHash: BigInt | null = null;

    let index = startIndex;
    while (true) {
      const offset = index * IndexRecordSize + IndexHeaderSize;
      await this.source.loadBytes(offset, IndexRecordSize);
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
