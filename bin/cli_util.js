var log4js = require('log4js');
var fs = require('fs');
var chalk = require('chalk');
var util = require('util');

var log;
function createLogger() {
  log = log4js.getLogger('crownpeak-accessapi-cli');

  if(process.env["LOG4JS_CONFIG"] !== undefined) {
    try { 
      log4js_config = JSON.parse(process.env["LOG4JS_CONFIG"]);
      log4js.configure(log4js_config);
    } catch(Exception) {}
  } else if(process.env["LOG4JS_LEVEL"] !== undefined) {
    log.setLevel(process.env["LOG4JS_LEVEL"]);
  } else if (fs.existsSync('./log4js.json')) {
    log4js.configure('./log4js.json');
  }

   log4js.configure({
     appenders: [
  //     { 
  //         type: 'console' , 
  //         level: 'INFO', 
  //         layout: { type:"pattern", pattern: " %[%m%]" } 
  //     },
     ]
   })
    
  //log.setLevel('INFO');
  //log.setLevel('OFF');
  
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

module.exports = {
    createLogger: createLogger,
    status: statusSingleton
};