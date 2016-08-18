/**
 * Created by kras on 18.08.16.
 */

module.exports = function (config) {
  return new Promise(function (resolve, reject) {
    var workers = [];
    for (var module in config) {
      if (config.hasOwnProperty(module)) {
        var setup = require('modules/' + module + '/setup');
        workers.push(setup(config[module]));
      }
    }
    Promise.all(workers).then(resolve).catch(reject);
  });
};
