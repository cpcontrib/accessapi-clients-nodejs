# crownpeak-accessapi for NodeJS
CrownPeak AccessAPI interface for NodeJS

Easy to install via npm: [note: not published yet]
```
npm install -g crownpeak-accessapi
```

Includes command line interface when installed
```
$ npm install -g crownpeak-accessapi
$ crownpeak init       # first step, initialize an accessapi-config.json file, includes API key and credentials for a user
$ crownpeak list "/"  # list contents of root folder
$ echo -n Welcome | crownpeak update /Test --field=body  # opens asset "/Test" and updates the body field to "Welcome"
$ crownpeak route "/Test" Live  # routes asset named 'Test' in the root folder '/' to Live workflow status
```

Current set of commands on the CLI:
- list
- update
- route

Current set of commands available in NodeJS via require('crownpeak-accessapi')
- AuthenticateAuth
- AssetExists
- AssetPaged
- AssetRoute

See [wiki](https://github.com/crownpeak-contrib/accessapi-clients/wiki) for more information
