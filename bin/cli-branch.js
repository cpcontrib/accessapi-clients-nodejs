#!/usr/bin/env node

var program = require('commander');
var accessapi = require('../index');

var cli_util = require('./cli_util');
var status = cli_util.status;
var log = cli_util.createLogger();

program
  .name('branch')
cli_util.addCommonOptions(program)
  //.option('--recursive','route', false)
  .arguments("<assetPath> [workflowStatus]")
  .action(function(assetPath,workflowStatus) {
    program.assetPath = assetPath;
    program.workflowStatus = workflowStatus;
  })

program
  .parse(process.argv)

if(log.isDebugEnabled()) log.debug('program options', program._args);
cli_util.status.configureOptions(program);

main = function() {

  status.info("Branch asset '%s'.", program.assetPath);    

  var accessApiConfig = cli_util.findAccessApiConfig(program);

  accessapi.authenticate(accessApiConfig).then((accessapi) => {

    accessapi.AssetExists(program.assetPath).then((resp)=>{
      
      if(resp.exists !== true) {
        status.fail("asset '%s' was not found.", program.assetPath);
        process.exit(1);
      }

      log.debug('calling AssetBranch');
      accessapi.AssetBranch(resp.assetId).then((resp)=> {

        status.porcelain(resp);
        status.info("Succeeded branching asset '%s'.  New assetId='%d'.", program.assetPath, resp.asset.id);

      })

    });

      

  });

}();
