import bs3 from 'better-sqlite3';
import { createWriteStream } from 'fs';
import type { Logger } from 'pino';
import * as tar from 'tar-stream';
import { xyzToPath } from './util';
import * as zlib from 'zlib';

export interface TileTable {
  zoom_level: number;
  tile_column: number;
  tile_row: number;
  tile_data: Buffer;
}

const LimitCount = 0;
const Limit = LimitCount > 0 ? `LIMIT ${LimitCount}` : '';

export async function toTTiles(
  filename: string,
  tarFileName: string,
  decompress: boolean,
  logger: Logger,
): Promise<void> {
  const packer = tar.pack();
  const db = bs3(filename);

  const tileCount = await db.prepare('SELECT count(*) from tiles;').pluck().get();

  const query = db.prepare(`SELECT * from tiles ${Limit}`);

  const startTime = Date.now();
  let writeCount = 0;
  const writeProm = new Promise((resolve) => packer.on('end', resolve));

  packer.pipe(createWriteStream(tarFileName));

  let startTileTime = Date.now();
  for (const tile of query.iterate()) {
    const tileName = xyzToPath(tile.tile_column, tile.tile_row, tile.zoom_level);
    const tileData = decompress ? zlib.gunzipSync(tile.tile_data) : tile.tile_data;
    packer.entry({ name: tileName }, tileData);
    if (writeCount % 25_000 === 0) {
      const percent = ((writeCount / tileCount) * 100).toFixed(2);
      const duration = Date.now() - startTileTime;
      startTileTime = Date.now();
      logger.debug({ count: writeCount, total: tileCount, percent, duration }, 'Tar:WriteTile');
    }
    writeCount++;
  }

  logger.debug('Tar:Finalize');
  packer.finalize();
  await writeProm;
  logger.info({ path: tarFileName, count: writeCount, duration: Date.now() - startTime }, 'Tar:Done');
}
