import { fsa } from '@chunkd/fs';
import { command } from 'cmd-ts';
import path from 'path';
import { fileURLToPath } from 'url';

export const commandVersion = command({
  name: 'version',
  description: 'Dump CLI version information',
  args: {},
  async handler() {
    const packageJson = await fsa.readJson<Record<string, unknown>>(
      fileURLToPath(path.join(import.meta.url, '..', '..', '..', '..', 'package.json')),
    );

    console.log(packageJson['name'], packageJson['version']);
  },
});
