#!/usr/bin/env node

var program = require('commander');
var packagejson = require('../package.json');
var status = require('./cli_util').status;

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
  // application specific logging, throwing an error, or other logic here
});

program
  .name('crownpeak')
  .version(packagejson.version, '--version')
  .option('-v, --verbose','verbose output',false)
  .option('-q, --quiet','quiet output',false)
  .action(()=>{
    status.configureOptions({verbose:program.verbose,quiet:program.quiet});
  })
  .command('init', 'initialize a config for using the AccessAPI')
  .command('update', 'update an asset')
  .command('list','list contents of a folder')
  .command('get','retrieve content from an asset')
  .command('route', 'routing and publishing')
  .command('branch', 'branching')
  .parse(process.argv);


status.banner(process.stdout);