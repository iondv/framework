'use strict';

module.export = function (classes, options, metaRepo, dataRepo, logCallback) {
    try {
      logCallback('Запущен пересчет кешей');
      let classPromise = Promise.resolve();
      const recacheOpts = {
        skipCacheDependencies: options.skipDependencies
      };
      if (Array.isArray(classes)) {
        classes.forEach((cn) => {
          let cm = metaRepo.getMeta(cn);
          let skip = false;
          classes.forEach((name) => {
            let cm2 = metaRepo.getMeta(name);
            if (cm2.getCanonicalName() !== cm.getCanonicalName() && cm.checkAncestor(cm2.getCanonicalName())) {
              skip = true;
            }
          });
          if (!skip) {
            classPromise = classPromise.then(() => {
                logCallback(`Пересчет для объектов класса ${cn}`);
                return dataRepo.getList(cn)
                .then((list) => {
                    let promise = Promise.resolve();
                    list.forEach((obj) => {
                    promise = promise.then(() => {
                        logCallback(`${obj.getItemId()}`);
                        return dataRepo.recache(obj, recacheOpts);
                    });
                    });
                    return promise;
                });
            });
          }
        });
      }
      return classPromise.then(() => logCallback('Пересчет завершен!'));
    } catch (e) {
      return Promise.reject(e);
    }
  };