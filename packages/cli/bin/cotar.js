#!/usr/bin/env node

import { run, flush, Errors } from '@oclif/core';

run(void 0, import.meta.url)
  .then(flush)
  .catch((error) => {
    if (error.oclif) return Errors.handle(error);
    console.log(error);
  });
