import { ChunkSource } from '@chunkd/core';
import { SourceFile } from '@chunkd/source-file';
import { Cotar, TarReader } from '@cotar/core';
import { Command, Flags } from '@oclif/core';
import http from 'http';
import path from 'path';
import { URL } from 'url';
import { logger } from '../log.js';

function toFolderName(f: string): string {
  if (!f.startsWith('/')) f = '/' + f;
  if (!f.endsWith('/')) f = f + '/';
  return f;
}

/** Create a tree from a tar file */
class FileTree {
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
      for (let i = 0; i < parts.length - 2; i++) {
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

export class CotarServe extends Command {
  static description = 'Serve a cotar using http';
  static flags = {
    'disable-index': Flags.boolean({ description: 'Load the tar file list on startup', default: false }),
    port: Flags.integer({ description: 'Port to run on', default: 8080 }),
    'base-url': Flags.string({ description: 'Base url to use', default: 'http://localhost:8080' }),
    verbose: Flags.boolean({ description: 'verbose logging' }),
  };

  static args = [{ name: 'inputFile', required: true }];

  async run(): Promise<void> {
    const { args, flags } = await this.parse(CotarServe);
    if (flags.verbose) logger.level = 'debug';

    if (flags.port !== 8080) flags['base-url'] = flags['base-url'].replace(':8080', `:${flags.port}`);

    logger.debug({ fileName: args.inputFile }, 'Cotar:Load');
    const startTime = Date.now();

    const source = new SourceFile(args.inputFile);
    const cotar = await Cotar.fromTar(source);
    const fileTree = new FileTree(source);
    if (flags['disable-index'] === false) await fileTree.init();

    logger.info({ fileName: args.inputFile, duration: Date.now() - startTime }, 'Cotar:Loaded');

    // Attempt to send a specific file from the tar
    async function sendFile(req: http.IncomingMessage, res: http.ServerResponse, fileName: string): Promise<void> {
      const startTime = Date.now();

      const file = await cotar.get(fileName);
      if (file == null) {
        res.writeHead(404);
        return res.end();
      }

      res.writeHead(200);
      res.write(file);
      res.end();
      logger.info({ action: 'file:get', fileName, duration: Date.now() - startTime }, req.url);
    }

    // List all the files in the source tar
    async function sendFileList(req: http.IncomingMessage, res: http.ServerResponse, pathName: string): Promise<void> {
      const startTime = Date.now();

      const list = await fileTree.list(pathName ?? '/');
      if (list == null) {
        res.writeHead(404);
        return res.end();
      }

      const fileList = [];
      for (const fileName of list.values()) {
        if (fileName.endsWith('/')) fileList.push(flags['base-url'] + '/v1/list' + fileName);
        else fileList.push(flags['base-url'] + '/v1/file' + fileName);
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.write(JSON.stringify({ files: fileList }));
      res.end();
      logger.info({ action: 'file:list', duration: Date.now() - startTime }, req.url);
    }

    const server = http.createServer((req: http.IncomingMessage, res: http.ServerResponse): void | Promise<void> => {
      const url = new URL(req.url ?? '', 'http://localhost');

      if (url.pathname.startsWith('/v1/list')) return sendFileList(req, res, url.pathname.slice(8));
      if (url.pathname.startsWith('/v1/file/')) return sendFile(req, res, url.pathname.slice(9));

      res.writeHead(404);
      res.end();
    });

    server.listen(flags.port);
    logger.info({ url: flags['base-url'] + '/v1/list', port: flags.port }, 'Cotar:Server:Started');
  }
}
