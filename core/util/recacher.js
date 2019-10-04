'use strict';
const recache = require('lib/util/recache');

/**
 * @param {{}} options
 * @param {String[]} options.classes
 * @param {MetaRepository} options.metaRepo
 * @param {DataRepository} options.dataRepo
 * @param {Boolean} options.skipDependencies
 * @param {Logger} options.log
 */
module.exports = function(options) {
  return recache(
    options.classes,
    {skipDependencies: options.skipDependencies, step: options.step},
    options.metaRepo,
    options.dataRepo,
    msg => options.log.info(msg)
  ).catch((e) => {
    options.log.error(e);
  });
};