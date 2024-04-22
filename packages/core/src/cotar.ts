import { Source } from '@chunkd/source';

import { CotarIndex } from './binary.index.js';
import { IndexSize, IndexV2RecordSize } from './format.js';

export interface CotarIndexRecord {
  offset: number;
  size: number;
}

export class Cotar {
  source: Source;
  index: CotarIndex;

  /**
   * @param source Chunked source of the tar files
   * @param index
   */
  constructor(source: Source, index: CotarIndex) {
    this.source = source;
    this.index = index;
  }

  /**
   * Create a cotar using two sources, one for the tar, one for the index
   *
   * @param source the tar asset file generally a file ending with ".tar"
   * @param index the tar index generally a file ending with ".tar.index"
   *
   * @returns a Cotar instance
   *
   */
  static async fromTarIndex(source: Source, index: Source): Promise<Cotar> {
    const metadata = await CotarIndex.create(index);
    return new Cotar(source, metadata);
  }

  /**
   * Create a cotar from a single archive, generally a ".tar.co"
   *
   * @param source asset containing both the tar and the tar index.
   *
   * @returns a Cotar instance
   */
  static async fromTar(source: Source): Promise<Cotar> {
    // Load the last file in the tar archive
    const metadata = await CotarIndex.getMetadata(source, 0, false);
    const stat = await source.head();
    if (stat == null || stat.size == null) throw new Error(`Failed to fetch metadata for ${source.url}`);

    const metadataSize = IndexV2RecordSize;
    const startOffset = stat.size - (metadata.count * metadataSize + IndexSize);
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

    return await this.source.fetch(index.offset, index.size);
  }
}
