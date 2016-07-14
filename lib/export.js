/**
 * Created by kras on 12.07.16.
 */
var fs = require('fs');
var path = require('path');

/**
 * @param {String} dst
 * @param {MetaRepository} metaRepo
 * @param {DataRepository} dataRepo
 * @param {{}} options
 * @param {String} options.namespace
 * @param {String} options.version
 * @returns {Promise}
 */
module.exports = function (dst, metaRepo, dataRepo, options) {
  var i, vm, paths;

  paths = [];

  var sections = metaRepo.getNavigationSections(options.namespace);
  for (i = 0; i < sections.length; i++) {

  }

  var metas = metaRepo.listMeta(null, options.version, false, options.namespace);
  for (i = 0; i < metas.length; i++) {
    vm = metaRepo.getItemViewModel(metas[i].name, null, metas[i].version);
    if (vm) {
      fs.writeFileSync(path.join(dst, 'views', metas[i].name, 'item.json'), JSON.stringify(vm), {encoding: 'utf-8'});
    }

    vm = metaRepo.getCreationViewModel(metas[i].name, null, metas[i].version);
    if (vm) {
      fs.writeFileSync(path.join(dst, 'views', metas[i].name, 'create.json'), JSON.stringify(vm), {encoding: 'utf-8'});
    }

    vm = metaRepo.getListViewModel(metas[i].name, null, metas[i].version);
    if (vm) {
      fs.writeFileSync(path.join(dst, 'views', metas[i].name, 'list.json'), JSON.stringify(vm), {encoding: 'utf-8'});
    }
  }
};
