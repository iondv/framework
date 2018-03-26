/**
 * Created by kras on 12.07.16.
 */
const fs = require('fs');
const path = require('path');
const clone = require('clone');
const mkdirp = require('mkdirp');
const PropertyTypes = require('core/PropertyTypes');
const base64 = require('base64-stream');
const yaml = require('js-yaml');
const StoredFile = require('core/interfaces/ResourceStorage').StoredFile;

// jshint maxstatements: 30, maxcomplexity: 20

function readFile(f) {
  if (!(f instanceof StoredFile)) {
    return Promise.resolve(f);
  }
  return f.getContents()
    .then(
      function (f) {
        return new Promise(function (resolve, reject) {
          var result = '';
          f.stream.pipe(base64.encode())
            .on(
              'data',
              function (data) {
                result += data;
              }
            )
            .on(
              'end',
              function () {
                resolve({
                  _type: '$$FILE$$',
                  name: f.name,
                  options: f.options || {},
                  buffer: result
                });
              }
            )
            .on('error', reject);
        });
      }
    );
}

function formPath(dest, name, counter, cb) {
  var ext = path.extname(name);
  var nm = path.basename(name, ext) + (counter || '');
  var pth = path.join(dest, nm + ext);
  fs.access(pth, fs.constants.F_OK, function (err) {
    if (err) {
      return cb(null, pth);
    }
    formPath(dest, name, (counter || 0) + 1, cb);
  });
}

function exportFile(f, dst, fileDir) {
  if (!(f instanceof StoredFile)) {
    return Promise.resolve(f);
  }
  return f.getContents()
    .then(
      function (f) {
        return new Promise(function (resolve, reject) {
          formPath(path.join(dst, fileDir), f.name, 0, function (err, pth) {
            var w = fs.createWriteStream(pth);
            f.stream.pipe(w);
            w.on('close', function () {
              resolve({
                _type: '$$FILE$$',
                name: f.name,
                options: f.options || {},
                path: path.relative(dst, pth)
              });
            }).on('error', reject);
          });
        });
      }
    );
}

/**
 * @param {String} dst
 * @param {Item} item
 * @param {String} [fileDir]
 * @returns {Function}
 */
function writeObject(dst, item, fileDir) {
  return function () {
    var obj = clone(item.base);
    delete obj._id;

    var fileLoaders = [];
    var fileProps = [];
    var prop;
    var props = item.getProperties();
    for (var pn in props) {
      if (props.hasOwnProperty(pn)) {
        prop = props[pn];
        if (
          prop.getType() === PropertyTypes.FILE ||
          prop.getType() === PropertyTypes.IMAGE
        ) {
          let f = prop.getValue();
          if (f) {
            if (fileDir) {
              fileLoaders.push(exportFile(f, dst, fileDir));
            } else {
              fileLoaders.push(readFile(f));
            }
            fileProps.push(prop.getName());
          }
        }
        if (prop.getType() === PropertyTypes.FILE_LIST) {
          let files = prop.getValue();
          if (files) {
            let fll = [];
            for (let i = 0; i < files.length; i++) {
              if (fileDir) {
                fll.push(exportData(files[i], dst, fileDir));
              } else {
                fll.push(readFile(files[i]));
              }
            }
            if (fll.length) {
              fileProps.push(prop.getName());
              fileLoaders.push(Promise.all(fll));
            }
          }
        }
      }
    }

    return Promise.all(fileLoaders).then(function (files) {
      for (var i = 0; i < files.length; i++) {
        let pn = fileProps[i];
        if (Array.isArray(files[i])) {
          obj[pn] = [];
          for (let j = 0; j < files[i].length; j++) {
            obj[pn].push(files[i][j]);
          }
        } else {
          obj[pn] = files[i];
        }
      }

      return new Promise(function (resolve, reject) {
        var fn = path.join(dst, item.getClassName() + '@' + encodeURIComponent(item.getItemId()) + '.json');
        fs.writeFile(fn, JSON.stringify(obj, null, 2), {encoding: 'utf-8'}, function (err) {
          if (err) {
            return reject(err);
          }
          console.log('Записан файл данных ' + fn);
          resolve();
        });
      });
    });
  };
}

