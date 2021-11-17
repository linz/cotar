# @cotar/tar 

Create tars from very large files, using hardlinks to deduplicate files


```typescript

import {TarBuilder} from '@cotar/tar';

const tb = new TarBuilder('./output.tar');


for (const fileName in fileList) {
    const fileData = await fs.promises.readFile(fileName)
    await tb.write(fileName, fileData);
}

await tb.close();
```

