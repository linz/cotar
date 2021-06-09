# Cloud optimised TAR @cotar/core


Given a `.tar` with a `.index` using HTTP range requests fetch only the portion of the tar that contains the bytes of the file.

For example, this can fetch a 1KB file from a 100GB tar file with only 1 HTTP range request and only download 1KB.


## Usage


To fetch a single tile, the index has to be loaded into memory then the cotar object provides a `cotar.get(fileName)` interface to access any file inside the tar
```typescript
import { Cotar } from '@cotar/core';
import { SourceAwsS3 } from '@cogeotiff/source-aws'

const source = SourceAwsS3.fromUri('s3://linz-basemaps/topographic.tar');
const tarIndex = JSON.parse(fs.readFileSync('./file.tar.idex'));

const cotar = new Cotar(source, index);

// Fetch a gzipped PBF file from  a tar
const bytes  = await cotar.get(`tiles/z10/5/5.pbf.gz`);
```

Creating indexes, indexes can be created using the `@cotar/cli` package or programmatically using the `TarReader.index`

```typescript
import { TarReader } from '@cotar/core'
import * as fs from 'fs';

const fd = await fs.open('tarFile.tar', 'r');
const outputStream = fs.createWriteStream('tarFile.tar.index');
const fileCount = await TarReader.index(readBytes, outputStream);

console.log('TarIndex Created', {fileCount});
```