'use strict';
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

/**
 * @param {String} dst
 * @param {{}} options
 * @param {MetaRepository} options.metaRepo
 * @param {DataRepository} options.dataRepo
 * @param {WorkflowProvider} options.workflows
 * @param {SequenceProvider} options.sequences
 * @param {Logger} options.log
 * @param {AccountManager} options.accounts
 * @param {RoleAccessManager} options.accessManager
 * @param {Boolean} [options.skipData]
 * @param {Boolean} [options.skipFiles]
 * @param {String|Boolean} [options.exportAcl]
 * @param {Boolean} [options.lastVersion]
 * @param {Boolean} [options.fileDir]
 * @param {String} [options.namespace]
 * @param {String} [options.version]
 * @returns {Promise}
 */
module.exports = function (dst, options) {
  function log(msg, type) {
    if (options.log) {
      switch (type) {
        case 'error':
          options.log.error(msg);
          break;
        case 'warn':
          options.log.warn(msg);
          break;
        default:
          options.log.log(msg);
      }
    }
  }

  function readFile(f) {
    if (!(f instanceof StoredFile)) {
      return Promise.resolve(f);
    }
    return f.getContents()
      .then(
        f => new Promise((resolve, reject) => {
            let result = '';
            f.stream.on('error', (err) => {
              reject(err);
            });
            f.stream.pipe(base64.encode())
              .on('data', (data) => {
                result += data;
              })
              .on('end', () => {
                resolve({
                  _type: '$$FILE$$',
                  name: f.name,
                  options: f.options || {},
                  buffer: result
                });
              })
              .on('error', (err) => {
                reject(err);
              });
        })
      );
  }

  function formPath(dest, name, counter, cb) {
    let ext = path.extname(name);
    let nm = path.basename(name, ext) + (counter || '');
    let pth = path.join(dest, nm + ext);
    fs.access(pth, fs.constants.F_OK, (err) => {
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
        f => new Promise((resolve, reject) => {
            formPath(path.join(dst, fileDir), f.name, 0, (err, pth) => {
              if (err) {
                reject(err);
              }
              try {
                f.stream
                  .on('error', (err) => {
                    reject(err);
                  })
                  .pipe(fs.createWriteStream(pth))
                  .on('finish', () => {
                    resolve(
                      {
                        _type: '$$FILE$$',
                        name: f.name,
                        options: f.options || {},
                        path: path.relative(dst, pth)
                      }
                    );
                  })
                  .on('error', (err) => {
                    reject(err);
                  });
              } catch (err) {
                reject(err);
              }
            });
        })
      );
  }

  /**
   * @param {String} dst
   * @param {Item} item
   * @param {String} [fileDir]
   * @returns {Function}
   */
  function writeObject(dst, item, fileDir, skipFiles) {
    return (wfstatus) => {
      let obj = clone(item.base);
      delete obj._id;
      obj.___workflowStatus = wfstatus.stages;

      let fileLoaders = Promise.resolve();
      let props = item.getProperties();
      Object.keys(props).forEach((pn) => {
        let prop = props[pn];
        if (
          skipFiles &&
          (prop.getType() === PropertyTypes.FILE ||
          prop.getType() === PropertyTypes.IMAGE ||
          prop.getType() === PropertyTypes.FILE_LIST)
        ) {
          delete obj[pn];
        } else if (
          prop.getType() === PropertyTypes.FILE ||
          prop.getType() === PropertyTypes.IMAGE
        ) {
          let f = prop.getValue();
          if (f) {
            if (fileDir) {
              fileLoaders = fileLoaders.then(() => exportFile(f, dst, fileDir));
            } else {
              fileLoaders = fileLoaders.then(() => readFile(f));
            }
            fileLoaders = fileLoaders
              .then((f) => {
                obj[pn] = f;
              })
              .catch((err) => {
                log(err.message, 'warn');
              });
          }
        } else if (prop.getType() === PropertyTypes.FILE_LIST) {
          let files = prop.getValue();
          if (Array.isArray(files)) {
            obj[pn] = [];
            files.forEach((f) => {
              if (fileDir) {
                fileLoaders = fileLoaders.then(() => exportFile(f, dst, fileDir));
              } else {
                fileLoaders = fileLoaders.then(() => readFile(f));
              }
              fileLoaders = fileLoaders
                .then((f) => {
                  obj[pn].push(f);
                })
                .catch((err) => {
                  log(err.message, 'warn');
                });
            });
          }
        }
      });

      return fileLoaders
        .then(
          () => new Promise(
            (resolve, reject) => {
              let fn = path.join(dst, item.getClassName() + '@' + encodeURIComponent(item.getItemId()) + '.json');
              fs.writeFile(fn, JSON.stringify(obj, null, 2), {encoding: 'utf-8'}, err => err ? reject(err) : resolve());
            }
          )
        );
    };
  }

  /**
   * @param {String} dst
   * @param {ClassMeta} cm
   * @param {String} [fileDir]
   * @param {Number} [offset]
   * @returns {Promise}
   */
  function exportData(dst, cm, fileDir, skipFiles, offset) {
    let ofst = offset ? offset : 0;
    return options.dataRepo.getList(
      cm.getCanonicalName(),
      {
        offset: ofst,
        count: 100,
        nestingDepth: 0,
        needed: {}
      }
    ).then(
      (list) => {
        let w = Promise.resolve();
        list.forEach((item) => {
          w = w.then(() => options.workflows.getStatus(item, {})).then(writeObject(dst, item, fileDir, skipFiles));
        });
        if (list.length === 100) {
          return w.then(() => exportData(dst, cm, fileDir, skipFiles, ofst + 100));
        } else {
          return w;
        }
      }
    );
  }

  function exportNode(dst, node, paths) {
    paths.push(node.code);
    let n = clone(node);
    delete n.children;
    delete n._id;
    let fn = path.join(dst, node.code + '.json');
    let p = new Promise((resolve, reject) => {
      fs.writeFile(fn, JSON.stringify(n, null, 2), {encoding: 'utf-8'}, err => err ? reject(err) : resolve());
    });
    if (Array.isArray(node.children)) {
      node.children.forEach((sn) => {
        p = p.then(() => exportNode(dst, sn, paths));
      });
    }
    return p;
  }

  function exportSection(dst, section, paths) {
    let sect = clone(section);
    delete sect.nodes;
    delete sect._id;
    let p = new Promise((resolve, reject) => {
      mkdirp(dst, (err) => {
        if (err) {
          return reject(err);
        }
        let fn = path.join(dst, section.namespace + '@' + section.name + '.section.json');
        fs.writeFile(fn, JSON.stringify(sect, null, 2), {encoding: 'utf-8'}, (err) => {
          if (err) {
            return reject(err);
          }
          let dirName = path.join(dst, section.namespace + '@' + section.name);
          mkdirp(dirName, err => err ? reject(err) : resolve(dirName));
        });
      });
    });

    return p.then((dirName) => {
      let p = Promise.resolve();
      Object.values(section.nodes).forEach((n) => {
        p = p.then(() => exportNode(dirName, n, paths));
      });
      return p;
    });
  }

  function exportViewModel(className, dst, vm) {
    let v = clone(vm);
    delete v.type;
    delete v.path;
    delete v.className;
    delete v.namespace;
    delete v._id;
    return new Promise((resolve, reject) => {
      mkdirp(path.join(dst, vm.path ? vm.path.replace('.', path.delimiter) : '', className), (err) => {
        if (err) {
          return reject(err);
        }
        let fn = path.join(
          dst,
          vm.path ? vm.path.replace('.', path.delimiter) : '',
          className,
          vm.type + (vm.version ? '_' + vm.version : '') + '.json'
        );
        fs.writeFile(
          fn,
          JSON.stringify(v, null, 2),
          {encoding: 'utf-8'},
          err => err ? reject(err) : resolve()
        );
      });
    });
  }

  function exportViewModels(cm, dst, paths, fetcher) {
    let p = Promise.resolve();
    let vm = fetcher(cm.getCanonicalName(), null, cm.version);
    if (vm) {
      p = p.then(() => exportViewModel(cm.getCanonicalName(), dst, vm));
    }

    paths.forEach((path) => {
      let vm = fetcher(cm.getCanonicalName(), path, cm.version);
      if (vm && vm.path) {
        p = p.then(() => exportViewModel(cm.getCanonicalName(), dst, vm));
      }
    });
    return p;
  }

  /**
   * @param {String} dst
   * @param {ClassMeta} cm
   * @param {String[]} paths
   * @param {MetaRepository} metaRepo
   * @param {Boolean} [noVersion]
   */
  function exportClass(dst, cm, paths, metaRepo, noVersion) {
    log('Экспорт класса ' + cm.getCanonicalName());
    let c = clone(cm.plain);
    delete c._id;
    let p = new Promise((resolve, reject) => {
      mkdirp(path.join(dst, 'meta'), (err) => {
        if (err) {
          return reject(err);
        }
        let fn = path.join(dst, 'meta', cm.getCanonicalName() + (cm.getVersion() && !noVersion ? '_' + cm.getVersion() : '') + '.class.json');
        fs.writeFile(fn, JSON.stringify(c, null, 2), {encoding: 'utf-8'}, err => err ? reject(err) : resolve());
      });
    });

    let viewsDir = path.join(dst, 'views');
    return p.then(
      () => exportViewModels(
        cm,
        viewsDir,
        paths,
        (className, path, version) => metaRepo.getItemViewModel(className, path, version)
      )
    ).then(
      () => exportViewModels(
        cm,
        viewsDir,
        paths,
        (className, path, version) => metaRepo.getCreationViewModel(className, path, version)
      )
    ).then(
      () => exportViewModels(
        cm,
        viewsDir,
        paths,
        (className, path, version) => metaRepo.getListViewModel(className, path, version)
      )
    );
  }

  function convert(r, type) {
    if (type === 'yml') {
      return yaml.safeDump(r, {skipInvalid: true});
    }
    return JSON.stringify(r, null, 2);
  }

  function exportResources(am, dst, type) {
    return am.getResources()
      .then(resources => resources.map((rs) => {
        return {id: rs.id, name: rs.name};
      }))
      .then(resources => new Promise(
        (resolve, reject) => {
          fs.writeFile(
            path.join(dst, `resources.${type}`),
            convert(resources, type),
            {encoding: 'utf-8'},
            err => err ? reject(err) : resolve()
          );
        }
      ));
  }

  function exportRoles(am, dst, type) {
    return am.getRoles()
      .then((roles) => {
        let p = Promise.resolve();
        if (Array.isArray(roles)) {
          roles.forEach((rl) => {
            p = p.then(() => am.getResources(rl.id))
              .then(ps => new Promise(
                (resolve, reject) => {
                  fs.writeFile(
                    path.join(dst, `r-${rl.id}.${type}`),
                    convert(
                      {
                        id: rl.id,
                        name: rl.name,
                        description: rl.description,
                        permissions: ps
                      },
                      type
                    ),
                    {encoding: 'utf-8'},
                    err => err ? reject(err) : resolve()
                  );
                }));
          });
        }
        return p;
      });
  }

  function exportUsers(accounts, am, dst, type) {
    return accounts.list().then((users) => {
      let p = Promise.resolve();
      if (Array.isArray(users)) {
        users.forEach((u) => {
          if (u.id()) {
            p = p.then(() => am.getRoles(u.id()))
              .then(rs => new Promise((resolve, reject) => {
                fs.writeFile(
                  path.join(dst, `u-${u.id()}.${type}`),
                  convert({
                    id: (u.id() || '').split('@')[0],
                    name: u.name(),
                    pwd: {hash: u.pwdHash()},
                    type: u.type(),
                    roles: rs
                  }, type),
                  {encoding: 'utf-8'},
                  err => err ? reject(err) : resolve()
                );
              }));
          }
        });
      }
      return p;
    });
  }

  function exportAcl(dst, accounts, am, namespace, type) {
    let type2 = (type === 'yml' || type === 'yaml') ? 'yml' : 'json';
    let destination = path.join(dst, 'acl', namespace || 'acl-' + Date.now());
    return new Promise((resolve, reject) => {
      mkdirp(destination, (err) => {
        if (err) {
          return reject(err);
        }
        return resolve();
      });
    }).then(() => exportResources(am, destination, type2))
      .then(() => exportRoles(am, destination, type2))
      .then(() => exportUsers(accounts, am, destination, type2));
  }

  return options.metaRepo.init()
    .then(() => {
      log('Экспорт модели данных.');
      let p = Promise.resolve();
      let paths = [];
      let sections = options.metaRepo.getNavigationSections(options.namespace);
      Object.values(sections).forEach((sect) => {
        p = p.then(() => exportSection(path.join(dst, 'navigation'), sect, paths));
      });
      p = p.then(() =>
        new Promise((resolve, reject) => {
          mkdirp(path.join(dst, 'workflows'), (err) => {
            if (err) {
              return reject(err);
            }
            if (options.skipData) {
              return resolve();
            }
            mkdirp(
              options.fileDir ? path.join(dst, 'data', options.fileDir) : path.join(dst, 'data'),
              err => err ? reject(err) : resolve()
            );
          });
        })
      );
      // Экспорт меты и моделей представления и формирование промисов экспорта данных
      let metas = options.metaRepo.listMeta(null, options.version, false, options.namespace);
      metas.forEach((cm) => {
        p = p.then(() => exportClass(dst, cm, paths, options.metaRepo, options.lastVersion));
        let workflows = options.metaRepo.getWorkflows(cm.getCanonicalName());
        workflows.forEach((wf) => {
          let fn = path.join(dst, 'workflows', wf.name + '@' + wf.namespace + '.wf.json');
          p = p.then(() =>
            new Promise((resolve, reject) => {
              fs.writeFile(
                fn,
                JSON.stringify(wf, null, 2),
                {encoding: 'utf-8'},
                err => err ? reject(err) : resolve()
              );
            })
          );
        });
        if (!options.skipData && !cm.getAncestor()) {
          p = p.then(() => {
            log('Экспорт данных класса ' + cm.getCanonicalName());
            return exportData(path.join(dst, 'data'), cm, options.fileDir, options.skipFiles);
          });
        }
      });

      if (!options.skipData) {
        p = p
          .then(() => options.sequences.snapshot())
          .then(snapshot =>
            new Promise((resolve, reject) => {
              log('Экспорт именованных последовательностей');
              let fn = path.join(dst, 'data', 'sequences.data');
              fs.writeFile(
                fn,
                JSON.stringify(snapshot, null, '  '),
                {encoding: 'utf-8'},
                err => err ? reject(err) : resolve()
              );
            })
          );
      }

      return p.then(
        () => {
          if (options.exportAcl) {
            log('Экспорт настроек безопасности');
            return exportAcl(dst, options.accounts, options.accessManager, options.namespace, options.exportAcl);
          }
        }
      );
    });
};
