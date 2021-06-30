import { LogType } from '@cogeotiff/chunk';
import { CotarIndexNdjson } from '.';
import { TarReader } from '../tar';
import { AsyncReader, TarIndexResult } from '../tar.index';

export const CotarIndexNdjsonBuilder = {
  /**
   * Create a tar index give a source tar file
   * @param getBytes function to randomly read bytes from the tar
   * @param logger optional logger for extra information
   * @returns
   */
  async create(getBytes: AsyncReader, logger?: LogType): Promise<TarIndexResult> {
    if (typeof getBytes !== 'function') getBytes = TarReader.toFileReader(getBytes);

    let fileCount = 0;
    let currentTime = Date.now();
    const lines = [];

    for await (const ctx of TarReader.iterate(getBytes)) {
      if (ctx.header.type !== TarReader.Type.File) continue;
      fileCount++;
      lines.push(JSON.stringify([ctx.header.path, ctx.offset, ctx.header.size]));

      if (fileCount % 25_000 === 0 && logger != null) {
        const duration = Date.now() - currentTime;
        currentTime = Date.now();
        logger.debug({ current: fileCount, duration }, 'Cotar.Index:Write');
      }
    }

    // Make the index sorted so it can be searched easier
    lines.sort();

    return { buffer: Buffer.from(lines.join('\n')), count: lines.length };
  },
  /** Validate that the index matches the input file */
  async validate(getBytes: AsyncReader, index: Buffer, logger?: LogType): Promise<void> {
    const binIndex = new CotarIndexNdjson(index.toString());
    return TarReader.validate(getBytes, binIndex, logger);
  },
};
