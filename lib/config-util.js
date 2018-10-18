var log4js = require('log4js');

//create logger for this library
var log = log4js.getLogger('crownpeak-accessapi');

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

let findConfigFile = function(loadOpts) {
  if(loadOpts == undefined) loadOpts = {}
  if(loadOpts.filename == undefined) loadOpts.filename = "accessapi-config.json";
  
  let triedPaths = [];

  for(let p of locationPaths) {
    let tryfile = path.join(p, filename);
    
    if(log.isDebugEnabled) log.debug('Trying path %s', tryfile);
    triedPaths.push(tryfile);

    if(fs.existsSync(tryfile)===true) {
      if(log.isDebugEnabled) log.debug('Found %s in %s', loadOpts.filename, p);
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
    loadOpts["file"] = findConfigFile(loadOpts);
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

module.exports = {
  readConfig: readConfig

}