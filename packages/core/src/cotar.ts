import { ChunkSource, LogType } from '@chunkd/core';
import { CotarIndex } from './binary/binary.index';
import { IndexRecordSize, IndexSize } from './binary/format';

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
    const startOffset = size - (metadata.count * IndexRecordSize + IndexSize);
    const index = new CotarIndex(source, metadata.count, startOffset);

    return new Cotar(source, index);
  }

  /**
   * Read a file from a cotar
   * @param fileName File to read
   * @param logger optional logger for additional trace metrics
   * @returns the file's contents or null if it cannot be found
   */
  async get(fileName: string, logger?: LogType): Promise<null | ArrayBuffer> {
    const index = await this.index.find(fileName, logger);
    if (index == null) return null;

    await this.source.loadBytes(index.offset, index.size, logger);
    return this.source.bytes(index.offset, index.size);
  }
}
