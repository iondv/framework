/**
 * Created by krasilneg on 25.04.19.
 */
const fs = require('fs');
const path = require('path');
const {
  readConfigFiles, merge
} = require('core/util/read');
const {promisify} = require('util');
const configReader = require('lib/config-reader');
const read = promisify(configReader);
const readdirPromise = promisify(fs.readdir);

const isConfig = fn => ['.json', '.yml'].includes(path.extname(fn));
const joinPath = (...pths) => fn => path.join(...pths, fn);
const isBasename = nm => fn => path.basename(fn, path.extname(fn)) === nm;
const readdir = pth => readdirPromise(pth)
  .then(files => files.filter(isConfig).map(joinPath(pth)))
  .catch(() => []);
const mergeConfigs = (data) => {
  let result = {};
  Object.keys(data).forEach((key) => {
    result = merge(result, data[key]);
  });
  return result;
};

module.exports = (appPath) => {
  let config = {};
  const moduleFiles = [];
  const configDirs = [
    readdir(appPath),
    readdir(path.join(appPath, 'deploy')),
    readdir(path.join(appPath, 'deploy', 'modules'))
  ];

  return Promise.all(configDirs)
    .then((dirs) => {
      moduleFiles.push(...dirs[2]);
      const [rootFiles, deployFiles] = dirs;
      return readConfigFiles([...rootFiles.filter(isBasename('deploy')), ...deployFiles]);
    })
    .then((results) => {
      config = results.deploy || {};
      delete results.deploy;
      config = merge(config, mergeConfigs(results));
      config.modules = config.modules || {};
      const promises = Object.keys(config.modules)
        .map(mn => readdir(path.join(appPath, 'deploy', 'modules', mn))
          .then(mfiles => readConfigFiles([...moduleFiles.filter(isBasename(mn)), ...mfiles]))
          .then((mresults) => {
            const mconfig = mergeConfigs(mresults);
            config.modules[mn] = config.modules[mn] || {};
            config.modules[mn] = merge(config.modules[mn], mconfig);
          })
        );
      return Promise.all(promises);
    })
    .then(() => read(config, appPath));
};