/**
 * @param {String} dst
 * @param {DataRepository} dataRepo
 * @param {ClassMeta} cm
 * @param {String} [fileDir]
 * @param {Number} [offset]
 * @returns {Promise}
 */
function exportData(dst, dataRepo, cm, fileDir, offset) {
  return function () {
    var ofst = offset ? offset : 0;
    mkdirp.sync(dst);
    if (fileDir) {
      mkdirp.sync(path.join(dst, fileDir));
    }
    return dataRepo.getList(
        cm.getCanonicalName(),
        {
          offset: ofst,
          count: 100,
          nestingDepth: 0
        }
    ).then(
      function (list) {
        var w = null;
        for (var i = 0; i < list.length; i++) {
          if (w) {
            w = w.then(writeObject(dst, list[i], fileDir));
          } else {
            w = writeObject(dst, list[i], fileDir)();
          }
        }
        if (!w) {
          w = Promise.resolve();
        }
        if (list.length === 100) {
          return w.then(exportData(dst, dataRepo, cm, fileDir, ofst + 100));
        } else {
          return w;
        }
      }
    );
  };
}

function exportNode(dst, node, paths) {
  paths.push(node.code);
  var n = clone(node);
  delete n.children;
  delete n._id;
  var fn = path.join(dst, node.code + '.json');
  fs.writeFileSync(fn, JSON.stringify(n, null, 2), {encoding: 'utf-8'});
  console.log('Записан файл узла навигации ' + fn);
  for (var i = 0; i < node.children.length; i++) {
    exportNode(dst, node.children[i], paths);
  }
}

function exportSection(dst, section, paths) {
  var sect = clone(section);
  delete sect.nodes;
  delete sect._id;
  mkdirp.sync(dst);
  var fn = path.join(dst, section.namespace + '@' + section.name + '.section.json');
  fs.writeFileSync(fn, JSON.stringify(sect, null, 2), {encoding: 'utf-8'});
  console.log('Записан файл секции навигации ' + fn);
  var dirName = path.join(dst, section.namespace + '@' + section.name);
  mkdirp.sync(dirName);
  for (var nm in section.nodes) {
    if (section.nodes.hasOwnProperty(nm)) {
      exportNode(dirName, section.nodes[nm], paths);
    }
  }
}

function exportViewModel(className, dst, vm) {
  var v = clone(vm);
  delete v.type;
  delete v.path;
  delete v.className;
  delete v.namespace;
  delete v._id;
  mkdirp.sync(path.join(
    dst,
    vm.path ? vm.path.replace('.', path.delimiter) : '',
    className));

  var fn = path.join(
    dst,
    vm.path ? vm.path.replace('.', path.delimiter) : '',
    className,
    vm.type + (vm.version ? '_' + vm.version : '') + '.json'
  );
  fs.writeFileSync(
    fn,
    JSON.stringify(v, null, 2),
    {encoding: 'utf-8'}
  );
  console.log('Записан файл модели представления ' + fn);
}

function exportViewModels(cm, dst, paths, fetcher) {
  var vm = fetcher(cm.getCanonicalName(), null, cm.version);
  mkdirp.sync(dst);
  if (vm) {
    exportViewModel(cm.getCanonicalName(), dst, vm);
  }

  for (var i = 0; i < paths.length; i++) {
    vm = fetcher(cm.getCanonicalName(), paths[i], cm.version);
    if (vm && vm.path) {
      exportViewModel(cm.getCanonicalName(), dst, vm);
    }
  }
}

/**
 * @param {String} dst
 * @param {ClassMeta} cm
 * @param {String[]} paths
 * @param {MetaRepository} metaRepo
 * @param {Boolean} [noVersion]
 */
