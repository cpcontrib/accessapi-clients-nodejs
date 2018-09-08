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
  .name('crownpeak list')

program
  .option('--config <file>', 'a config file to use. defaults to looking for accessapi-config.json')
  .option('-i,--instance', 'instance (required if multiple instances defined in the config file)')
  //.option('--recursive','route', false)
  .option('--json', 'output as raw json')
  .option('-f,--formatter <formatter>', 'use a specific formatter.  valid options are [json|dosdir|default]', null, "default")
  .arguments("<assetPath>")
  .action(function (assetPath) {
    program.assetPath = assetPath;
  })

program
  .parse(process.argv)

if(program["json"]==true) {
  program["formatter"]="json";
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

function formatdosdir(program,assetArr,writer) {
  writer.write(util.format(' Directory of %s\n', program.assetPath));
  writer.write('\n');
              
  for(var i=0; i < assetArr.length; i++) {
    var asset = assetArr[i];
    
    var directoryOrSizeStr = null;
    if(asset.type === 4) {
      directoryOrSizeStr = '<DIR>         ';
    } else if(asset.type === 2) {
      directoryOrSizeStr = pad('             ', asset.size,true);
    }
    
    
    var formattedDateStr = asset.modified_date.toString();
    formattedDateStr = pad('                        ', formattedDateStr);
    
    writer.write(util.format('%s  %s %s`%d`', formattedDateStr, directoryOrSizeStr, asset.label, asset.id));
  }
}
function formatjson(program,assetArr,writer) {
  writer.write(JSON.stringify(assetArr,null,'  '));
}
function formatdefault(program,assetArr,writer) {

  writer.write(util.format('  Directory of crownpeak://%s%s\n', program.instance, program.assetPath));
  writer.write(util.format('\n'));
              
  for(var i=0; i < assetArr.length; i++) {
    var asset = assetArr[i];
    
    var directoryOrSizeStr = null;
    if(asset.type === 4) {
      directoryOrSizeStr = '<DIR>         ';
    } else if(asset.type === 2) {
      directoryOrSizeStr = pad('             ', asset.size,true);
    }
    
    
    var formattedDateStr = asset.modified_date.toString();
    formattedDateStr = pad('                        ', formattedDateStr);
    
    writer.write(util.format('%s  %s %s (%d) [%s]\n', formattedDateStr, directoryOrSizeStr, asset.label, asset.id, asset.statusName));
  }
}

formatters = {
  formatjson: formatjson,
  formatdefault: formatdefault,
  formatdosdir: formatdosdir
}

function getFormatter(program, formatters, status) {
  var formatFunc = null;
  
  var formatterStr = program["formatter"]; //dont mutate program object!

  if(typeof formatterStr !== 'string') formatterStr = "";

  if(formatterStr === "" || formatterStr.toLowerCase() === 'default') {
    formatterStr = "default";
  }

  formatFunc = formatters[formatterStr];
  if(formatFunc === undefined) {
    formatFunc = formatters['format' + formatterStr];
  }
  
  if(formatFunc === undefined) {
    status.error("a formatter named '%s' or 'format%s' was not found.", formatterStr, formatterStr);
    formatFunc = formatdefault;
  }

  return formatFunc;
}

main = function() {

  var status = cli_util.status;

  var accessapi = require('../index');

  var loadConfigOpts = {};
  loadConfigOpts.file = program.config;
  loadConfigOpts.instance = program.instance;
  accessapi.loadConfig(loadConfigOpts);

  log.info("Listing contents of 'crownpeak://%s%s'.", program.instance, program.assetPath);    

  log.debug('auth');
  accessapi.auth().then(()=>{

    accessapi.AssetExists(program.assetPath).then((resp2)=>{
      var resp = resp2.json;
      
      if(resp.exists !== true) {
        status.error("folder '%s' was not found.", program.assetPath);
        process.exit(1);
      }

      accessapi.AssetPaged({"assetId":resp.assetId,"pageSize":200}).then((resp2)=>{
        var resp = resp2.json;
        var formatter = getFormatter(program, formatters, status);

        if(formatter !== undefined) {
          formatter(program, resp.assets, process.stdout);
        }

      });

    });

  },(err) => {
    status.error("The operation failed: ",err);
  });

}();

module.exports = {
  formatters: formatters,
  getFormatter: getFormatter
};
