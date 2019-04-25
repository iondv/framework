/**
 * Created by krasilneg on 25.04.19.
 */
const path = require('path');
const readConfig = require('core/util/read').readConfigAsync;
const read = require('lib/config-reader');

module.exports = (appPath) => {
  try {
    return readConfig(path.join(appPath, 'deploy.json'))
      .then(config => new Promise((resolve, reject) => {
        read(config, appPath, (err, config) => {
          if (err)
            return reject(err);
          resolve(config);
        });
      }));
  } catch (err) {
    return Promise.reject(err);
  }
};
