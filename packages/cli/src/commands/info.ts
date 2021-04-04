import { SourceFile } from '@cogeotiff/source-file';
import { Covt, xyzToPath } from '@covt/core';
import Command, { flags } from '@oclif/command';
import { promises as fs } from 'fs';
import { readMbTiles } from '../create/mbtiles.to.ttiles';
import { logger } from '../log';

export class CreateCovt extends Command {
  static flags = {
    verbose: flags.boolean({ description: 'verbose logging' }),
    mbtiles: flags.string({ description: 'Source MBTiles for validation' }),
  };

  static args = [{ name: 'inputFile', required: true }];

  async run(): Promise<void> {
    const { args, flags } = this.parse(CreateCovt);
    if (flags.verbose) logger.level = 'debug';

    logger.info({ fileName: args.inputFile }, 'Covt.Load');

    const source = new SourceFile(args.inputFile);
    logger.debug({ indexPath: args.inputFile + '.index' }, 'Index:Load');
    const sourceIndex = await fs.readFile(args.inputFile + '.index');

    const index = JSON.parse(sourceIndex.toString());

    const covt = await Covt.create(source, index);
    logger.info({ fileName: args.inputFile, files: covt.index.size }, 'Covt.Loaded');

    if (flags.mbtiles) {
      const failures = [];

      for await (const { tile, index, total } of readMbTiles(flags.mbtiles)) {
        if (index === 0) logger.info({ total }, 'Covt.Validation:Start');
        else if (index % 25_000 === 0) logger.debug({ total, index }, 'Covt.Validation:Progress');

        const tileName = xyzToPath(tile.tile_column, tile.tile_row, tile.zoom_level);

        const covtTile = covt.index.get(tileName);
        if (covtTile == null) failures.push(tileName);
      }

      if (failures.length > 0) {
        logger.error({ total: failures.length }, 'Covt.Validation:Failure');
        logger.error({ failures: failures.slice(0, 25) }, 'Covt.Validation:Failures');
      }
    }
  }
}
