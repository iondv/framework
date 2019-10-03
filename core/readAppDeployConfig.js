/**
 * Created by krasilneg on 25.04.19.
 */
const fs = require('fs');
const path = require('path');
const {
  readConfigFiles, merge
} = require('core/util/read');
const read = require('lib/config-reader');
const {promisify} = require('util');
const readdir = promisify(fs.readdir);

const isConfig = f => ['.json', '.yml'].includes(path.extname(f));
const joinPath = (...pths) => f => path.join(...pths, f);

module.exports = (appPath) => {
  let config = {};
  const moduleNames = [];
  const moduleFiles = [];

  const configDirs = [
    readdir(appPath).catch(() => []),
    readdir(path.join(appPath, 'deploy')).catch(() => []),
    readdir(path.join(appPath, 'deploy', 'modules')).catch(() => [])
  ];

  return Promise.all(configDirs)
    .then((dirs) => {
      moduleFiles.push(...dirs[2]);
      const [rootFiles, deployFiles] = dirs;
      const deployConfigs = [];
      deployConfigs.push(...rootFiles.filter(f => ['deploy.json', 'deploy.yml'].includes(f)).map(joinPath(appPath)));
      deployConfigs.push(...deployFiles.filter(isConfig).map(joinPath(appPath, 'deploy')));
      return readConfigFiles(deployConfigs);
    })
    .then((results) => {
      config = merge(config, results.deploy);
      delete results.deploy;
      Object.keys(results).forEach((key) => {
        config = merge(config, results[key]);
      });
      config.modules = config.modules || {};
      moduleNames.push(...Object.keys(config.modules));
      const promises = moduleNames.map((mn) => {
        const moduleConfigs = moduleFiles
          .filter(isConfig)
          .filter(f => path.basename(f, path.extname(f)) === mn)
          .map(joinPath(appPath, 'deploy', 'modules'));
        return readdir(path.join(appPath, 'deploy', 'modules', mn))
          .catch(() => [])
          .then((mfiles) => {
            moduleConfigs.push(...mfiles.filter(isConfig).map(joinPath(appPath, 'deploy', 'modules', mn)));
            return readConfigFiles(moduleConfigs);
          })
          .then((mresults) => {
            let mconfig = {};
            Object.keys(mresults).forEach((mkey) => {
              mconfig = merge(mconfig, mresults[mkey]);
            });
            config.modules[mn] = config.modules[mn] || {};
            config.modules[mn] = merge(config.modules[mn], mconfig);
          });
      });
      return Promise.all(promises).then(() => config);
    })
    .then(config => new Promise((resolve, reject) => {
      read(config, appPath, (err, conf) => {
        if (err)
          return reject(err);
        return resolve(conf);
      });
    }));
};
