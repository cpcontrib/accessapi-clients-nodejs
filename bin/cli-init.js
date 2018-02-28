#!/usr/bin/env node

var program = require('commander');
var prompt = require('prompt');
var fs = require('fs');
var path = require('path');
var util = require('util');
var chalk = require('chalk');

var status = require('./cli_util').status;
var constants = require('./cli_util').constants;

var log4js = require('@log4js-node/log4js-api');
var log = log4js.getLogger('crownpeak-cli');

program
  .name('init')
  .option('--config <file>', 'a config file to use. defaults to looking for accessapi-config.json', constants.configJsonName)

program
  .parse(process.argv)


let askTestConfigOptions = function (options) {

  return new Promise((resolve,reject)=> {

    prompt.message = "";
    prompt.get([
      {
        name: 'test_options'
        ,message: 'Test these options against webservice?'
        ,validator: /[y|n]/
      }
    ], (err, testresult) => {

      if(testresult["test_options"] === 'n') {
        resolve();
      } else {

        accessapi = require('../index.js');
        accessapi.setConfig(options);
        accessapi.auth().then(()=>{
          status.info('Test connection appears to have succeeded.');
          resolve();
        }).catch((reason)=>{
          status.warn('Test connection appears to have failed.');
          log.info('options used: %o', options);
          reject();
        })

      }
      
    })

  });

}

let main = function (program) {

  status.inform('Initialize %s', constants.configJsonName);
  status.inform();
  status.inform(chalk.yellow('Note that the CrownPeak AccessAPI requires the use of an API Key.'));
  status.inform('Contact CrownPeak support at support@crownpeak.com to request a key.');
  status.inform();
  status.inform();
  
  var currentValues = {};

  if(program.config === undefined) {
    program.config = constants.configJsonName;
  }

  var fname = path.join(process.cwd(), program.config);
  if(fs.existsSync(fname) === false) {
    throw util.format('Config file named \'%s\' was not found.', program.config);
  } else {
    currentValues = JSON.parse(fs.readFileSync(fname, { encoding:"utf8" }));
  }
  
  //https://github.com/flatiron/prompt#valid-property-settings
  var properties = [
    { 
      name: 'instance'
      ,default: currentValues["instance"]
      ,message: 'Name of the CrownPeak instance'
      ,pattern: /^\w+$/
    }
    ,{
      name: 'domain'
      ,default: currentValues["domain"] || "cms.crownpeak.net"
      ,message: 'Domain of api service'
    }
    ,{
      name: 'apikey'
      ,message: 'The API key to access the instance with'
      ,default: currentValues.apikey
    }
    ,{
      name: 'username'
      ,message: 'Username to use to access. Leave blank for OS password chain support.'
      ,default: currentValues.username
    }
    ,{
      name: 'password'
      ,hidden: true
      ,replace: '*'
      ,message: 'Password to use to access (stored in OS keychain)'
      //,ask: function() {
      //  ////only ask if the username was entered.
      //  //return prompt.history('username').value > 0;
      //}
    }
  ];
  
  
  prompt.message = "Enter ";
  prompt.delimiter = chalk.green(':');
  prompt.start();
  
  prompt.get(properties, function(err,result) {
    if(err) { return onErr(err); }
    
    result["cms_instance_url"] = "https://" + result["domain"] + "/" + result["instance"];
    
    return new Promise((resolve,reject) => {
      var keytar;
      try { keytar = require('keytar'); }
      catch(ex) { throw 'Failed to load keytar.'; }
  
      var service = 'UN=' + result.username + ';CN=' + result.instance;
      keytar.setPassword('Crownpeak-AccessAPI-NodeJS', service, result.password).then(()=>{
        status.info(chalk.green('Stored password into OS keychain.'));
        resolve();
      })
    
    }).then(()=> {
  
      var showOptions = Object.assign({}, result);
      delete showOptions.password;
  
      status.info('Here are the options:\n' + 
        '%s\n' +
        '\n', JSON.stringify(showOptions,null,2));
  
      askTestConfigOptions(result)
      .then(()=>{
  
        var writeFilePrompt = {
          name:'write_file',
          message:util.format('Write to file \'%s\'?',program.config),
          validator: /[y|n]/
        };

        prompt.get([writeFilePrompt], (err,questionResult)=> {
  
          delete result.password;

          if(questionResult["write_file"] === 'y') {
  
            //write the options into accessapi-config.json file
            let fname = path.join(process.cwd(), program.config);
            
            log.info("Writing to file '%s'.", fname);
            
            try { fs.writeFileSync(fname, JSON.stringify(result,null,2), 'utf-8'); }
            catch(e) { status.fail('Failed to write file: %s', e); }
      
            status.info('Wrote answers to %s', program.config);
          } else {
            status.warn('Aborted.');

          }
  
        });
  
      })
  
    })
  
  });
  
}(program);

function onErr(err) {
  console.log(err);
  return 1;
}