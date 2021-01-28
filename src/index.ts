import pino from 'pino';
import { PrettyTransform } from 'pretty-json-log';
import { toTTiles } from './mbtiles.to.ttiles';
import { toTTilesIndex } from './tar.to.ttiles';

const logger = process.stdout.isTTY ? pino(PrettyTransform.stream()) : pino();

export async function createTTiles(source: string): Promise<void> {
  // if (!existsSync(source + '.tar'))
  await toTTiles(source, source + '.tar', logger);
  await toTTilesIndex(source + '.tar', source + '.tari', logger);

  logger.info('Done..');
}

createTTiles('./data/2021-01-26-coastline-contours-tunnels-bridges-rivers-airports.mbtiles');
