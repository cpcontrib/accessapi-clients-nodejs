#!/usr/bin/env node

var program = require('commander');
var prompt = require('prompt');
var fs = require('fs');
var util = require('util');
var chalk = require('chalk');

var cli_util = require('./cli_util');
var log = cli_util.createLogger();

process.on('exit', () => { process.exit(0); })

var constants = {
  configJsonName: "accessapi-config.json"
};

program
  .name('route')

program
  .option('--config <file>', 'a config file to use. defaults to looking for accessapi-config.json')
  .option('-i,--instance', 'instance (required if multiple instances defined in the config file)')
  //.option('--recursive','route', false)
  .arguments("<assetPath> <workflowStatus>")
  .action(function (assetPath, workflowStatus) {
    program.assetPath = assetPath;
    program.workflowStatus = workflowStatus;
  })

program
  .parse(process.argv)

function getSystemState(accessapi, workflowStatusName) { 
  
  return new Promise((resolve,reject)=>{

    if(program.workflowStatus) {

      getSystemStates(accessapi).then((states) => {


        var workflowState = states.find((i) => { 
          return program.workflowStatus.toUpperCase() == i.stateName.toUpperCase(); 
        });

        if(workflowState !== undefined) {
            resolve(workflowState);
        } else {
            reject(new Error(util.format("could not find a state named '%s' in the system.", program.workflowStatus))); 
        }

      });
    }

  });
}

function getSystemStates(accessapi) {
  
  return new Promise((resolve,reject)=>{

    accessapi.AssetExists("/System/States").then((resp2)=>{
      var resp = resp2.json;
      
      if(resp.exists !== true) {
          log.error('failed to get list on /System/States');
          reject(new Error('/System/States not found.'));
      }

      accessapi.AssetPaged({"assetId":resp.assetId}).then((resp2)=>{
          var resp = resp2.json;

          var states = resp.assets.reduce((accumulator,value) => {
              if(value.type === 2) {//only push assets (type=2)
                  accumulator.push({"stateName":value.label, "stateId":value.id});
              }
              return accumulator;
          }, []);

          resolve(states);
      });

    });

  });
}

main = function() {

    cli_util.status("Routing '%s' to status '%s'.", program.assetPath, program.workflowStatus);    

    var accessapi = require('../index');

    var loadConfigOpts = {};
    loadConfigOpts.file = program.config;
    loadConfigOpts.instance = program.instance;
    accessapi.loadConfig(loadConfigOpts);

    log.debug('auth');
    accessapi.auth().then(()=>{

        getSystemState(accessapi, program.workflowStatus).then((workflowState) => {

            accessapi.AssetExists(program.assetPath).then((resp2)=>{
              var resp = resp2.getBody();
              
              if(resp.exists !== true) {
                cli_util.fail("asset '%s' was not found.", program.assetPath);
                process.exit(1);
              }

              log.debug('assetroute');
              accessapi.AssetRoute({"assetId":resp.assetId, "stateId":workflowState.stateId}).then((resp2)=> {
                cli_util.status("succeeded routing '%s' to status '%s'", program.assetPath, program.workflowStatus);
              });

            });

        })

    });

}();
