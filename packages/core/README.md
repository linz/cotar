# Cloud optimised TAR @cotar/core

Given a `.tar` with a `.index` using HTTP range requests fetch only the portion of the tar that contains the bytes of the file.

For example `@cotar/core` can fetch a 1KB file from a 100GB tar file with only 1 HTTP range request and only download 1KB. Assuming the tar index is loaded into memory.

## Usage

To fetch a single tile, the index has to be loaded into memory then the cotar object provides a `get(fileName)` interface to access any file inside the tar

```typescript
import { Cotar } from '@cotar/core';
import { SourceUrl } from '@chunkd/source-url';

const source = new SourceUrl('s3://linz-basemaps/topographic.tar.co');
const cotar = await Cotar.fromTar(source);

// Fetch a gzipped PBF file from  a tar
const bytes = await cotar.get(`tiles/z10/5/5.pbf.gz`);
```

Index files can also be stored as separate files

```typescript
import { Cotar } from '@cotar/core';
import { SourceUrl } from '@chunkd/source-url';

const source = new SourceUrl('s3://linz-basemaps/topographic.tar]');
const sourceIndex = new SourceUrl('s3://linz-basemaps/topographic.tar.index');

const cotar = await Cotar.fromTarIndex(source, index);

// Fetch a gzipped PBF file from  a tar
const bytes = await cotar.get(`tiles/z10/5/5.pbf.gz`);
```

### Creating indexes

Indexes can be created using the `@cotar/cli` package or programmatically using the `CotarIndexBuilder`

```typescript
import { CotarIndexBuilder } from '@cotar/builder';
import * as fs from 'fs/promises';

const fd = await fs.open('tarFile.tar', 'r');
const res = await CotarIndexBuilder.create(fd, CotarIndex.Binary);
await fs.write('tarFile.tar.index', res.buffer);
await fd.close();
```
