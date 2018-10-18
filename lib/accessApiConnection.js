var request = require('request-promise-native');
var log4js = require('@log4js-node/log4js-api');
var keytar = require('keytar');

//var AssetsController = require('./assetsController');
//var WorkflowController = require('./workflowController');

var log = log4js.getLogger('accessApiConnection');

class AccessApiConnection {

  constructor(accessApiConfig) {
    this._accessApiConfig = accessApiConfig;
    this._postheaders = null;
    this._cookies = null;

    //this._assetsController = new AssetsController(this);

    this._request = request.defaults({json:true, jar:true, gzip:true});
  }

  //get Assets() {
  //  return this._assetsController;
  //}

  _baseURL() {
    return 'https://' + this._accessApiConfig.domain + '/' + this._accessApiConfig.instance + '/cpt_webservice/accessapi';
  }

  logout() {
    return restPost('/auth/logout', null);
  }

  //handles cookies between http calls
  _processCookies(resp) {
    
    log.debug('processing cookies');

    if (resp.headers['set-cookie'] != null) {
      
      var newCookies = '';
      var cookieCount = 0;
      
      resp.headers['set-cookie'].forEach(function (cookie) {
        var parts = cookie.split(';');
        if (cookieCount++ > 0) {
          newCookies += "; ";
        }
        newCookies += parts[0];
      });
      
      this._cookies = newCookies;
    }
  }

  _getPassword(accessApiConfig) {
    return new Promise((resolve,reject) => {
      
      //easy path
      if(accessApiConfig.password !== undefined && accessApiConfig.password !== '') {
        resolve(accessApiConfig.password);
      }

      //create service name for keytar to query OS keyring
      var service = 'UN=' + accessApiConfig.username + ';CN=' + accessApiConfig.instance;

      keytar.getPassword('Crownpeak-AccessAPI-NodeJS', service)
        .then((returnedPass) => {
          resolve(returnedPass);
        }, (reason) => {
          log.warn('Failed to retrieve password: %s', reason);
          reject(reason);
        });

    });
  }

  _auth() {
  
    if(log.isDebugEnabled()) log.debug('beginning auth...');

    return new Promise((resolve,reject)=> {
    
      this._getPassword(this._accessApiConfig)
      .then((password) => {
      
        var body = {
          "instance": this._accessApiConfig.instance, 
          "username": this._accessApiConfig.username, 
          "password": password, 
          "remember_me": false, 
          "timeZoneOffsetMinutes": -480
        };

        this._restPost('/auth/authenticate', body).then(() => {
          resolve();
        }).catch((e) => {
          console.log(e)
        })
    
      });

    });
  
  }

  _restPost(url, body) {
  
    //return new Promise((resolve,reject) => {

      url = this._baseURL() + url;
      
      let req = {
        method: 'POST',
        body: body,
        headers: {
          'x-api-key': this._accessApiConfig.apikey,
          'Content-Type': 'application/json; charset=utf8',
          'Accept': 'application/json',
          //'Accept-Encoding': 'gzip, deflate '
        }
      };

      //commented out: request has jar:true for cookie handling
      // if (this._cookies != null) {
      //   // todo: try to reuse headers from above.
      //   req.headers['Cookie'] = this._cookies
      // }
      
      if (log.isDebugEnabled()) log.debug('sending request', req);
      
      return this._request(url, req)
        .then((resp) => {
          if(log.isDebugEnabled()) log.debug('received response', resp);
          return resp;
        })
        .catch((e) => {
          if(log.isErrorEnabled()) log.error('error response', {statusCode:e.statusCode,name:e.name,error:e.error,options:e.options});
          throw e;
        })
      // .then((resp) => {
        
      //   try { 
      //     if(log.isDebugEnabled()) log.debug('received response:', resp);
          
      //     resolve(resp); 
      //   } catch(ex) { 
      //     reject(ex);
      //   }
      // }, (err) => {
      //   //todo: handle http 429, rate limiting busy, retry-after
      //   log.error('received error response:', err);
      //   reject(JSON.parse(err.body));
      // });
      
    //});
  }

  AssetExists(assetIdOrPath) {
    var body = {
      "assetIdOrPath" : assetIdOrPath
    };
    return this._restPost('/asset/Exists', body);
  }

  AssetUpdate(assetId, fields, fieldsToDelete, options) {
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
    
    return this._restPost('/asset/Update', body);
  }

  AssetUpload(newName, folderId, modelId, workflowId, bytes) {
    var body = {
      "newName": newName,
      "destinationFolderId": folderId,
      "modelId": modelId,
      "workflowId": workflowId,
      "bytes": bytes
    };
    if (folderId == 0 || folderId == undefined) throw 'not allowed to import to root';
    return this._restPost('/asset/Upload', body);
  }

  AssetCreate(newName, folderId, modelId, type, devTemplateLanguage, templateId, workflowId) {
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
      throw ('not allowed to import to root');
    }
    
    return this._restPost('/asset/Create', body);
  }

  AssetFields(AssetFieldsRequest) {

    if(AssetFieldsRequest===undefined || AssetFieldsRequest["assetId"]===undefined) {
      throw ("No assetId specified.");
    }

    var url = '/asset/fields/' + AssetFieldsRequest["assetId"];

    return this._restPost(url, AssetFieldsRequest);
  }

  AssetPaged(AssetPagedRequest) {
    var body = AssetPagedRequest || {};
    
    return this._restPost('/asset/Paged', body);
  }

  AssetRoute(AssetRouteRequest) {
    var body = AssetRouteRequest || {};
    
    return this._restPost('/asset/Route', body);
  }

  AssetBranch(id) {
    var body = {};
    var idParam;

    if(typeof(id) === 'number') {
      idParam = id;
    }

    return this._restPost(`/asset/Branch/${idParam}`, body);
  }
}

module.exports = AccessApiConnection;