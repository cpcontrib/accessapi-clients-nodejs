var requestify = require('requestify');
var fs = require('fs');
var Q = require('q');
var log4js = require('log4js');

var log = log4js.getLogger('crownpeak-accessapi');

// if (fs.existsSync('./log4js.json')) {
//   log4js.configure('./log4js.json');
// } else if(process.env.LOG4JS_CONFIG !== undefined) {
//   //do nothing, log4js configures based on this
// } else {
//   log4js.configure({
//     appenders: [
//       { 
//         type: 'console', 
//         layout: { type: 'pattern', pattern: '%d{ABSOLUTE} %c%[%-5p%] %m%n'}
//       }
//     ]
//   })
//   //log.setLevel(log4js.levels.OFF);//default, dont show any
// }

var opts = {
  "apikey": "",
  domain: '',
  instance: '',
  username: '',
  password: ''
};

var cookies = null;

//read a json file with configuration fields, so we don't have to hard code them
if (fs.existsSync('config.json')) {
  log.info('reading config.json');
  var config = JSON.parse(fs.readFileSync('config.json', { "encoding": "utf8" }));
  instance = config.instance;
  domain = config.server;
  apikey = config.accessKey;
  username = config.username;
  if (log.isDebugEnabled) {
    log.debug('config', config);
  }
  opts = config;
}

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

exports.auth = function (callback) {
  
  var body = {
    "instance": opts.instance, 
    "username": opts.username, 
    "password": opts.password, 
    "remember_me": false, 
    "timeZoneOffsetMinutes": -480
  };
  
  return restPost('/auth/authenticate', body, callback);
}

exports.logout = function (callback) {
  return restPost('/auth/logout', null, callback);
}

exports.AssetExists = function (assetIdOrPath, callback) {
  var body = {
    "assetIdOrPath" : assetIdOrPath
  };
  return restPost('/asset/Exists', body, callback);
}

exports.AssetUpdate = function (assetId, fields, fieldsToDelete, runPostInput, runPostSave) {
  var body = {
    "assetId" : assetId,
    "fields": fields,
    "fieldsToDelete": fieldsToDelete
  };
  
  if (runPostInput !== undefined)
    body["runPostInput"] = runPostInput;
  
  if (runPostSave !== undefined)
    body["runPostSave"] = runPostSave;
  
  return restPost('/asset/Update', body, arguments[arguments.length - 1]);
}

exports.AssetUpload = function (newName, folderId, modelId, workflowId, bytes, callback) {
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

exports.AssetCreate = function (newName, folderId, modelId, type, devTemplateLanguage, templateId, workflowId, callback) {
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

exports.setConfig = function (config) {
  for (var k in config) {
    opts[k] = config[k];
  }
}

//main http call
function restPost(url, body) {
  var deferred = Q.defer();
  
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
    deferred.resolve(resp);
  }, function (err) {
    //todo: handle http 429, rate limiting busy, retry-after
    log.error('received error response:', err);
    deferred.reject(JSON.parse(err.body));
  });
  
  
  var cbarg = arguments[arguments.length - 1];
  if (typeof cbarg === 'function') try { return deferred.promise.nodeify(cbarg); } catch(ex) { log.warn('restPost cbarg failure: ', ex); }

  return deferred.promise;
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

exports.logger = log;
