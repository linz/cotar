import { ChunkSource, LogType } from '@cogeotiff/chunk';
import { TarIndexRecord } from './tar.index';

export class Cotar {
  source: ChunkSource;

  index: Map<string, TarIndexRecord> = new Map();
  indexSource: TarIndexRecord[];

  constructor(source: ChunkSource, index: TarIndexRecord[]) {
    this.source = source;
    this.indexSource = index;
  }

  /** Initialize the cache */
  init(): void {
    if (this.index.size > 0) return;
    for (const r of this.indexSource) this.index.set(r[0], r);
  }

  static async create(source: ChunkSource, index: TarIndexRecord[]): Promise<Cotar> {
    const cotar = new Cotar(source, index);
    cotar.init();
    return cotar;
  }

  async get(fileName: string, l?: LogType): Promise<null | ArrayBuffer> {
    const index = this.index.get(fileName);
    if (index == null) return null;

    const [, offset, size] = index;
    await this.source.loadBytes(offset, size, l);
    return this.source.bytes(offset, size);
  }
}
