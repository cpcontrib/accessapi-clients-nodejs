#!/usr/bin/env node

var program = require('commander');
var prompt = require('prompt');
var fs = require('fs');
var util = require('util');
var chalk = require('chalk');
var accessapi = require('../index');

var cli_util = require('./cli_util');
var status = cli_util.status;
var log = cli_util.createLogger();

process.on('exit', () => { process.exit(0); })

collectSetValues = function(setExpr, setvalues) {
  var split = setExpr.split('=');
  setvalues = setvalues || {};
  setvalues[split[0]] = split[1];
  return setvalues;
}

program
  .name('update')

cli_util.addCommonOptions(program) //adds config,instance,stdin
  .option('-b', 'assume binary when reading, will force writing a binary asset in CrownPeak.')
  .option('-f,--field <field>', 'update using a specific field name, use when updating from a file or stdin without json')
  .option('-v,--value [value]', 'write a value to the specified field.  field must be specified.')
  .option('-s,--set <setExpr>','set field=value[&field2=value2&...], useful for reading in a file and overriding values', collectSetValues)
  .option('--runPostInput','run post input plugin for the asset\'s template', null, true)
  .option('--runPostSave', 'run post save plugin on the asset\'s template', null, true)
  .arguments("<assetPath> [inputFile]")
  .action(function (assetPath, inputFile) {
    program.assetPath = assetPath;
    program.inputFile = inputFile;
  })

program
  .parse(process.argv)

//ensure an empty object at least for subsequent Object.keys checks
program.set = program.set || {};

status.configureOptions(program);

log.debug('program.config',program.config);
log.debug('program.assetPath',program.assetPath);

function contentCollector(options, content) {
      
  if(Buffer.isBuffer(content) || typeof content === 'string') {
    log.debug('content is buffer or string. program.field=%s', program.field);
    if (options.field == undefined) {
      status.fail('Content wasnt parseable as json, and no --field parameter specified.');
      program.help();
    }
  }

  if(Buffer.isBuffer(content)) {
    fieldsJson = {};
    fieldsJson[options.field] = content.toString('utf8');
  }

  if(typeof content === 'string') {
    fieldsJson = {};
    fieldsJson[options.field] = content;
  }

  if(typeof content === 'object') {
    fieldsJson = content;
  }

  if(Object.keys(options.set).length > 0) {
    fieldsJson = fieldsJson || {};
    fieldsJson = Object.assign(fieldsJson, options.set);
  }

  return fieldsJson || {};

}

function getContentObject (program, encoding) {
  if (log.isDebugEnabled) log.debug('begin reading content');



  return new Promise((resolve,reject) => {

    if (program.stdin) {
      log.debug('reading content from stdin');
    
      var stdin = process.stdin;
      
      var inputChunks = [];
      
      stdin.on('data', function (data) {
        if (log.isDebugEnabled) log.debug('chunk:',data);
        if (Buffer.isBuffer(data)) data = data.toString('utf8');
        inputChunks.push(data);
      });
      
      stdin.on('end', function () {
        var contentStr = (inputChunks.length == 1 ? inputChunks[0] : inputChunks.join(""));
        
        try {
          var parsedData = JSON.parse(contentStr);
          resolve(contentCollector(program, parsedData));
        } catch(e) { /* deliberate */ }
        
        resolve(contentCollector(program, contentStr));
      });

    } else if(program.inputFile) {
      //read file name from program.args[2]
      log.debug("reading from file='%s'." , program.inputFile);
      
      var fileContent = fs.readFileSync(program.inputFile, { 'encoding': 'utf8' });
      
      var fields;

      try {
        var fields = JSON.parse(fileContent);
        resolve(contentCollector(program, fields));
      } catch(e) { /*deliberate*/ }
      
      //assign entire file contents to --field
      if(fields === undefined) {
        fields = {};
        fields[program.field] = fileContent;
        resolve(contentCollector(program, fields));
      }

    } else { 
      
      if(Object.keys(program.set).length > 0) {
        var fields = {};
        resolve(contentCollector(program, fields));
      }
      else
      {
        reject(new Error('not implemented'));
      }

    }
  
  });
}

validateUsage = function(program,process) {
  var exitcode=-1;

  if (typeof program.assetPath === 'undefined') {
    status.fail('no assetPath specified.');
    exitcode=1;
  }

  if (program.inputFile == undefined && program.field == undefined && Object.keys(program.set).length == 0 && program.stdin == undefined) {
    status.fail('no inputFile specified and --stdin not specified.  Cannot update.');
    exitcode=1;
  }

  if(program.value !== undefined && program.field == undefined) {
    status.fail('value specified but no field specified with --field');
    exitcode=1;
  }

  if(exitcode > 0) { 
    program.help();
    process.exit(exitcode); 
  }
}

main = function () {

  try
  {
    validateUsage(program,process);
    status.configureOptions(program);

    status.inform(`Updating: ${program.assetPath}`);
    
    var accessApiConfig = cli_util.findAccessApiConfig(program);

    accessapi.authenticate(accessApiConfig).then((accessapi) => {
      
      var assetIdOrPath = program.assetPath;

      log.debug('calling AssetExists');
      accessapi.AssetExists(assetIdOrPath).then(function (existsResp) {
        
        //existsResp documented http://developer.crownpeak.com/Documentation/AccessAPI/AssetController/Methods/Exists(AssetExistsRequest).html
        var workflowAssetId = existsResp.assetId;
        
        getContentObject(program).then(function (contentObject) {
          
          if(log.isDebugEnabled) {
            log.debug('contentObject from getContent:', contentObject);
          }

          var options = {
            runPostInput: (program.runPostInput || false),
            runPostSave: (program.runPostSave || false)
          };

          log.debug('calling AssetUpdate. options=%j', options);

          accessapi.AssetUpdate(workflowAssetId, contentObject, null, options).then(function() {
            status.inform('Success updating %s (%d).', program.assetPath, workflowAssetId);
          })

        });

      });

    });
  } catch(e) {
    console.error('Error: ',e)
  }

}();
