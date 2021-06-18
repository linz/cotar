import { ChunkSource } from '@cogeotiff/chunk';

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
