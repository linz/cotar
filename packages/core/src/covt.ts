import { ChunkSource, LogType } from '@cogeotiff/chunk';
import { TarIndex } from './tar.index';
import { xyzToPath } from './tile.name';

const utf8Decoder = new TextDecoder('utf-8');

export class Covt {
  source: ChunkSource;
  sourceIndex: ChunkSource;

  _index: TarIndex;

  constructor(source: ChunkSource, sourceIndex: ChunkSource) {
    this.source = source;
    this.sourceIndex = sourceIndex;
  }

  get index(): TarIndex {
    if (this._index == null) throw new Error('Covt index is not initialized');
    return this._index;
  }

  protected async loadIndex(): Promise<Covt> {
    const bytes = await this.sourceIndex.read();
    this._index = JSON.parse(utf8Decoder.decode(bytes));
    return this;
  }

  static async create(source: ChunkSource, sourceIndex: ChunkSource): Promise<Covt> {
    return new Covt(source, sourceIndex).loadIndex();
  }

  async getTile(
    x: number,
    y: number,
    z: number,
    l?: LogType,
  ): Promise<null | { buffer: ArrayBuffer; mimeType: 'application/gzip' }> {
    const tileName = xyzToPath(x, y, z);

    const index = this.index[tileName];
    if (index == null) return null;

    await this.source.loadBytes(index.o, index.s, l);
    const buffer = this.source.bytes(index.o, index.s);

    return { buffer, mimeType: 'application/gzip' };
  }
}
