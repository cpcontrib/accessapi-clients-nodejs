var log4js = require('@log4js-node/log4js-api');
var fs = require('fs');
var chalk = require('chalk');
var util = require('util');

var AccessApi = require('../index');
var config_util = require('../lib/config-util');

var log = log4js.getLogger('crownpeak-cli');
function createLogger() {
  return log;
}

statusImpl = function() {

  var chalkError = chalk.red;
  var chalkWarn = chalk.yellow;
  var options = {
    verbose: false,
    quiet: false
  };
}

statusImpl.prototype.configure = function(options) {
  this.options.verbose = options.verbose || false;
  this.options.quiet = options.quiet || false;
}

statusImpl.prototype.write = function(text) {
  return text;
}

/// writes banner to stdout when quiet==false
statusImpl.prototype.banner = function(stream) {
  if(this.options.quiet !== true) {
    //inform('\nCrownPeak AccessAPI CLI\n\n');
    stream.write('CrownPeak AccessAPI CLI\n');
    stream.write('\n');
  }
}

/// writes informational message thats not included in logs
/// quiet = false
statusImpl.prototype.inform = function(text) {
  if(this.options.quiet !== true) {
    var argsArray = Array.prototype.slice.call(arguments);
    var str = util.format.apply(null,argsArray);
    process.stdout.write(str);
    process.stdout.write('\n');
  }
}


statusImpl.prototype.verbose = statusImpl.prototype.inform;

/// writes info message to stdout and to logs
statusImpl.prototype.info = function(text) {
  var argsArray = Array.prototype.slice.call(arguments);

  if(log !== undefined && log.isInfoEnabled !== false) {
    log.info.apply(log, argsArray);
  }

  if(this.options.quiet !== true) {
    var str = util.format.apply(null,argsArray);
    process.stdout.write(str);
    process.stdout.write('\n');
  }
}

/// writes warning message to stdout and to logs
statusImpl.prototype.warn = function(text) {
  var argsArray = Array.prototype.slice.call(arguments);

  if(log !== undefined && log.isWarnEnabled !== false) {
    log.warn.apply(log, argsArray);
  }

  var str = util.format.apply(null,argsArray);
  process.stderr.write(chalk.yellow(str));
  process.stderr.write('\n');
}

/// writes error message to stderr and to logs
statusImpl.prototype.error = function(text) {
  var argsArray = Array.prototype.slice.call(arguments);

  if(log !== undefined && log.isErrorEnabled !== false) {
    log.fatal.apply(log, argsArray);
  }

  var str = util.format.apply(null,argsArray);
  process.stderr.write(chalk.red(str));
  process.stderr.write('\n');
}

statusImpl.prototype.fail = statusImpl.prototype.error;

var statusSingleton = new statusImpl();

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