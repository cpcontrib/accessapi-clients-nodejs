var log4js = require('@log4js-node/log4js-api');
var fs = require('fs');
var chalk = require('chalk');
var util = require('util');
var Status = require('./status');

var AccessApi = require('../index');
var config_util = require('../lib/config-util');

var log = log4js.getLogger('crownpeak-cli');
function createLogger() {
  return log;
}


var statusSingleton = new Status(log);

asListFunction = function(val) {
  return val.split(',');
}

/* constants */
var constants = {
  configJsonName: "accessapi-config.json"
};

var getCachedSystemStates = function(accessApiConnection) {
  var appDataBase = process.env.LOCALAPPDATA || "";

  return new Promise((resolve,reject) => {
    resolve();
  })
}

var findAccessApiConfig = function(program) {
  program = program || {};
  var accessApiConfig = AccessApi.loadAccessApiConfig(program.config, program.instance);

  statusSingleton.verbose(`Instance: ${accessApiConfig.instance}`);
  statusSingleton.verbose(`Login as: ${accessApiConfig.username}`);

  return accessApiConfig;
}

var addCommonOptions = function(program) {
  
  program
    .option('--config <file>', 'a config file to use. defaults to looking for accessapi-config.json')
    .option('-i,--instance <instance>', 'instance (required if multiple instances defined in the config file)')
    .option('--stdin', 'read input from stdin', null, true)
    .option('--verbose', 'increase output')
    .option('--quiet', 'quiet output')

  return program;

}


module.exports = {
    createLogger: createLogger,
    status: statusSingleton,
    asList: asListFunction,
    constants: constants,
    addCommonOptions: addCommonOptions,
    findAccessApiConfig: findAccessApiConfig
};