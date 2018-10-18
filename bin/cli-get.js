#!/usr/bin/env node

var program = require('commander');
var prompt = require('prompt');
var fs = require('fs');
var util = require('util');
var accessapi = require('../index');

var cli_util = require('./cli_util');
var log = cli_util.createLogger();

//process.on('exit', () => { process.exit(0); })

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
  // application specific logging, throwing an error, or other logic here
});

program
  .name('crownpeak get')

cli_util.addCommonOptions(program)
  //.option('--recursive','route', false)
  .option('--json', 'output as json')
  .option('-f, --fields <list>', 'comma separated list of fields to output. specifying exactly one field will get the field value, more than one will turn on json output.', cli_util.asList, [])
  //.option('-f,--formatter', 'use a specific formatter.  valid options are [rawjson|dosdir|default]')
  .arguments("<assetPath> required")
  .action(function (assetPath) {
    program.assetPath = assetPath;
  })

program
  .parse(process.argv)
handleOutput = function(program, resp, status, writer) {
  if(program["json"]==true) {
    writer.write(JSON.stringify(resp.fields));
    return;
  }
  
  var fieldListArr = program["fields"];
  if(fieldListArr.length > 0) {
    
    var obj = {};
    for(var j=0;j < fieldListArr.length;j++) {
      for(var i=0;i < resp.fields.length; i++) {
        if(fieldListArr[j] === '*' || resp.fields[i].name == fieldListArr[j]) {
          obj[resp.fields[i].name] = resp.fields[i].value;
        }
      }
    }

    if(fieldListArr.length > 1)
      writer.write(JSON.stringify(obj));
    else {
      if(typeof obj[fieldListArr[0]] === 'undefined') {
        status.error('Field named \'%s\' wasnt found.', fieldListArr[0]);
      } else {
        writer.write(obj[fieldListArr[0]]);
      }
    }

    return;
  } 

  if(resp.fields.length == 1) {
    writer.write(resp.fields[0].value);
    return;
  }
}

main = function() {

  var status = cli_util.status;
  log.info("Retrieving asset 'crownpeak://%s%s'.", program.instance, program.assetPath);

  var accessApiConfig = cli_util.findAccessApiConfig(program);

  accessapi.authenticate(accessApiConfig).then((apiconn)=>{
    log.debug('assetexists...');
    
    apiconn.AssetExists(program.assetPath).then((resp)=>{
     
      if(resp.exists !== true) {
        status.error("Asset '%s' was not found.", program.assetPath);
        process.exit(1);
      }

      if(log.isLevelEnabled("Debug")) { log.debug('Found asset: %s', JSON.stringify(resp)); }

      apiconn.AssetFields({"assetId":resp.assetId}).then((f_resp)=>{
        
        if(log.isLevelEnabled("Debug")) { log.debug("Received response: %o", f_resp); }

        handleOutput(program, f_resp, status, process.stdout)

      });

    });

  },(err) => {
    status.error("The operation failed: ",err);
  });

}();
