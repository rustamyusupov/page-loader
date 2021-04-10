#!/usr/bin/env node

import program from 'commander';

import { version } from '../../package.json';
import loader from '..';

const run = () => {
  program
    .description('Command-line tool for downloading pages from the Internet.')
    .version(version)
    .option('-o, --output [folder]', 'output folder', '.')
    .arguments('<url>')
    .action((url) => {
      // eslint-disable-next-line no-console
      console.log(loader(url, program.output));
    });

  program.parse(process.argv);
};

run();
