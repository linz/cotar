import { subcommands } from 'cmd-ts';

import { commandCreate } from './commands/create.js';
import { commandServe } from './commands/serve.js';
import { commandTar } from './commands/tar.js';
import { commandValidate } from './commands/validate.js';
import { commandVersion } from './commands/version.js';

export const cmd = subcommands({
  name: 'cotar',
  description: 'cotar utilities tasks for argo',
  cmds: {
    serve: commandServe,
    validate: commandValidate,
    create: commandCreate,
    tar: commandTar,
    version: commandVersion,
  },
});
