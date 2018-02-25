var requestify = require('requestify');
var fs = require('fs');
var log4js = require('@log4js-node/log4js-api');
var util = require('util');
const path = require('path');

//create logger for this library
var log = log4js.getLogger('crownpeak-accessapi');

var opts = {
  "apikey": "",
  domain: '',
  instance: '',
  username: '',
  password: ''
};

var cookies = null;

baseURL = function (opts) {
  return 'https://' + opts.domain + '/' + opts.instance + '/cpt_webservice/accessapi';
}

//setup http headers
var options = {
  body: '',
  method: 'POST',
  headers: {
    'x-api-key': opts.apikey,
    'Content-Type': 'application/json; charset=utf8',
    //'Accept-Encoding': 'gzip, deflate '
  }
};

function checkConfig() {
  if (opts.instance === '' || opts.instance == undefined) {
    throw new Error("config not set.  use setConfig before calling api functions.");
  }
}

let locationPaths = {
  [Symbol.iterator]() {

    let p = path.parse(process.cwd());
    let parts = p.dir.split(path.sep);
    let count = parts.length+1;//+1 because we first try cwd
    let curTraverse = '.'+path.sep;

    return {
      next() {
        let checkPath = path.join(__dirname, curTraverse);
        curTraverse += '..' + path.sep;
        count--;
        return { done: (count<0), value: checkPath };
      }
    }
  }
};

let findConfigFile = function() {
  let filename = "accessapi-config.json";
  let triedPaths = [];

  for(let p of locationPaths) {
    let tryfile = path.join(p, filename);
    
    if(log.isDebugEnabled) log.debug('Trying path %s', tryfile);
    triedPaths.push(tryfile);

    if(fs.existsSync(tryfile)===true) {
      if(log.isDebugEnabled) log.debug('Found %s in %s', filename, p);
      return tryfile;
    }
  }

  //failure if we reach this point
  log.fatal('Failed to find an accessapi-config.json file.');
  throw util.format('Failed to find an accessapi-config.json file.\nPaths searched:\n%s',triedPaths.join('\n'));
}

loadConfig = function(loadOpts) {
  var loadOpts = loadOpts || {};
  
  if(loadOpts["file"] === undefined) {
    loadOpts["file"] = findConfigFile();
  }

  var accessapiConfig = JSON.parse(fs.readFileSync(loadOpts["file"]));;

  readConfig(loadOpts, accessapiConfig);

  setConfig(accessapiConfig);
  
  return opts;
}

function readConfig(loadOpts, accessapiConfig) {
  
  if (Array.isArray(accessapiConfig)) {
    //find specified instance
    if (loadOpts["instance"] === undefined) {
      accessapiConfig = accessapiConfig[0];
    } else {
      var found = accessapiConfig.find(function(item,index) {
        if (item["instance"] !== undefined && item["instance"] === loadOpts["instance"]) {
          return true;
        }
      });

      if (found !== undefined) {
        accessapiConfig = found;
      }
      throw new Error(util.format("failed to find instance '{0}' declared in '{1}'.", loadOpts["instance"], loadOpts["file"]));
    }
  }

  if(accessapiConfig === undefined) {
    log.warn('Failed to find suitable accessapi config.');
  } else {
    //set accessapiConfig to opts
    opts = accessapiConfig;
  }
}


  setConfig(accessapiConfig);
  
  return opts;
}

auth = function (callback) {
  
  var keytar;
  try {
    keytar = require('keytar');
  } catch(e) {}

  return new Promise((resolve,reject) => {
    
    new Promise((resolve2,reject2) => {

      var password = null;

      if(opts.password === undefined || opts.password === '') {

        if(keytar === undefined) {
          return reject("No password available and the keytar npm package is not available.  Must set password in the accessapiconfig.json or via --password option.");
        }

        var service = 'UN=' + opts.username + ';CN=' + opts.instance;

        //keytar uses OS keyring to store/retrieve passwords.
        keytar.getPassword('Crownpeak-AccessAPI-NodeJS',service)
        .then((returnedPass) => {
          resolve2(returnedPass)
        }, (reason) => {
          log.fatal('Failed to retrieve password: %s',reason);
          reject2(reason);
        })
        
      }
    }).catch((reason)=> {
      status.fatal(reason);
    }).then((password) => {

      var body = {
        "instance": opts.instance, 
        "username": opts.username, 
        "password": password, 
        "remember_me": false, 
        "timeZoneOffsetMinutes": -480
      };

      var restPostPromise = restPost('/auth/authenticate', body, callback);
      return resolve(restPostPromise);
  
    });

  });
  
}

logout = function (callback) {
  return restPost('/auth/logout', null, callback);
}

