#!/usr/bin/env node

var program = require('commander');
var util = require('util');
var chalk = require('chalk');
var accessapi = require('../index');

var cli_util = require('./cli_util');
var status = cli_util.status;
var log = cli_util.createLogger();

process.on('exit', () => { process.exit(0); })

program
  .name('route')

program
  .option('--config <file>', 'a config file to use. defaults to looking for accessapi-config.json')
  .option('-i,--instance <instance>', 'instance (required if multiple instances defined in the config file)')
  //.option('--recursive','route', false)
  .arguments("<assetPath> <status>")
  .action(function (assetPath, status) {
    program.assetPath = assetPath;
    program.status = status;
  })

program
  .parse(process.argv)

function getSystemState(accessapi, status) { 
  
  return new Promise((resolve,reject)=>{

    if(program.status) {

      getSystemStates(accessapi).then((states) => {

        var test_statusName = program.status.toUpperCase();

        var workflowState = states.find((i) => { 
          return test_statusName == i.stateName.toUpperCase(); 
        });

        if(workflowState !== undefined) {
          resolve(workflowState);
        } else {
          reject(util.format("could not find a state named '%s' in the system.", program.workflowStatus)); 
        }

      });
    }

  });
}

function getSystemStates(accessapi) {
  
  return new Promise((resolve,reject)=>{

    accessapi.AssetExists("/System/States").then((resp)=>{
      
      if(resp.exists !== true) {
          log.error('failed to get list on /System/States');
          reject(new Error('/System/States not found.'));
      }

      accessapi.AssetPaged({"assetId":resp.assetId}).then((resp)=>{

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

  try
  {
    //validateUsage(program,process);
    status.configureOptions(program);

    status.info("Routing '%s' to status '%s'.", program.assetPath, program.status);    

    var accessApiConfig = cli_util.findAccessApiConfig(program);

    accessapi.authenticate(accessApiConfig).then((accessapi) => {

      getSystemState(accessapi, program.status).then((workflowState) => {

        accessapi.AssetExists(program.assetPath)
        .then((resp) => {

          if(resp.exists !== true) {
            reject(util.format("fail Asset '%s' was not found.", program.assetPath));
          } else {

            accessapi.AssetRoute({"assetId":resp.assetId, "stateId":workflowState.stateId})
            .then((resp2) => {
              status.info(chalk.green(" ok  ") + "Routed '%s' to status '%s'", program.assetPath, program.status);
            });

          }

        }).catch(error => { status.warn(error); return error; });

      })

    });
  
  } catch(e) {
    console.error('Error: ',e);
  }

}();