function exportClass(dst, cm, paths, metaRepo, noVersion) {
  var c = clone(cm.plain);
  delete c._id;
  mkdirp.sync(path.join(dst, 'meta'));
  var fn = path.join(dst, 'meta', cm.getCanonicalName() + (cm.getVersion() && !noVersion ? '_' + cm.getVersion() : '') + '.class.json');
  fs.writeFileSync(fn, JSON.stringify(c, null, 2), {encoding: 'utf-8'});
  console.log('Записан файл мета-класса ' + fn);

  var viewsDir = path.join(dst, 'views');
  exportViewModels(cm, viewsDir, paths, function (className, path, version) {
    return metaRepo.getItemViewModel(className, path, version);
  });
  exportViewModels(cm, viewsDir, paths, function (className, path, version) {
    return metaRepo.getCreationViewModel(className, path, version);
  });
  exportViewModels(cm, viewsDir, paths, function (className, path, version) {
    return metaRepo.getListViewModel(className, path, version);
  });
}

function convert(r, type) {
  if (type === 'yml') {
    return yaml.safeDump(r);
  }
  return JSON.stringify(r, null, 2);
}

function exportAclData(data) {
  let result = [];
  if (Array.isArray(data) && data.length) {
    data.forEach(dt => {
      let d = clone(dt);
      delete d._id;
      result.push(d);
    });
  }
  return result;
}

function exportUsers(users) {
  let result = [];
  if (Array.isArray(users) && users.length) {
    users.forEach(u => {
      result.push({
        id: u.id,
        name: u.name,
        pwd: u.pwd,
        type: u.type
      });
    });
  }
  return result;
}

function exportAcl(dst, auth, am, namespace, type) {
  type = type === 'yml' ? 'yml' : 'json';
  let data = {};
  mkdirp.sync(path.join(dst, 'acl'));
  let fn = path.join(dst, 'acl', `${namespace}.${type}`);
  am.getResources()
    .then(resources => {
      data.resources = exportAclData(resources);
      return am.getRoles();
    })
    .then(roles => {
      data.roles = exportRoles(roles);
      return auth.getUsers();
    })
    .then(users => {
      data.users = exportUsers(roles);
      fs.writeFileSync(fn, convert(data, type), {encoding: 'utf-8'});
      console.log('Записан файл с данными acl ' + fn);
    });
}

/**
 * @param {String} dst
 * @param {MetaRepository} metaRepo
 * @param {DataRepository} dataRepo
 * @param {Object} auth
 * @param {RoleAccessManager} accessManager
 * @param {{}} options
 * @param {String} options.namespace
 * @param {String} options.version
 * @param {Boolean} [options.skipData]
 * @param {String|Boolean} [options.exportAcl]
 * @param {Boolean} [options.lastVersion]
 * @returns {Promise}
 */
module.exports = function (dst, metaRepo, dataRepo, auth, accessManager, options) {
  return new Promise(function (resolve, reject) {
    metaRepo.init()
      .then(function () {
        var i, dataPromises, paths, dpc, nm;

        paths = [];
        dpc = [];
        try {
          // Экспорт навигации
          var sections = metaRepo.getNavigationSections(options.namespace);
          for (nm in sections) {
            if (sections.hasOwnProperty(nm)) {
              exportSection(path.join(dst, 'navigation'), sections[nm], paths);
            }
          }

          // Экспорт меты и моделей представления и формирование промисов экспорта данных
          var metas = metaRepo.listMeta(null, options.version, false, options.namespace);
          for (i = 0; i < metas.length; i++) {
            exportClass(dst, metas[i], paths, metaRepo, options.lastVersion);
            if (!options.skipData) {
              dpc.push(exportData(path.join(dst, 'data'), dataRepo, metas[i], options.fileDir));
            }
          }

        } catch (error) {
          return reject(error);
        }

        dataPromises = [];
        for (i = 0; i < dpc.length; i++) {
          dataPromises.push(dpc[i]());
        }

        return Promise.all(dataPromises);
      })
      .then(() => {
        // Экспорт Acl
        if (options.exportAcl) {
          return exportAcl(dst, auth, accessManager, options.namespace, options.exportAcl);
        }
      })
      .then(resolve).catch(reject);
  });
};
