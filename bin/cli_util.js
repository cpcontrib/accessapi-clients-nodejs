var log4js = require('@log4js-node/log4js-api');
var fs = require('fs');
var chalk = require('chalk');
var util = require('util');

var log = log4js.getLogger('crownpeak-accessapi-cli');
function createLogger() {
  return log;
}

statusImpl = function() {

  var chalkError = chalk.red;
  var chalkWarn = chalk.yellow;

}

statusImpl.prototype.write = function(text) {
  return text;
}

statusImpl.prototype.options = {
  verbose: false,
  quiet: false
};

/// writes banner to stdout when quiet==false
statusImpl.prototype.banner = function(stream) {
  if(this.options.quiet === false) {
    stream.write('\n');
    stream.write('CrownPeak AccessAPI CLI\n');
    stream.write('\n');
  }
}

/// writes info message to stdout and to logs
statusImpl.prototype.info = function(text) {
  var argsArray = Array.prototype.slice.call(arguments);

  if(log !== undefined && log.isInfoEnabled !== false) {
    log.info.apply(log, argsArray);
  }

  var str = util.format.apply(null,argsArray);
  process.stdout.write(str);
  process.stdout.write('\n');
}

/// writes warning message to stdout and to logs
statusImpl.prototype.warn = function(text) {
  var argsArray = Array.prototype.slice.call(arguments);

  if(log !== undefined && log.isWarnEnabled !== false) {
    log.warn.apply(log, argsArray);
  }

  var str = util.format.apply(null,argsArray);
  process.stderr.write(chalkWarn(str));
  process.stderr.write('\n');
}

/// writes error message to stderr and to logs
statusImpl.prototype.error = function(text) {
  var argsArray = Array.prototype.slice.call(arguments);

  if(log !== undefined && log.isErrorEnabled !== false) {
    log.fatal.apply(log, argsArray);
  }

  var str = util.format.apply(null,argsArray);
  process.stderr.write(chalkError(str));
  process.stderr.write('\n');
}

var statusSingleton = new statusImpl();

asListFunction = function(val) {
  return val.split(',');
}

/* constants */
var constants = {
  configJsonName: "accessapi-config.json"
};

module.exports = {
    createLogger: createLogger,
    status: statusSingleton,
    asList: asListFunction,
    constants: constants
};