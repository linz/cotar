import { ChunkSource } from '@cogeotiff/chunk';
import o from 'ospec';
import { Covt } from '../covt';
import { TarIndex } from '../tar.index';

export class MemorySource extends ChunkSource {
  chunkSize: number;
  uri: string;
  name: string;
  type = 'Memory';

  data: ArrayBuffer;

  constructor(name: string, data: string) {
    super();
    this.name = name;
    this.uri = name;

    this.data = new TextEncoder().encode(data).buffer;
    this.chunkSize = data.length;
  }
  protected async fetchBytes(offset: number, length: number): Promise<ArrayBuffer> {
    return this.data.slice(offset, offset + length);
  }
  protected async fetchAllBytes(): Promise<ArrayBuffer> {
    return this.data;
  }
}

o.spec('Covt', () => {
  const tarIndex: TarIndex = { 'tiles/0/0/0.pbf': { o: 0, s: 1 }, 'tiles/1/1/1.pbf': { o: 4, s: 4 } };
  const sourceIndex = new MemorySource('TarIndex', JSON.stringify(tarIndex));
  o('should load index', async () => {
    const covt = await Covt.create(new MemorySource('Tar', '0123456789'), sourceIndex);
    o(covt.index).deepEquals(tarIndex);
  });
  o('should load a tile', async () => {
    const covt = await Covt.create(new MemorySource('Tar', '0123456789'), sourceIndex);
    o(covt.index).deepEquals(tarIndex);

    const tile0 = await covt.getTile(0, 0, 0);
    o(tile0).notEquals(null);
    o(new Uint8Array(tile0!.buffer)[0]).deepEquals('0'.charCodeAt(0));

    const tile1 = await covt.getTile(1, 1, 1);
    o(tile1).notEquals(null);
    o(tile1!.buffer.byteLength).equals(4);
    o(new Uint8Array(tile1!.buffer)[0]).deepEquals('4'.charCodeAt(0));
  });
});
