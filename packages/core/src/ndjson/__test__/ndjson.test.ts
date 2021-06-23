import o from 'ospec';
import { Cotar } from '../../cotar';
import { CotarIndexNdjson } from '..';
import { SourceMemory } from '@cogeotiff/chunk';
import { toArrayBuffer } from '../../binary/build.binary';

o.spec('CotarNdjson', () => {
  const tarIndex: string[] = [
    JSON.stringify(['tiles/0/0/0.pbf.gz', 0, 1]),
    JSON.stringify(['tiles/1/1/1.pbf.gz', 4, 4]),
  ];

  o('should load a tile', async () => {
    const cotar = new Cotar(
      new SourceMemory('Tar', toArrayBuffer(Buffer.from('0123456789'))),
      new CotarIndexNdjson(tarIndex.join('\n')),
    );

    o(await cotar.index.find('tiles/0/0/0.pbf.gz')).deepEquals({ offset: 0, size: 1 });
    o(await cotar.index.find('tiles/1/1/1.pbf.gz')).deepEquals({ offset: 4, size: 4 });

    const tile0 = await cotar.get('tiles/0/0/0.pbf.gz');
    o(tile0).notEquals(null);
    o(new Uint8Array(tile0!)[0]).deepEquals('0'.charCodeAt(0));

    const tile1 = await cotar.get('tiles/1/1/1.pbf.gz');
    o(tile1).notEquals(null);
    o(tile1!.byteLength).equals(4);
    o(new Uint8Array(tile1!)[0]).deepEquals('4'.charCodeAt(0));
  });
});
