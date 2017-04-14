var log4js = require('log4js');
var fs = require('fs');

var log;
function createLogger() {
    log = log4js.getLogger('crownpeak-accessapi-cli');

    if (fs.existsSync('./log4js.json')) {
    log4js.configure('./log4js.json');
    } else if(process.env["LOG4JS_CONFIG"] !== undefined) {

    } else {
    log4js.configure({
        appenders: [
        { 
            type: 'console' , 
            level: 'INFO', 
            layout: { type:"pattern", pattern: " %[%m%]" } 
        },
        ]
    })
    log.setLevel('INFO');
  }
  
  return log;
}

function status(text) {
  if(log === undefined) throw new Error('must call createLogger first.');
  var argsArray = Array.prototype.slice.call(arguments);
  log.info.apply(log, argsArray);
  if (log.isInfoEnabled==false) {
    var str = util.format.apply(null,argsArray);
    process.stdout.write(str);
    process.stdout.write('\n');
  }
}

function fail(text) {
  if(log === undefined) throw new Error('must call createLogger first.');
  var argsArray = Array.prototype.slice.call(arguments);
  log.fatal.apply(log, argsArray);
  if (log.isFatalEnabled==false) {
    var str = util.format.apply(null,argsArray);
    process.stderr.write(str);
    process.stderr.write('\n');
  }
}

module.exports = {
    createLogger: createLogger,
    status: status,
    fail: fail
};