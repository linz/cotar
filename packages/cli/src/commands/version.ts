import { fsa } from '@chunkd/fs';
import { command } from 'cmd-ts';

export const commandVersion = command({
  name: 'version',
  description: 'Dump CLI version information',
  args: {},
  async handler() {
    const packageJson = await fsa.readJson<Record<string, unknown>>(
      new URL('../../../../package.json', import.meta.url),
    );

    console.log(packageJson['name'], packageJson['version']);
  },
});
