import { ChunkSource } from '@chunkd/core';
import fnv1a from '@sindresorhus/fnv1a';
import { CotarIndexRecord } from '../cotar.js';
import { IndexHeaderSize, IndexMagic, IndexV1RecordSize, IndexV2RecordSize } from './format.js';

const Big0 = BigInt(0);
const Big32 = BigInt(32);
const BigUint32Max = BigInt(2 ** 32 - 1);

export function readMetadata(bytes: Uint8Array): CotarMetadata {
  // Version as uint32
  const byteA = bytes[4];
  const byteB = bytes[5] << 8;
  const byteC = bytes[6] << 16;
  const byteD = bytes[7] * 0x1000000;

  const meta: CotarMetadata = {
    magic: String.fromCharCode(bytes[0]) + String.fromCharCode(bytes[1]) + String.fromCharCode(bytes[2]),
    version: bytes[3],
    count: (byteA | byteB | byteC) + byteD,
  };

  return meta;
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
  static HeaderV2 = {
    /** Number of bytes used for the Header/Footer */
    Size: IndexHeaderSize,
    /** Number of bytes used per record */
    Record: IndexV2RecordSize,
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
    if (metadata.version === 1 || metadata.version === 2) return metadata;
    throw new Error(`Invalid source: ${source.uri} invalid version found: ${metadata.version}`);
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
    if (this.metadata.version === 1) return this._findV1(fileName);
    if (this.metadata.version === 2) return this._findV2(fileName);
    throw new Error('Invalid metadata version');
  }

  async _findV2(fileName: string): Promise<CotarIndexRecord | null> {
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

  // TODO(2022-02) this should be removed once we migrate from v1
  async _findV1(fileName: string): Promise<CotarIndexRecord | null> {
    const hash = CotarIndex.hash(fileName);

    const slotCount = this.metadata.count;
    const startIndex = Number(hash % BigInt(slotCount));
    let startHash: bigint | null = null;

    let index = startIndex;
    while (true) {
      const offset = this.sourceOffset + index * IndexV1RecordSize + IndexHeaderSize;
      await this.source.loadBytes(offset, IndexV1RecordSize);
      startHash = this.source.getBigUint64(offset);

      // Found the file
      if (startHash === hash) {
        const fileOffset = this.source.getUint64(offset + 8);
        const fileSize = this.source.getUint64(offset + 16);
        return { offset: fileOffset, size: fileSize };
      }
      // Found a gap in the hash table (file doesnt exist)
      if (startHash === Big0) return null;

      index++;
      // Loop around if we hit the end of the hash table
      if (index >= slotCount) index = 0;
      if (index === startIndex) return null;
    }
  }
}

/**
 * Attempt to convert a bigint to a number
 * throws if the bigint cannot be converted
 */
export function toNumber(input: bigint): number {
  const output = Number(input);
  const num = BigInt(output.toString());
  if (num !== input) throw new Error('Failed to convert bigint:' + output + ' to a number');
  return output;
}
