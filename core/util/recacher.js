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
module.export = function(options) {
  let classes = [];
  options.classes.forEach((cn) => {
    let cm = options.metaRepo.getMeta(cn);
    classes.concat(getCachedDescendants(cm));
  });

  recache(classes, {skipDependencies: options.skipDependencies}, options.metaRepo, options.dataRepo, (msg) => {options.log.log(msg);})
    .catch((e) => {
        options.log.error(e);
    });
};

function getCachedDescendants (cm) {
  let isCached = cm.isSemanticCached();
  if (!isCached) {
    for (let pm of Object.values(cm.getPropertyMetas())) {
      if (pm.cached) {
        isCached = true;
        break;
      }
    }
  }
  if (!isCached) {
    let classes = [];
    cm.getDescendants().forEach((dcm) => {
      classes.concat(getCachedDescendants(dcm));
    });
    return classes;
  } else {
    return [cm.getCanonicalName()];
  }
}