AssetExists = function (assetIdOrPath, callback) {
  var body = {
    "assetIdOrPath" : assetIdOrPath
  };
  return restPost('/asset/Exists', body, callback);
}

AssetUpdate = function (assetId, fields, fieldsToDelete, options) {
  var body = {
    "assetId" : assetId,
    "fields": fields,
    "fieldsToDelete": fieldsToDelete
  };
  
  options = options || {};
  if (options.runPostInput !== undefined)
    body["runPostInput"] = options.runPostInput;
  
  if (options.runPostSave !== undefined)
    body["runPostSave"] = options.runPostSave;
  
  return restPost('/asset/Update', body, arguments[arguments.length - 1]);
}

AssetUpload = function (newName, folderId, modelId, workflowId, bytes, callback) {
  var body = {
    "newName": newName,
    "destinationFolderId": folderId,
    "modelId": modelId,
    "workflowId": workflowId,
    "bytes": bytes
  };
  if (folderId == 0 || folderId == undefined) return callback('not allowed to import to root');
  return restPost('/asset/Upload', body, callback);
}

AssetCreate = function (newName, folderId, modelId, type, devTemplateLanguage, templateId, workflowId, callback) {
  var body = {
    "newName": newName,
    "destinationFolderId": folderId,
    "modelId": modelId,
    "type": type,
    "devTemplateLanguage": devTemplateLanguage,
    "templateId": templateId,
    "workflowId": workflowId
  }
  if (folderId == 0 || folderId == undefined) {
    log.fatal('create asset error, folderId=%d', folderId);
    return callback('not allowed to import to root');
  }
  return restPost('/asset/Create', body, callback);
}

AssetFields = function (AssetFieldsRequest) {
  
  return new Promise((resolve,reject)=>{
    if(AssetFieldsRequest===undefined || AssetFieldsRequest["assetId"]===undefined) {
      reject("No assetId specified.");
    }
    
    url = '/asset/fields/' + AssetFieldsRequest["assetId"];

    new Promise((resolve2,reject2)=>{
      restPost(url, null)
        .then((resp)=>resolve(resp));
    })
  
  });
}

AssetPaged = function (AssetPagedRequest, callback) {
  var body = AssetPagedRequest || {};
  
  return restPost('/asset/Paged', body, callback);
}

AssetRoute = function (AssetRouteRequest, callback) {
  var body = AssetRouteRequest || {};
  
  return restPost('/asset/Route', body, callback);
}

function setConfig(config) {
  for (var k in config) {
    opts[k] = config[k];
  }
}

//main http call
function restPost(url, body) {
  
  return new Promise((resolve,reject) => {

    url = baseURL(opts) + url;
    
    log.info("calling: %s", url);
    if (log.isDebugEnabled) {
      log.debug("body:", JSON.stringify(body));
      log.debug("opts:", opts);
    }

    options.body = body;
    //check if we need pass the cookies
    
    options.headers = {
      'x-api-key': opts.apikey,
      'Content-Type': 'application/json; charset=utf8',
      'Accept': 'application/json',
      //'Accept-Encoding': 'gzip, deflate '
    };

    if (cookies != null) {
      // todo: try to reuse headers from above.
      options.headers['Cookie'] = cookies
    }
    
    if (log.isDebugEnabled) log.debug('sending request', options);
    
    requestify.request(url, options).then(function (resp) {
      processCookies(resp);
      try { resp.json = JSON.parse(resp.body); } catch(ex) { }
      resolve(resp);
    }, (err) => {
      //todo: handle http 429, rate limiting busy, retry-after
      log.error('received error response:', err);
      reject(JSON.parse(err.body));
    });
    
    
    //var cbarg = arguments[arguments.length - 1];
    //if (typeof cbarg === 'function') try { return deferred.promise.nodeify(cbarg); } catch(ex) { log.warn('restPost cbarg failure: ', ex); }

  });
}

//handles cookies between http calls
function processCookies(resp, callback) {
  if (resp.headers['set-cookie'] != null) {
    log.debug('processing cookies');
    var cooks = resp.headers['set-cookie'];
    var newCookies = '';
    var cookieCount = 0;
    cooks.forEach(function (cookie) {
      var parts = cookie.split(';');
      if (cookieCount++ > 0) {
        newCookies += "; ";
      }
      newCookies += parts[0];
    });
    cookies = newCookies;
  }
}

module.exports = {
  auth: auth,
  loadConfig: loadConfig,
  setConfig: setConfig,
  AssetExists: AssetExists,
  AssetCreate: AssetCreate,
  AssetPaged: AssetPaged,
  AssetRoute: AssetRoute,
  AssetFields: AssetFields,
  logger: log
}
