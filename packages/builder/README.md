# Cloud optimised TAR @cotar/core

Given a `.tar` with a `.index` using HTTP range requests fetch only the portion of the tar that contains the bytes of the file.

For example `@cotar/core` can fetch a 1KB file from a 100GB tar file with only 1 HTTP range request and only download 1KB. Assuming the tar index is loaded into memory.

## Usage

Indexes can be created using the `@cotar/cli` package or programmatically using the `CotarIndexBuilder`

```typescript
import { CotarIndexBuilder } from '@cotar/core';
import * as fs from 'fs/promises';

const fd = await fs.open('tarFile.tar', 'r');
const res = await CotarIndexBuilder.create(fd, CotarIndex.Binary);
await fs.write('tarFile.tar.index', res.buffer);
await fd.close();
```
