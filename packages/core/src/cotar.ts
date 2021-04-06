import { ChunkSource, LogType } from '@cogeotiff/chunk';
import { TarIndexRecord } from './tar.index';

export class Cotar {
  source: ChunkSource;

  index: Map<string, TarIndexRecord> = new Map();

  constructor(source: ChunkSource) {
    this.source = source;
  }

  protected async loadIndex(index: TarIndexRecord[]): Promise<Cotar> {
    // console.time('LoadIndex:Map');
    for (const r of index) this.index.set(r[0], r);
    // console.timeEnd('LoadIndex:Map');
    return this;
  }

  static async create(source: ChunkSource, index: TarIndexRecord[]): Promise<Cotar> {
    return new Cotar(source).loadIndex(index);
  }

  async get(fileName: string, l?: LogType): Promise<null | { buffer: ArrayBuffer; contentType: string }> {
    const index = this.index.get(fileName);
    if (index == null) return null;

    const [, offset, size] = index;
    await this.source.loadBytes(offset, size, l);
    const buffer = this.source.bytes(offset, size);

    return { buffer, contentType: 'application/gzip' };
  }
}
