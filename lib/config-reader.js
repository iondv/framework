/**
 * The config.js file contains information about database connection settings,
 * as well as session settings.
 */

/* eslint no-sync:off, valid-jsdoc:off, require-jsdoc:off, complexity:off, max-statements:off, no-magic-numbers: off */
/* eslint max-depth:off, no-process-env:off, max-nested-callbacks:off, global-require:off */

const fs = require('fs');
const path = require('path');
const pr = require('ini');
const merge = require('merge');
const clone = require('clone');
const {toAbsolute} = require('../core/system');

/**
 * @param {{}} config
 * @param {PropertiesReader} properties
 */
function parametrize(config, properties) {
  if (config) {
    let result = null;
    if (typeof config === 'string') {
      const tmp = config.replace(/\[\[([\w.]+)\]\]/g,
        (str, setting) => {
          result = properties[setting];

          if (typeof result === 'undefined') {
            const envName = setting.replace(/\./g, '_').toUpperCase();
            if (typeof properties[envName] !== 'undefined')
              result = properties[envName];
          }

          if (typeof result === 'undefined' && setting.indexOf('.') > 0) {
            const section = setting.substr(0, setting.indexOf('.'));
            const prop = setting.substr(setting.indexOf('.') + 1);
            if (properties[section] && (typeof properties[section][prop] !== 'undefined'))
              result = properties[section][prop];
          }

          if (typeof result === 'undefined') {
            result = null;
            return '';
          }

          if (typeof result === 'object' || Array.isArray(result))
            return '';

          if (result === 'true')
            result = true;
          else if (result === 'false')
            result = false;
          else if (typeof result !== 'boolean' && !isNaN(result) && result !== '')
            result = Number(result);

          return result;
        }
      );

      if (Array.isArray(result))
        return result;

      if (result === null && tmp === '')
        return result;

      if (tmp !== String(result))
        return tmp;

      return result;
    } else if (Array.isArray(config)) {
      result = [];
      config.forEach((conf) => {
        if (conf) {
          const res = parametrize(conf, properties);
          if (res !== null)
            result.push(res);
        } else {
          result.push(conf);
        }
      });
      return result;
    } else if ((typeof config === 'object') && config) {
      result = {};
      for (const nm in config) {
        if (typeof config[nm] !== 'undefined') {
          const res = parametrize(config[nm], properties);
          if (res !== null)
            result[nm] = res;
        }
      }
      return result;
    }
  }
  return config;
}

function processPaths(config) {
  if (typeof config === 'string') {
    if (config.substr(0, 7) === 'file://')
      return toAbsolute(config.substr(7));
  } else if (Array.isArray(config)) {
    for (let i = 0; i < config.length; i++)
      config[i] = processPaths(config[i]);
  } else if (config && typeof config === 'object') {
    for (const nm in config) {
      if (typeof config[nm] !== 'undefined')
        config[nm] = processPaths(config[nm]);
    }
  }
  return config;
}

/**
 * @param {Object} config
 * @param {Array|String} iniDirs
 * @param {Function} [cb]
 */
function parse(config, iniDirs, cb) {
  if (config.parametrised) {
    let props = clone(process.env);
    if (typeof iniDirs === 'string')
      iniDirs = [iniDirs];

    if (typeof cb === 'function') {
      let chain = Promise.resolve();
      iniDirs.forEach((iniDir) => {
        chain = chain
          .then(() => new Promise((resolve, reject) => {
            fs.readdir(iniDir, (err, files) => {
              if (err)
                return reject(err);
              let fchain = Promise.resolve();
              files.forEach((file) => {
                if (file.match(/\w+\.ini$/)) {
                  fchain = fchain
                    .then(() => new Promise((res, rej) => {
                      fs.readFile(path.join(iniDir, file), 'utf-8',
                        (err2, data) => {
                          if (err)
                            return rej(err2);
                          props = merge(props, pr.parse(data));
                          return res();
                        });
                    }));
                } else if (file.match(/\w+\.override\.json$/)) {
                  const override = require(path.join(iniDir, file));
                  merge.recursive(config, override);
                }
              });
              return fchain.then(resolve).catch(reject);
            });
          }));
      });
      return chain.then(() => processPaths(parametrize(config, props)))
        .then(conf => cb(null, conf))
        .catch(cb);
    } else {
      iniDirs.forEach((iniDir) => {
        const files = fs.readdirSync(iniDir);
        files.forEach((file) => {
          if (file.match(/\w+\.ini$/)) {
            props = merge(props, pr.parse(fs.readFileSync(path.join(iniDir, file), 'utf-8')));
          } else if (file.match(/\w+\.override\.json$/)) {
            const override = require(path.join(iniDir, file));
            merge.recursive(config, override);
          }
        });
      });
      return processPaths(parametrize(config, props));
    }
  }
  return (typeof cb === 'function') ? cb(null, config) : config;
}

module.exports = parse;
