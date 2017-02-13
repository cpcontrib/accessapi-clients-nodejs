var requestify = require('requestify');
var colors = require('colors');
var fs = require('fs');
var Q = require('q');

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
  console.log('reading config.json'.yellow.bold);
  var config = JSON.parse(fs.readFileSync('config.json', { "encoding": "utf8" }));
  instance = config.instance;
  domain = config.server;
  apikey = config.accessKey;
  username = config.username;
  console.log('instance: ' + config.instance);
  console.log('domain: ' + config.server);
  console.log('username: ' + config.username);
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
    console.log('create asset error, folderId = ' + folderId);
    return callback('not allowed to import to root');
  }
  return restPost('/asset/Create', body, callback);
}

exports.setConfig = function (config) {
  for (var k in config) {
    //console.log('k=%s', k, config[k]);
    opts[k] = config[k];
		//console.log('opts[\'%s\'] = %s', k, opts[k]);
  }
}

//main http call
function restPost(url, body) {
  var deferred = Q.defer();
  
  url = baseURL(opts) + url;
  
  console.log("calling: ".yellow.bold + url.green.bold);
  console.log("body:", JSON.stringify(body));
  console.log("opts in restPost: %o", opts);

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
  //console.log('sending request', options);
  requestify.request(url, options).then(function (resp) {
    processCookies(resp);
    try { resp.json = JSON.parse(resp.body); } catch(ex) { }
    deferred.resolve(resp);
  }, function (err) {
    //todo: handle http 429, rate limiting busy, retry-after
    console.log('request.err=%o', err);
    deferred.reject(JSON.parse(err.body));
  });
  
  
  var cbarg = arguments[arguments.length - 1];
  if (typeof cbarg === 'function') try { return deferred.promise.nodeify(cbarg); } catch(ex) { console.log('restPost cbarg failure: ', ex); }

  return deferred.promise;
}

//handles cookies between http calls
function processCookies(resp, callback) {
  if (resp.headers['set-cookie'] != null) {
    var cooks = resp.headers['set-cookie'];
    var newCookies = '';
    var cookieCount = 0;
    cooks.forEach(function (cookie) {
      var parts = cookie.split(';');
      //console.log(parts);
      if (cookieCount++ > 0) {
        newCookies += "; ";
      }
      newCookies += parts[0];
    });
    cookies = newCookies;
  }
}
