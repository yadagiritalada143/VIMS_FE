const packageVersion = require('./package.json').version;
const appSetting = require('./src/appsetting.json');

appSetting['version'] = packageVersion;

let versionUpdated = JSON.stringify(appSetting);

const fs = require('fs');
fs.writeFile(
  './src/appsetting.json',
  versionUpdated,
  {
    encoding: 'utf8',
    flag: 'w',
    mode: 0o666,
  },
  err => {
    if (err) {
      console.log(err);
    }
  },
);
