'use strict';

function getCachedDescendants(cm) {
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
      classes = classes.concat(getCachedDescendants(dcm));
    });
    return classes;
  } else {
    return [cm.getCanonicalName()];
  }
}


module.exports = function (classes, options, metaRepo, dataRepo, log) {

  let total = 0;

  function recacheChunk(dataRepo, cn, recacheOpts, log, opts) {
    let {step, offset, sort} = opts;
    return dataRepo
      .getList(cn, {count: step, offset: offset || 0, sort: sort})
      .then((list) => {
        let promise = Promise.resolve();
        list.forEach((obj) => {
          promise = promise.then(() => dataRepo.recache(obj, recacheOpts));
        });
        total = total + list.length;
        if (total % 100 == 0 || list.length < step) {
          promise = promise.then(() => log && log(`Обработано ${total} обьектов`));
        }
        if (list.length === step) {
          promise = promise
            .then(() => recacheChunk(dataRepo, cn, recacheOpts, log, {
              step,
              offset: (offset || 0) + list.length,
              sort
            }));
        }
        return promise;
      });
  }

  try {
    log && log('Запущен пересчет кешей');
    let classPromise = Promise.resolve();

    let classList = Array.isArray(classes) ? classes : Object.keys(classes);
    let classOpts = Array.isArray(classes) ? {} : classes;

    classList.forEach((cn) => {
      let cm = metaRepo.getMeta(cn);
      let cachedClasses = getCachedDescendants(cm);

      let skipDep = options.skipDependencies;
      let step = options.step || 100;
      let sort;
      if (classOpts.hasOwnProperty(cn)) {
        if (typeof classOpts[cn].skipDependencies !== 'undefined') {
          skipDep = classOpts[cn].skipDependencies;
        }
        if (typeof classOpts[cn].step !== 'undefined') {
          step = classOpts[cn].step;
        }
        if (typeof classOpts[cn].sort !== 'undefined') {
          sort = classOpts[cn].sort;
        }
      }

      cachedClasses.forEach((cn) => {
        classPromise = classPromise.then(() => {
          log && log(`Пересчет для объектов класса ${cn}`);
          return recacheChunk(dataRepo, cn, {skipCacheDependencies: skipDep}, log, {step, sort});
        });
      });
    });
    return classPromise.then(() => log && log('Пересчет завершен!'));
  } catch (e) {
    return Promise.reject(e);
  }
};