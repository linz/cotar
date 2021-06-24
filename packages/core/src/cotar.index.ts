import { LogType } from '@cogeotiff/chunk';
import { CotarIndexBinaryBuilder } from './binary/build.binary';
import { CotarIndexNdjsonBuilder } from './ndjson/build.ndjson';
import { AsyncFileDescriptor, AsyncFileRead, TarIndexResult } from './tar.index';

export enum CotarIndexType {
  Binary,
  NdJson,
}

export const CotarIndexBuilder = {
  Binary: CotarIndexType.Binary,
  NdJson: CotarIndexType.NdJson,
  create(
    fd: AsyncFileRead | AsyncFileDescriptor,
    type: CotarIndexType = CotarIndexType.Binary,
    logger?: LogType,
  ): Promise<TarIndexResult> {
    switch (type) {
      case CotarIndexType.Binary:
        return CotarIndexBinaryBuilder.create(fd, logger);
      case CotarIndexType.NdJson:
        return CotarIndexNdjsonBuilder.create(fd, logger);
      default:
        throw new Error('Unknown index type:' + type);
    }
  },
};
