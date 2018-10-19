var log4js = require('@log4js-node/log4js-api');
var fs = require('fs');
var util = require('util');
var AccessApiConnection = require('./lib/accessApiConnection');

//create logger for this library
var log = log4js.getLogger('crownpeak-accessapi');

class AccessApi {

  static loadAccessApiConfig(configFileSpec, instance) {

    if(configFileSpec === undefined) {
      configFileSpec = "accessapi-config.json";
      log.debug('configFileSpec undefined, setting default.');
    }

    log.debug("configFileSpec=%s", configFileSpec);

    if (fs.existsSync(configFileSpec)==false) {
      throw new Error(util.format('Failed to load accessApi config from %s: file doesnt exist.', configFileSpec));
    }

    //var reader = require('./accessapi-json-config-reader');
    var accessapiConfig = JSON.parse(fs.readFileSync(configFileSpec));

    if(Array.isArray(accessapiConfig)) {
      throw new Error('array of instance, not implemented yet.');
    }
    
    log.debug('loaded file %s', configFileSpec);
    log.debug('accessapiConfig:\n', accessapiConfig);

    return accessapiConfig;
  }

  static authenticate(accessApiConfig) {
    return new Promise((resolve,reject) => {
      var conn = new AccessApiConnection(accessApiConfig);
      conn._auth().then(() => {
        resolve(conn);
      });
    });
  }
}

module.exports = AccessApi;
