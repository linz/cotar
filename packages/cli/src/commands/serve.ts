import { SourceFile } from '@chunkd/source-file';
import { Cotar } from '@cotar/core';
import { command, flag, number, option, positional, string } from 'cmd-ts';
import http from 'http';
import { performance } from 'perf_hooks';
import { URL } from 'url';
import { toDuration, verbose } from '../common.js';
import { logger } from '../log.js';
import { FileTree } from '../util/file.tree.js';

function rewriteFile(fileName: string, buf: ArrayBuffer, args: { baseUrl: string }): Buffer | ArrayBuffer {
  if (fileName === 'WMTSCapabilities.xml' || fileName.endsWith('/WMTSCapabilities.xml')) {
    const text = Buffer.from(buf).toString();
    return Buffer.from(text.replace(/template="\//g, `template="${args.baseUrl}/v1/file/`));
  }
  return buf;
}

export const commandServe = command({
  name: 'serve',
  description: 'Serve cotar file via http',
  args: {
    verbose,
    port: option({
      type: number,
      long: 'port',
      description: 'HTTP port to use',
      defaultValue: () => 8080,
    }),
    disableIndex: flag({
      long: 'disable-index',
      description: 'disable index load on startup',
      defaultValue: () => false,
    }),
    baseUrl: option({
      type: string,
      long: 'base-url',
      description: 'Base URL to expose',
      defaultValue: () => 'http://localhost:8080',
    }),
    disableRewrite: flag({
      long: 'disable-rewrite',
      description: 'Disable rewriting files to use the serve http urls',
      defaultValue: () => false,
    }),
    input: positional({ displayName: 'Input', description: 'Cotar file' }),
  },
  async handler(args) {
    if (args.verbose) logger.level = 'debug';

    if (args.port !== 8080) args.baseUrl = args.baseUrl.replace(':8080', `:${args.port}`);

    logger.debug({ fileName: args.input }, 'Cotar:Load');
    const startTime = performance.now();

    const source = new SourceFile(args.input);
    const cotar = await Cotar.fromTar(source);
    const fileTree = new FileTree(source);
    if (args.disableIndex === false) await fileTree.init();

    logger.info({ fileName: args.input, duration: toDuration(startTime) }, 'Cotar:Loaded');

    // Attempt to send a specific file from the tar
    async function sendFile(req: http.IncomingMessage, res: http.ServerResponse, fileName: string): Promise<void> {
      const startTime = performance.now();

      const file = await cotar.get(fileName);
      if (file == null) {
        // Attempt to serve both `foo.tiff` and `/foo.tiff`
        if (!fileName.startsWith('/')) return sendFile(req, res, '/' + fileName);

        logger.info({ status: 404 }, req.url);
        res.writeHead(404);
        return res.end();
      }

      res.writeHead(200);
      res.write(args.disableRewrite ? file : rewriteFile(fileName, file, args));
      res.end();
      logger.info({ action: 'file:get', fileName, status: 200, duration: toDuration(startTime) }, req.url);
    }

    // List all the files in the source tar
    async function sendFileList(req: http.IncomingMessage, res: http.ServerResponse, pathName: string): Promise<void> {
      const startTime = performance.now();

      const list = await fileTree.list(pathName ?? '/');
      if (list == null) {
        logger.info({ status: 404 }, req.url);
        res.writeHead(404);
        return res.end();
      }

      const fileList = [];
      for (const fileName of list.values()) {
        if (fileName.endsWith('/')) fileList.push(args.baseUrl + '/v1/list' + fileName);
        else fileList.push(args.baseUrl + '/v1/file' + fileName);
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.write(JSON.stringify({ files: fileList }));
      res.end();
      logger.info({ action: 'file:list', status: 200, duration: toDuration(startTime) }, req.url);
    }

    const server = http.createServer((req: http.IncomingMessage, res: http.ServerResponse): void | Promise<void> => {
      const url = new URL(req.url ?? '', 'http://localhost');

      if (url.pathname.startsWith('/v1/list')) return sendFileList(req, res, url.pathname.slice(8));
      if (url.pathname.startsWith('/v1/file/')) return sendFile(req, res, url.pathname.slice(9));

      logger.info({ status: 404 }, req.url);
      res.writeHead(404);
      res.end();
    });

    server.listen(args.port);
    logger.info({ url: args.baseUrl + '/v1/list', port: args.port }, 'Cotar:Server:Started');
  },
});
