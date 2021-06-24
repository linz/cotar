import { LogType } from '@cogeotiff/chunk';
import { CotarIndex, CotarIndexRecord } from '../cotar';
import { CotarIndexType } from '../tar.index';

export class CotarIndexNdjson implements CotarIndex {
  type = CotarIndexType.Ndjson;
  source: string[];
  constructor(source: string) {
    this.source = source.split('\n');
  }

  get size(): number {
    return this.source.length;
  }
  /**
   * Search the index looking for the file
   * @param fileName file to search for
   * @returns the index if found, null otherwise
   */
  find(fileName: string, logger?: LogType, low = 0, high = this.source.length - 1): Promise<CotarIndexRecord | null> {
    const searchString = `["${fileName}"`;

    if (low > high) return Promise.resolve(null);
    const mid = Math.floor((low + high) / 2);
    const midData = this.source[mid];

    const testString = midData.slice(0, searchString.length);

    if (searchString === testString) {
      const index = JSON.parse(midData);
      return Promise.resolve({ offset: index[1], size: index[2] });
    }
    if (searchString < testString) return this.find(fileName, logger, low, mid - 1);
    return this.find(fileName, logger, mid + 1, high);
  }
}
