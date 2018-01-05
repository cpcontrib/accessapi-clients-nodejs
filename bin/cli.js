#!/usr/bin/env node

var program = require('commander');

program
  .name('crownpeak')
  .version('CrownPeak Access API CLI 0.1.3')
  .option('--verbose,-v','verbose output',null,false)
  .command('init', 'initialize a config for using the AccessAPI')
  .command('update', 'update an asset')
  .command('list','list contents of a folder')
  .command('retrieve','retrieve content from an asset')
  .command('route', 'routing and publishing')
  .parse(process.argv);

if(program.option.verbose === true) {
  var cli_util = require('cli_util');
  cli_util.status.verbose = program.option.verbose;
}