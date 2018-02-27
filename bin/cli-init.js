#!/usr/bin/env node

var program = require('commander');
var prompt = require('prompt');
var fs = require('fs');
var chalk = require('chalk');

var status = require('./cli_util').status;
var constants = require('./cli_util').constants;

program
  .name('init')
  .parse(process.argv)

console.log('- Initialize %s', constants.configJsonName);
console.log();
console.log(chalk.yellow('Note that the CrownPeak AccessAPI requires the use of an API Key.'));
console.log('Contact CrownPeak support at support@crownpeak.com to request a key.');
console.log();
console.log();

var currentValues = {};
if(fs.existsSync('accessapi-config.json')) {
  
  try {
    currentValues = JSON.parse(fs.readFileSync(constants.configJsonName, { encoding:"utf8" }));
  } 
  catch(e) {
    console.log(chalk.red('Warning: Failed to read current %s',constants.configJsonName));
    console.log();
  }
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
      console.log(chalk.green('Stored password into OS keychain.'));
      resolve();
    })
  
  }).then(()=> {

    var showOptions = Object.assign({}, result);
    delete showOptions.password;

    console.log('Here is the options:');
    console.log(JSON.stringify(showOptions,null,2));
    console.log();

    checkConfig(result)
    .then(()=>{

      prompt.get([{name:'write_file',message:'Write to file?',validator: /[y|n]/}], (err,questionResult)=> {

        if(questionResult["write_file"] === 'y') {
          delete result.password;

          //write the options into accessapi-config.json file
          fs.writeFileSync('./' + constants.configJsonName, JSON.stringify(result,null,2), 'utf-8');
    
          console.log();
          console.log('Wrote answers to %s', constants.configJsonName);
        }

      });

    })

  })

});

function checkConfig(options) {

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
          console.log('Appears to have succeeded.');
          resolve();
        }).catch((reason)=>{
          console.log('Appears to have failed.');
          reject();
        })

      }
      
    })

  });

}



function onErr(err) {
  console.log(err);
  return 1;
}