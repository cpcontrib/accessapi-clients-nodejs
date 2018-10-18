#!/usr/bin/env node

var program = require('commander');
var util = require('util');

var accessapi = require('../index');
var cli_util = require('./cli_util');
var status = cli_util.status;
var log = cli_util.createLogger();

//process.on('exit', () => { process.exit(0); })

program
  .name('crownpeak list')

cli_util.addCommonOptions(program)
  //.option('--recursive','route', false)
  .option('--json', 'output as raw json')
  .option('-f,--formatter <formatter>', 'use a specific formatter.  valid options are [json|dosdir|default]', null, "default")
  .arguments("<assetPath>")
  .action(function (assetPath) {
    program.assetPath = assetPath;
  })

program
  .parse(process.argv)

status.configureOptions(program);

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

  var accessApiConfig = cli_util.findAccessApiConfig(program);

  log.info("Listing contents of 'crownpeak://%s%s'.", program.instance, program.assetPath);    

  log.debug('auth');
  accessapi.authenticate(accessApiConfig).then((accessapi)=>{

    accessapi.AssetExists(program.assetPath).then((resp)=>{
      
      if(resp.exists !== true) {
        status.error("folder '%s' was not found.", program.assetPath);
        process.exit(1);
      }

      accessapi.AssetPaged({"assetId":resp.assetId,"pageSize":300}).then((resp)=>{
        
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
