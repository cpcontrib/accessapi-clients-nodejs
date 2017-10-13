#!/usr/bin/env node

var program = require('commander');
var prompt = require('prompt');
var fs = require('fs');
var chalk = require('chalk');

var constants = {
  configJsonName: "accessapi-config.json"
};

program
  .name('init')
  .parse(process.argv)
  
console.log('Initialize a %s', constants.configJsonName);
console.log();
console.log('Note that the CrownPeak AccessAPI requires the use of an API Key.  Contact CrownPeak support at support@crownpeak.com to request a key.');
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
var testOptions = [
  {
    name: 'test_options'
    ,message: 'Test these options against webservice?'
    ,validator: /[y|n]/
  }
];

prompt.start();

prompt.get(properties, function(err,result) {
  if(err) { return onErr(err); }
  
  result["cms_instance_url"] = "https://" + result["domain"] + "/" + result["instance"];
  
  new Promise((resolve,reject)=>{

    const keytar = require('keytar');
    keytar.setPassword('Crownpeak-AccessAPI-NodeJS',result["username"]+'@'+result["instance"],result["password"]).then(()=>{
      console.log('Stored password into OS keychain.');
      resolve();
    })

  }).then(()=> {

    delete result["password"];

    console.log('options:');
    console.log(JSON.stringify(result,null,2));

    console.log();
    prompt.get(testOptions, (err,testresult)=>{
      if(testresult["test_options"] === 'y') {
        console.log('not implemented yet');
      }
    
      fs.writeFileSync('./' + constants.configJsonName, JSON.stringify(result,null,2), 'utf-8');
      console.log();
      console.log('Wrote answers to %s', constants.configJsonName);
      
    })

  })

});

function onErr(err) {
  console.log(err);
  return 1;
}