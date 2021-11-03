import { SourceFile } from '@chunkd/source-file';
import { Cotar, TarReader } from '@cotar/core';
import { Command, flags } from '@oclif/command';
import http from 'http';
import path from 'path';
import { URL } from 'url';
import { logger } from '../log.js';

export class CotarServe extends Command {
  static description = 'Serve a cotar using http';
  static flags = {
    port: flags.integer({ description: 'Port to run on', default: 8080 }),
    verbose: flags.boolean({ description: 'verbose logging' }),
  };

  static args = [{ name: 'inputFile', required: true }];

  async run(): Promise<void> {
    const { args, flags } = this.parse(CotarServe);
    if (flags.verbose) logger.level = 'debug';

    logger.info({ fileName: args.inputFile }, 'Cotar:Load');

    const source = new SourceFile(args.inputFile);
    const cotar = await Cotar.fromTar(source);

    logger.info({ fileName: args.inputFile }, 'Cotar:Loaded');

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
      logger.info({ fileName, duration: Date.now() - startTime }, '/v1/file');
    }

    // List all the files in the source tar
    async function sendFileList(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
      const startTime = Date.now();
      const fd = await source.fd;
      if (fd == null) {
        res.writeHead(500);
        return res.end();
      }
      const fileList = [];
      for await (const ctx of TarReader.iterate(TarReader.toFileReader(fd))) {
        if (ctx.header.type !== TarReader.Type.File) continue;
        fileList.push({ path: path.join('/v1/file/', ctx.header.path), size: ctx.header.size, offset: ctx.offset });
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.write(JSON.stringify({ files: fileList }));
      res.end();
      logger.info({ duration: Date.now() - startTime }, '/v1/files');
    }

    const server = http.createServer((req: http.IncomingMessage, res: http.ServerResponse): void => {
      const url = new URL(req.url ?? '', 'http://localhost');

      if (url.pathname === '/v1/list' || url.pathname === '/v1/list/') {
        sendFileList(req, res);
        return;
      }

      if (url.pathname.startsWith('/v1/file/')) {
        sendFile(req, res, url.pathname.slice(9));
        return;
      }

      res.writeHead(404);
      res.end();
    });

    server.listen(flags.port);
    logger.info({ url: 'http://localhost:' + flags.port + '/v1/list' }, 'Cotar:Server:Started');
  }
}
