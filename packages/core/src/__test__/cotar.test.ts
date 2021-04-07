import { ChunkSource } from '@cogeotiff/chunk';
import o from 'ospec';
import { Cotar } from '../cotar';
import { TarIndex } from '../tar.index';

export class MemorySource extends ChunkSource {
  chunkSize: number;
  uri: string;
  name: string;
  type = 'Memory';

  data: ArrayBuffer;

  constructor(name: string, data: string | Buffer) {
    super();
    this.name = name;
    this.uri = name;

    if (typeof data === 'string') this.data = new TextEncoder().encode(data).buffer;
    if (Buffer.isBuffer(data)) this.data = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
    this.chunkSize = this.data.byteLength;
  }
  protected async fetchBytes(offset: number, length: number): Promise<ArrayBuffer> {
    return this.data.slice(offset, offset + length);
  }
  protected async fetchAllBytes(): Promise<ArrayBuffer> {
    return this.data;
  }
}

o.spec('Cotar', () => {
  const tarIndex: TarIndex = [
    ['tiles/0/0/0.pbf.gz', 0, 1],
    ['tiles/1/1/1.pbf.gz', 4, 4],
  ];
  o('should load index', async () => {
    const cotar = await Cotar.create(new MemorySource('Tar', '0123456789'), tarIndex);

    o(cotar.index.get(tarIndex[0][0])).deepEquals(tarIndex[0]);
    o(cotar.index.get(tarIndex[1][0])).deepEquals(tarIndex[1]);
  });
  o('should load a tile', async () => {
    const cotar = await Cotar.create(new MemorySource('Tar', '0123456789'), tarIndex);
    o(cotar.index.get(tarIndex[0][0])).deepEquals(tarIndex[0]);
    o(cotar.index.get(tarIndex[1][0])).deepEquals(tarIndex[1]);

    const tile0 = await cotar.get('tiles/0/0/0.pbf.gz');
    o(tile0).notEquals(null);
    o(new Uint8Array(tile0!)[0]).deepEquals('0'.charCodeAt(0));

    const tile1 = await cotar.get('tiles/1/1/1.pbf.gz');
    o(tile1).notEquals(null);
    o(tile1!.byteLength).equals(4);
    o(new Uint8Array(tile1!)[0]).deepEquals('4'.charCodeAt(0));
  });
});
