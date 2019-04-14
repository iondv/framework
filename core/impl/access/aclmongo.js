/* eslint new-cap:off */

/**
 * Created by kras on 27.02.16.
 */
'use strict';

const Acl = require('acl');
const AclProvider = require('core/interfaces/AclProvider');
const Permissions = require('core/Permissions');
const clone = require('clone');
const merge = require('merge');

function MongoAcl(config) {

  var _this = this;

  var ds = config.dataSource;

  if (!ds || ds.constructor.prototype.constructor.name !== 'DataSource') {
    throw 'Не указан источник данных для подсистемы контроля доступа!';
  }

  var _acl = null;

  var _db = null;

  var connecting = false;

  this.globalMarker = config.allAlias ? config.allAlias : '*';

  function getAcl() {
    var db = ds.connection();
    if (_acl && db && db === _db) {
      return Promise.resolve(_acl);
    }
    if (connecting) {
      return Promise.reject(new Error('Не удалось инициализировать ACL'));
    }
    _acl = null;
    connecting = true;
    return ds.open().then((db) => {
      _db = db;
      connecting = false;
      _acl = new Acl(new Acl.mongodbBackend(db, config.prefix ? config.prefix : 'ion_acl_'));
      return _acl;
    }).catch((err) => {
      config.log ? config.log.error(err) : console.error(err);
      connecting = false;
    });
  }

  /**
   * @returns {Promise}
   * @private
   */
  this._init = function () {
    return getAcl();
  };

  /**
   * @param {String} subject
   * @param {String} resource
   * @param {String | String[]} permissions
   * @returns {Promise}
   */
  this._checkAccess = function (subject, resource, permissions) {
    return getAcl().then(acl =>
      new Promise((resolve, reject) => {
        var pr = function (err, res) {
          if (err) {
            reject(err);
            return true;
          }

          if (res) {
            resolve(res);
            return true;
          }

          return false;
        };
        acl.isAllowed(subject, resource, permissions, (err, res) => {
            if (!pr(err, res)) {
              acl.isAllowed(subject, resource, Permissions.FULL, (err, res) => {
                if (!pr(err, res)) {
                  acl.isAllowed(subject, _this.globalMarker, permissions, (err, res) => {
                    if (!pr(err, res)) {
                      acl.isAllowed(subject, _this.globalMarker, Permissions.FULL, (err, res) => {
                        if (!pr(err, res)) {
                          acl.isAllowed(_this.globalMarker, resource, permissions, (err, res) => {
                            if (!pr(err, res)) {
                              acl.isAllowed(_this.globalMarker, resource, Permissions.FULL, (err, res) => {
                                if (!pr(err, res)) {
                                  acl.isAllowed(_this.globalMarker, _this.globalMarker, permissions,
                                    (err, res) => {
                                      if (!pr(err, res)) {
                                        acl.isAllowed(_this.globalMarker, _this.globalMarker, Permissions.FULL,
                                          (err, res) => {
                                            if (!pr(err, res)) {
                                              resolve(false);
                                            }
                                          }
                                        );
                                      }
                                    }
                                  );
                                }
                              });
                            }
                          });
                        }
                      });
                    }
                  });
                }
              });
            }
          });
      })
    );
  };

  /**
   * @param {String | String[]} subjects
   * @param {String | String[]} resources
   * @returns {Promise}
   */
  this._getPermissions = function (subjects, resources, skipGlobals) {
    let r = Array.isArray(resources) ? resources : [resources];
    let subjs = Array.isArray(subjects) ? subjects.slice() : [subjects];
    let returnGlobal = r.indexOf(_this.globalMarker) >= 0;
    if (!skipGlobals) {
      if (r.indexOf(_this.globalMarker) < 0) {
        r = r.concat([_this.globalMarker]);
      }
    }
    let result = {};
    return getAcl().then((acl) => {
      let p = Promise.resolve();
      subjs.forEach((subject) => {
        p = p.then(() =>
          new Promise((resolve, reject) => {
            acl.allowedPermissions(subject, r, (err, perm) => {
              if (err) {
                return reject(err);
              }
              let res = {};
              let hasGlobals = false;
              let globalPermissions = {};
              if (!skipGlobals) {
                if (perm.hasOwnProperty(_this.globalMarker)) {
                  for (let i = 0; i < perm[_this.globalMarker].length; i++) {
                    globalPermissions[perm[_this.globalMarker][i]] = true;
                    hasGlobals = true;
                  }
                }
              }

              if (perm.hasOwnProperty(_this.globalMarker) && !returnGlobal) {
                delete perm[_this.globalMarker];
              }

              for (let nm in perm) {
                if (perm.hasOwnProperty(nm)) {
                  if (perm[nm].length || hasGlobals) {
                    res[nm] = clone(globalPermissions);
                    if (perm[nm].indexOf(Permissions.FULL) >= 0 || res[nm][Permissions.FULL]) {
                      res[nm][Permissions.READ] = true;
                      res[nm][Permissions.WRITE] = true;
                      res[nm][Permissions.DELETE] = true;
                      res[nm][Permissions.USE] = true;
                      res[nm][Permissions.FULL] = true;
                    } else {
                      for (let i = 0; i < perm[nm].length; i++) {
                        res[nm][perm[nm][i]] = true;
                      }
                    }
                  }
                }
              }

              if (skipGlobals) {
                return resolve(res);
              }

              acl.allowedPermissions(_this.globalMarker, r, (err, perm) => {
                if (err) {
                  return reject(err);
                }

                for (let nm in perm) {
                  if (perm.hasOwnProperty(nm) && res.hasOwnProperty(nm)) {
                    for (let i = 0; i < perm[nm].length; i++) {
                      res[nm][perm[nm][i]] = true;
                    }
                  }
                }
                return resolve(res);
              });
            });
          }).then((res) => {
            result = merge.recursive(true, result, res);
          })
        );
      });
      return p.then(() => result);
    });
  };

  /**
   * @param {String} subject
   * @param {String | String[]} permissions
   * @returns {Promise}
   */
  this._getResources = function (subject, permissions) {
    let p = Array.isArray(permissions) ? permissions : [permissions];
    if (p.indexOf(_this.globalMarker) < 0) {
      p.push(_this._globalMarker);
    }
    return getAcl().then(acl => new Promise((resolve, reject) => {
      acl.userRoles(subject, (err, roles) => {
        if (err) {
          return reject(err);
        }
        acl.whatResources(roles, p, (err, resources) => err ? reject(err) : resolve(resources));
      });
    }));
  };

  /**
   * @param {String} subject
   * @returns {Promise}
   */
  this._getCoactors = function (subject) {
    return getAcl().then(acl => new Promise((resolve, reject) => {
      acl.userRoles(subject, (err, roles) => err ? reject(err) : resolve(roles));
    }));
  };
}

MongoAcl.prototype = new AclProvider();

module.exports = MongoAcl;
