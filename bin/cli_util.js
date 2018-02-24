var log4js = require('@log4js-node/log4js-api');
var fs = require('fs');
var chalk = require('chalk');
var util = require('util');

var log;
function createLogger() {
  log = log4js.getLogger('crownpeak-accessapi-cli');
  return log;
}

statusImpl = function(){

  var verbose = false;
  var chalkInfo = chalk.reset; //basically use default
  var chalkError = chalk.red;
  var chalkWarn = chalk.yellow;

  statusImpl.prototype.banner = function(stream) {
    stream.write('\n');
    stream.write('CrownPeak AccessAPI CLI\n');
    stream.write('\n');
  }

  statusImpl.prototype.info = function(text) {
    var argsArray = Array.prototype.slice.call(arguments);

    if(log !== undefined && log.isInfoEnabled !== false) {
      log.info.apply(log, argsArray);
    }

    var str = util.format.apply(null,argsArray);
    process.stdout.write(chalkInfo(str));
    process.stdout.write('\n');
  }

  statusImpl.prototype.warn = function(text) {
    var argsArray = Array.prototype.slice.call(arguments);

    if(log !== undefined && log.isWarnEnabled !== false) {
      log.warn.apply(log, argsArray);
    }

    var str = util.format.apply(null,argsArray);
    process.stderr.write(chalkWarn(str));
    process.stderr.write('\n');
  }

  statusImpl.prototype.error = function(text) {
    var argsArray = Array.prototype.slice.call(arguments);

    if(log !== undefined && log.isErrorEnabled !== false) {
      log.fatal.apply(log, argsArray);
    }

    var str = util.format.apply(null,argsArray);
    process.stderr.write(chalkError(str));
    process.stderr.write('\n');
  }

}
var statusSingleton = new statusImpl();

asListFunction = function(val) {
  return val.split(',');
}

module.exports = {
    createLogger: createLogger,
    status: statusSingleton,
    asList: asListFunction
};