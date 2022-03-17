import { ChunkSource } from '@chunkd/core';
import { CotarIndex } from './binary/binary.index.js';
import { IndexV2RecordSize, IndexSize, IndexV1RecordSize } from './binary/format.js';

export interface CotarIndexRecord {
  offset: number;
  size: number;
}

export class Cotar {
  source: ChunkSource;
  index: CotarIndex;

  /**
   * @param source Chunked source of the tar files
   * @param index
   */
  constructor(source: ChunkSource, index: CotarIndex) {
    this.source = source;
    this.index = index;
  }

  static async fromTar(source: ChunkSource): Promise<Cotar> {
    // Load the last file in the tar archive
    const metadata = await CotarIndex.getMetadata(source, 0, false);
    const size = await source.size;

    const metadataSize = metadata.version === 1 ? IndexV1RecordSize : IndexV2RecordSize;
    const startOffset = size - (metadata.count * metadataSize + IndexSize);
    const index = new CotarIndex(source, metadata, startOffset);

    return new Cotar(source, index);
  }

  /**
   * Read a file from a cotar
   * @param fileName File to read
   * @returns the file's contents or null if it cannot be found
   */
  async get(fileName: string): Promise<null | ArrayBuffer> {
    const index = await this.index.find(fileName);
    if (index == null) return null;

    await this.source.loadBytes(index.offset, index.size);
    return this.source.bytes(index.offset, index.size);
  }
}
