import { ChunkSource, LogType } from '@cogeotiff/chunk';

export interface CotarIndexRecord {
  offset: number;
  size: number;
}
export interface CotarIndex {
  size: number;
  find(fileName: string): Promise<CotarIndexRecord | null>;
}

export class Cotar {
  source: ChunkSource;

  index: CotarIndex;

  /**
   * @param source Chunked source of the tar files
   * @param index Raw NDJSON lines of the index
   */
  constructor(source: ChunkSource, index: CotarIndex) {
    this.source = source;
    this.index = index;
  }

  /**
   * Read a file from a cotar
   * @param fileName File to read
   * @param l optional logger for additional trace metrics
   * @returns the file's contents or null if it cannot be found
   */
  async get(fileName: string, l?: LogType): Promise<null | ArrayBuffer> {
    const index = await this.index.find(fileName);
    if (index == null) return null;

    await this.source.loadBytes(index.offset, index.size, l);
    return this.source.bytes(index.offset, index.size);
  }
}
