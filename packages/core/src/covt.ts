import { ChunkSource, LogType } from '@cogeotiff/chunk';
import { TarIndexRecord } from './tar.index';
import { xyzToPath } from './tile.name';

export class Covt {
  source: ChunkSource;
  sourceIndex: ChunkSource;

  index: Map<string, TarIndexRecord> = new Map();

  constructor(source: ChunkSource) {
    this.source = source;
  }

  protected async loadIndex(index: TarIndexRecord[]): Promise<Covt> {
    // console.time('LoadIndex:Map');
    for (const r of index) this.index.set(r[0], r);
    // console.timeEnd('LoadIndex:Map');
    return this;
  }

  static async create(source: ChunkSource, index: TarIndexRecord[]): Promise<Covt> {
    return new Covt(source).loadIndex(index);
  }

  async getTile(
    x: number,
    y: number,
    z: number,
    l?: LogType,
  ): Promise<null | { buffer: ArrayBuffer; contentType: 'application/gzip' }> {
    const tileName = xyzToPath(x, y, z);

    const index = this.index.get(tileName);
    if (index == null) return null;

    const [, offset, size] = index;
    await this.source.loadBytes(offset, size, l);
    const buffer = this.source.bytes(offset, size);

    return { buffer, contentType: 'application/gzip' };
  }
}
