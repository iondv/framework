const normalize = require('core/util/normalize');

function replStr (str, item) {
  return (str && str.replace(/\$\{([\w_.]+)\}/g, (match, p1) => item.get(p1))) || null;
}

/**
 * @param {{}} options
 * @param {{}} options.classes
 * @param {Notifier} options.notifier
 * @param {DataRepository} options.dataRepo
 */
module.exports = (options) => {
  let p = Promise.resolve();
  Object.keys(options.classes).forEach((cl) => {
    const opts = options.classes[cl];
    //TODO opts.loadOptions.forceEnrichment <- recievers
    p = p.then(() => options.dataRepo.getList(cl, opts.loadOptions)).then(list =>
      list.forEach((item) => {
        let recs = [];
        //TODO в recievers аттрибуте может быть коллекция
        opts.recievers.forEach(r => recs.push(item.get(r)));
        options.notifier.notify({
          message: opts.message ? replStr(opts.message, item) : normalize(item),
          type: opts.type,
          recievers: recs,
          subject: replStr(opts.subject, item),
          dispatch: opts.dispatch,
          options: {individual: opts.individual}
        });
      })
    )
  });
  return p;
};
