import { ChunkSource, LogType } from '@cogeotiff/chunk';
import { TarIndexRecord } from './tar.index';

export class Cotar {
  source: ChunkSource;

  index: Map<string, TarIndexRecord> = new Map();
  indexSource: string[];

  /**
   * @param source Chunked source of the tar files
   * @param index Raw NDJSON lines of the index
   */
  constructor(source: ChunkSource, index: string[]) {
    this.source = source;
    this.indexSource = index;
  }

  /** Search the raw input data looking for the line that  */
  find(fileName: string, low = 0, high = this.indexSource.length - 1): TarIndexRecord | null {
    const searchString = `["${fileName}"`;

    if (low > high) return null;
    const mid = Math.floor((low + high) / 2);
    const midData = this.indexSource[mid];

    const testString = midData.slice(0, searchString.length);

    if (searchString === testString) return JSON.parse(midData);
    if (searchString < testString) return this.find(fileName, low, mid - 1);
    return this.find(fileName, mid + 1, high);
  }

  async get(fileName: string, l?: LogType): Promise<null | ArrayBuffer> {
    const index = this.find(fileName);
    if (index == null) return null;

    const [, offset, size] = index;
    await this.source.loadBytes(offset, size, l);
    return this.source.bytes(offset, size);
  }
}
