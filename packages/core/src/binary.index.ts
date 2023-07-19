import { ChunkSource } from '@chunkd/core';
import fnv1a from '@sindresorhus/fnv1a';
import { CotarIndexRecord } from './cotar.js';
import { IndexHeaderSize, IndexMagic, IndexV2RecordSize } from './format.js';

const Big32 = BigInt(32);
const BigUint32Max = BigInt(2 ** 32 - 1);

export function readMetadata(bytes: Uint8Array): CotarMetadata {
  // Read the first three bytes as magic 'COT' string
  const magic = String.fromCharCode(bytes[0]) + String.fromCharCode(bytes[1]) + String.fromCharCode(bytes[2]);

  // Version number is a uint8
  const version = bytes[3];

  // Record count from uint32
  const byteA = bytes[4];
  const byteB = bytes[5] << 8;
  const byteC = bytes[6] << 16;
  const byteD = bytes[7] * 0x1000000;
  return {
    magic,
    version,
    count: (byteA | byteB | byteC) + byteD,
  };
}

export type CotarMetadata = {
  /** Magic string "COT" */
  magic: string;
  /** Cotar version */
  version: number;
  /** Number of slots in the path name hash map */
  count: number;
};

export class CotarIndex {
  static Header = {
    /** Number of bytes used for the Header/Footer */
    Size: IndexHeaderSize,
    /** Number of bytes used per record */
    Record: IndexV2RecordSize,
    Magic: IndexMagic,
  };
  source: ChunkSource;
  sourceOffset: number;

  /** Should the metadata be read from the header or the footer */
  isHeader = true;
  metadata: CotarMetadata;

  constructor(source: ChunkSource, metadata: CotarMetadata, sourceOffset = 0) {
    this.source = source;
    this.sourceOffset = sourceOffset;
    this.metadata = metadata;
  }

  static hash(path: string): bigint {
    return fnv1a(path, { size: 64 });
  }

  static async loadMetadata(source: ChunkSource, sourceOffset: number, isHeader: boolean): Promise<CotarMetadata> {
    if (isHeader) {
      await source.loadBytes(sourceOffset, source.chunkSize);
      const bytes = source.bytes(sourceOffset, IndexHeaderSize);
      return readMetadata(bytes);
    }

    // TODO ideally this would a file inside the tar
    // however different tar programs seem to have differing suffixes some have "2x512" bytes of 0 others pad them out further
    const bytes = await source.fetchBytes(-IndexHeaderSize);
    return readMetadata(new Uint8Array(bytes));
  }

  static async getMetadata(source: ChunkSource, sourceOffset: number, isHeader: boolean): Promise<CotarMetadata> {
    const metadata = await this.loadMetadata(source, sourceOffset, isHeader);
    if (metadata.magic !== IndexMagic) {
      throw new Error(`Invalid source: ${source.uri} invalid magic found: ${metadata.magic}`);
    }
    if (metadata.version !== 2) {
      throw new Error(`Invalid source: ${source.uri} invalid version found: ${metadata.version}`);
    }
    return metadata;
  }

  static async create(source: ChunkSource, sourceOffset = 0, isHeader = true): Promise<CotarIndex> {
    const metadata = await this.getMetadata(source, sourceOffset, isHeader);
    return new CotarIndex(source, metadata, sourceOffset);
  }

  /**
   * Search the index looking for the file
   * @param fileName file to search for
   * @returns the index if found, null otherwise
   */
  async find(fileName: string): Promise<CotarIndexRecord | null> {
    const hash = CotarIndex.hash(fileName);

    const slotCount = this.metadata.count;
    const startIndex = Number(hash % BigInt(slotCount));

    // working with u64 is sometimes hard, split into two u32s
    const hashHigh = Number(hash >> Big32);
    const hashLow = Number(hash & BigUint32Max);
    let startHashHigh: number | null = null;
    let startHashLow: number | null = null;

    let index = startIndex;
    while (true) {
      const offset = this.sourceOffset + index * IndexV2RecordSize + IndexHeaderSize;
      await this.source.loadBytes(offset, IndexV2RecordSize);

      startHashLow = this.source.getUint32(offset);
      startHashHigh = this.source.getUint32(offset + 4);

      // Found the file
      if (startHashHigh === hashHigh && startHashLow === hashLow) {
        // Tar offsets are block aligned to 512byte blocks
        const fileOffset = this.source.getUint32(offset + 8) * 512;
        const fileSize = this.source.getUint32(offset + 12);
        return { offset: fileOffset, size: fileSize };
      }
      // Found a gap in the hash table (file doesn't exist)
      if (startHashHigh === 0 && startHashLow === 0) return null;

      index++;
      // Loop around if we hit the end of the hash table
      if (index >= slotCount) index = 0;
      if (index === startIndex) return null;
    }
  }
}
