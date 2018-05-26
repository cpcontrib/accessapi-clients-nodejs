#!/usr/bin/env node

var program = require('commander');
var prompt = require('prompt');
var fs = require('fs');
var util = require('util');
var chalk = require('chalk');

var cli_util = require('./cli_util');
var status = cli_util.status;
var log = cli_util.createLogger();

process.on('exit', () => { process.exit(0); })

program
  .name('branch')
  .option('--config <file>', 'a config file to use. defaults to looking for accessapi-config.json')
  .option('-i,--instance <instance>', 'instance (required if multiple instances defined in the config file)')
  //.option('--recursive','route', false)
  .option('--porcelain')
  .arguments("<assetPath> <workflowStatus>")
  .action(function (assetPath, workflowStatus) {
    program.assetPath = assetPath;
    program.workflowStatus = workflowStatus;
  })

program
  .parse(process.argv)


main = function() {

  status.info("Branch asset '%s'.", program.assetPath);    

  var accessapi = require('../index');

  var loadConfigOpts = {};
  loadConfigOpts.file = program.config;
  loadConfigOpts.instance = program.instance;
  accessapi.loadConfig(loadConfigOpts);

  log.debug('auth');
  accessapi.auth().then(()=>{

    accessapi.AssetExists(program.assetPath).then((resp2)=>{
      var resp = resp2.getBody();
      
      if(resp.exists !== true) {
        status.fail("asset '%s' was not found.", program.assetPath);
        process.exit(1);
      }

      log.debug('calling AssetBranch');
      accessapi.AssetBranch(resp.assetId).then((respBranch2)=> {
        var respBranch = respBranch2.getBody();

        status.info("Succeeded branching '%s'.", program.assetPath);
        status.info("Branched assetid: '%d'.", respBranch.asset.id);
      });

    });

      

  });

}();
