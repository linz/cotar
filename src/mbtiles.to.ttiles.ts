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

export async function toTTiles(filename: string, tarFileName: string, logger: Logger): Promise<void> {
  const packer = tar.pack();
  const db = bs3(filename);

  const query = db.prepare(`SELECT * from tiles ${Limit}`);

  const startTime = Date.now();
  let writeCount = 0;
  const writeProm = new Promise((resolve) => packer.on('end', resolve));

  packer.pipe(createWriteStream(tarFileName));

  for (const tile of query.iterate()) {
    const tileName = xyzToPath(tile.tile_column, tile.tile_row, tile.zoom_level);
    const tileData = zlib.gunzipSync(tile.tile_data);
    packer.entry({ name: tileName }, tileData);
    if (writeCount % 10000 == 0) logger.info({ count: writeCount }, 'WriteTar');
    writeCount++;
  }
  packer.finalize();
  await writeProm;
  logger.info({ path: tarFileName, count: writeCount, duration: Date.now() - startTime }, 'TarDone');
}
