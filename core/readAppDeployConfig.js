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

function readModulesConfigs(modulesPath) {
  let result = {};
  const configs = [];
  return readdirPromise(modulesPath)
    .then((files) => {
      let subdirPromise = Promise.resolve();
      files.forEach((fn) => {
        if (isConfig(fn)) {
          configs.push(fn);
        } else {
          subdirPromise = subdirPromise
            .then(() => readdir(path.join(modulesPath, fn)))
            .then(files => files.filter(isConfig))
            .then((configFiles) => {
              if (!configFiles.length) {
                return;
              }
              return readConfigFiles(configFiles)
                .then((configFilesData) => {
                  result[fn] = mergeConfigs(configFilesData);
                });
            });
        }
      });
      return subdirPromise;
    })
    .then(() => readConfigFiles(configs.map(joinPath(modulesPath))))
    .then((configsData) => {
      result = merge(configsData, result);
      return result;
    })
    .catch(() => {
      return {};
    });
}

module.exports = (appPath) => {
  let config = {};
  const configDirs = [
    readdir(appPath),
    readdir(path.join(appPath, 'deploy'))
  ];

  return Promise.all(configDirs)
    .then((dirs) => {
      const [rootFiles, deployFiles] = dirs;
      return readConfigFiles([...rootFiles.filter(isBasename('deploy')), ...deployFiles]);
    })
    .then((results) => {
      config = results.deploy || {};
      delete results.deploy;
      config = merge(config, mergeConfigs(results));
      config.modules = config.modules || {};

      return readModulesConfigs(path.join(appPath, 'deploy', 'modules'));
    })
    .then((modulesConfig) => {
      config.modules = merge(config.modules, modulesConfig);
      return read(config, appPath);
    });
};
