#!/usr/bin/env node

var program = require('commander');
var packagejson = require('../package.json');
var status = require('./cli_util').status;

program
  .name('crownpeak')
  .version(packagejson.version, '--version')
  .option('-v,--verbose','verbose output',null,false)
  .option('-q,--quiet','quiet output',null,false)
  .action(()=>{
    status.options.verbose = program.option.verbose;
    status.options.quiet = program.option.quiet;
    console.log('status.options=%s', JSON.stringify(status.options));
  })
  .command('init', 'initialize a config for using the AccessAPI')
  .command('update', 'update an asset')
  .command('list','list contents of a folder')
  .command('retrieve','retrieve content from an asset')
  .command('route', 'routing and publishing')
  .parse(process.argv);


status.banner(process.stdout);