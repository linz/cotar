import { Source } from '@chunkd/source';
import { TarReader } from '@cotar/builder';
import path from 'path';

function toFolderName(f: string): string {
  if (f === '.') return '/';
  if (!f.startsWith('/')) f = '/' + f;
  if (!f.endsWith('/')) f = f + '/';
  return f;
}

/** Create a tree from a tar file */
export class FileTree {
  nodes: Map<string, Set<string>> = new Map();
  source: Source;
  constructor(source: Source) {
    this.source = source;
  }

  getBytes = async (offset: number, count: number): Promise<Buffer> => {
    const bytes = await this.source.fetch(offset, count);
    return Buffer.from(bytes);
  };

  async init(): Promise<void> {
    for await (const ctx of TarReader.iterate(this.getBytes)) this.addFile(ctx.header.path);
  }

  addFile(filePath: string): void {
    filePath = filePath.startsWith('/') ? filePath : '/' + filePath;
    const dirname = toFolderName(path.dirname(filePath));

    let existing = this.nodes.get(dirname);
    if (existing == null) {
      existing = new Set();
      this.nodes.set(dirname, existing);
    }
    existing.add(filePath);
    let current = '/';
    const parts = filePath.split('/');

    // Everything should start with "/"
    for (let i = 1; i < parts.length - 1; i++) {
      const part = parts[i];
      let existing = this.nodes.get(current);
      if (existing == null) {
        existing = new Set();
        this.nodes.set(current, existing);
      }
      const next = toFolderName(path.join(current, part));
      existing.add(next);
      current = next;
    }
  }

  async list(pathName: string): Promise<Set<string> | undefined> {
    if (this.nodes.size === 0) await this.init();
    return this.nodes.get(toFolderName(pathName));
  }
}
