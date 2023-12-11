import { createHash } from 'crypto';
import { createWriteStream } from 'fs';
import * as tar from 'tar-stream';

// Default modified time to 0, to make the builds reproducable
const mtime = new Date(0);

export class TarBuilder {
  tarPath: string;
  private packer: tar.Pack;
  // Maps run into issues after 120M files, use a collection of maps to allow for huggee files
  fileHashes: Map<string, string>[] = [];
  stats: { total: number; duplicate: number } = { total: 0, duplicate: 0 };

  constructor(tarPath: string) {
    this.tarPath = tarPath;
    this.packer = tar.pack();
    this.packer.pipe(createWriteStream(tarPath));
    for (let i = 0; i < 0x10; i++) this.fileHashes.push(new Map());
  }

  async write(fileName: string, data: Buffer): Promise<void> {
    const hash = createHash('sha256').update(data).digest('hex');
    const hashIndex = parseInt(hash[0] ?? '0', 16);
    const dupeFile = this.fileHashes[hashIndex]?.get(hash);

    if (dupeFile) {
      // Duplicate file contents create hard link
      this.stats.duplicate++;
      await new Promise((r) => this.packer.entry({ name: fileName, type: 'link', linkname: dupeFile, mtime }, r));
    } else {
      await new Promise((r) => this.packer.entry({ name: fileName, mtime }, data, r));
      this.fileHashes[hashIndex]?.set(hash, fileName);
    }
    this.stats.total++;
  }

  async close(): Promise<void> {
    const writeProm = new Promise((resolve) => this.packer.on('end', resolve));
    this.packer.finalize();
    await writeProm;
  }
}
