#!/usr/bin/env node

var program = require('commander');
var packagejson = require('../package.json');
var status = require('./cli_util').status;

program
  .name('crownpeak')
  .version(packagejson.version, '--version')
  .option('-v, --verbose','verbose output',false)
  .option('-q, --quiet','quiet output',false)
  .action(()=>{
    status.options.verbose = program.verbose;
    status.options.quiet = program.quiet;
  })
  .command('init', 'initialize a config for using the AccessAPI')
  .command('update', 'update an asset')
  .command('list','list contents of a folder')
  .command('retrieve','retrieve content from an asset')
  .command('route', 'routing and publishing')
  .parse(process.argv);


status.banner(process.stdout);