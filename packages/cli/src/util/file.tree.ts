import { ChunkSource } from '@chunkd/core';
import { TarReader } from '@cotar/core';
import path from 'path';

function toFolderName(f: string): string {
  if (!f.startsWith('/')) f = '/' + f;
  if (!f.endsWith('/')) f = f + '/';
  return f;
}

/** Create a tree from a tar file */
export class FileTree {
  nodes: Map<string, Set<string>> = new Map();
  source: ChunkSource;
  constructor(source: ChunkSource) {
    this.source = source;
  }

  getBytes = async (offset: number, count: number): Promise<Buffer> => {
    await this.source.loadBytes(offset, count);
    const bytes = await this.source.bytes(offset, count);
    return Buffer.from(bytes);
  };

  async init(): Promise<void> {
    for await (const ctx of TarReader.iterate(this.getBytes)) {
      const dirname = toFolderName(path.dirname(ctx.header.path));
      let existing = this.nodes.get(dirname);
      if (existing == null) {
        existing = new Set();
        this.nodes.set(dirname, existing);
      }
      existing.add(ctx.header.path.startsWith('/') ? ctx.header.path : '/' + ctx.header.path);

      let current = '/';
      const parts = ctx.header.path.split('/');
      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        existing = this.nodes.get(current);
        if (existing == null) {
          existing = new Set();
          this.nodes.set(current, existing);
        }
        const next = toFolderName(path.join(current, part));
        existing.add(next);
        current = next;
      }
    }
  }

  async list(pathName: string): Promise<Set<string> | undefined> {
    if (this.nodes.size === 0) await this.init();
    return this.nodes.get(toFolderName(pathName));
  }
}
