import { pathToFileURL } from 'node:url';

import { Type } from 'cmd-ts';

export const Url: Type<string, URL> = {
  async from(str) {
    try {
      return new URL(str);
    } catch (e) {
      return pathToFileURL(str);
    }
  },
};
