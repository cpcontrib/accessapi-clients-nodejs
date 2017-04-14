var log4js = require('log4js');
var fs = require('fs');

var log = log4js.getLogger('crownpeak-accessapi-cli');

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

module.exports = log;