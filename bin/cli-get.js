#!/usr/bin/env node

var program = require('commander');
var prompt = require('prompt');
var fs = require('fs');
var util = require('util');

var cli_util = require('./cli_util');
var log = cli_util.createLogger();

//process.on('exit', () => { process.exit(0); })

var constants = {
  configJsonName: "accessapi-config.json"
};

program
  .name('crownpeak get')

program
  .option('--config <file>', 'a config file to use. defaults to using ./accessapi-config.json', 'accessapi-config.json')
  .option('-i,--instance', 'instance (required if multiple instances defined in the config file)')
  //.option('--recursive','route', false)
  .option('--json', 'output as json')
  .option('-f, --fields [list]', 'comma separated list of fields to output. specifying exactly one field will get the field value, more than one will turn on json output.')
  //.option('-f,--formatter', 'use a specific formatter.  valid options are [rawjson|dosdir|default]')
  .arguments("<assetPath> required")
  .action(function (assetPath) {
    program.assetPath = assetPath;
  })

program
  .parse(process.argv)

function getSystemStates(accessapi) {
    var deferred = Q.defer();

    log.debug('getSystemStates');

    return deferred.promise;
}

function pad(pad, str, padLeft) {
  if (typeof str === 'undefined') 
    return pad;
  if (padLeft) {
    return (pad + str).slice(-pad.length);
  } else {
    return (str + pad).substring(0, pad.length);
  }
}

main = function() {

  var status = cli_util.status;
  log.info("Retrieving asset 'crownpeak://%s%s'.", program.instance, program.assetPath);

  var accessapi = require('../index');

  var loadConfigOpts = {};
  loadConfigOpts.file = program.config;
  loadConfigOpts.instance = program.instance;
  accessapi.loadConfig(loadConfigOpts);

  log.debug('auth');
  accessapi.auth().then(()=>{

    accessapi.AssetExists(program.assetPath).then((resp2)=>{
      var resp = resp2.json;
      
      if(resp.exists !== true) {
        status.error("Asset '%s' was not found.", program.assetPath);
        process.exit(1);
      }

      if(log.isLevelEnabled("Info")) { log.info('Found asset: %s', JSON.stringify(resp2.json)); }

      accessapi.AssetFields({"assetId":resp.assetId}).then((resp2)=>{
        if(log.isLevelEnabled("Debug")) { log.debug("Received response: %o", resp2); }

        if(program["rawJson"]==true) {
          process.stdout.write(JSON.stringify(resp2.json));
          return;
        } 
        
        if(typeof program["fields"] === 'string') {
          var fieldListArr = program["fields"].split(',') || [];
          
          var output = {};
          for(var j=0;j < fieldListArr.length;j++) {
            for(var i=0;i < resp2.json.fields.length; i++) {
              if(fieldListArr[j] === '*' || resp2.json.fields[i].name == fieldListArr[j]) {
                output[resp2.json.fields[i].name] = resp2.json.fields[i].value;
              }
            }
          }

          if(fieldListArr.length > 1)
            process.stdout.write(JSON.stringify(output));
          else {
            if(typeof output[fieldListArr[0]] === 'undefined') {
              status.error('Field named \'%s\' wasnt found.', fieldListArr[0]);
            } else {
              process.stdout.write(output[fieldListArr[0]]);
            }
            
          }

          return;
        } 

        if(resp2.json.fields.length == 1) {
          process.stdout.write(resp2.json.fields[0].value);
          return;
        }

      });

    });

  },(err) => {
    status.error("The operation failed: ",err);
  });

}();
