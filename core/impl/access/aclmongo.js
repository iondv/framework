/**
 * Created by kras on 27.02.16.
 */
'use strict';

const Acl = require('acl');
const AclProvider = require('core/interfaces/AclProvider');
const Permissions = require('core/Permissions');
const clone = require('clone');

// jshint maxstatements: 50, maxcomplexity: 20
function MongoAcl(config) {

  var _this = this;

  var ds = config.dataSource;

  if (!ds && global.ionDataSources) {
    ds = global.ionDataSources.get(config.accessDs);
  }

  if (!ds || ds.constructor.prototype.constructor.name !== 'DataSource') {
    throw 'Не указан источник данных для подсистемы контроля доступа!';
  }

  this.acl = {};

  this.globalMarker = config.allAlias ? config.allAlias : '*';

  /**
   * @returns {Promise}
   * @private
   */
  this._init = function () {
    return new Promise(function (resolve, reject) {
      _this.acl = new Acl(new Acl.mongodbBackend(ds.connection(), config.prefix ? config.prefix : 'ion_acl_'));
      resolve();
    });
  };

  /**
   * @param {String} subject
   * @param {String} resource
   * @param {String | String[]} permissions
   * @returns {Promise}
   */
  this._checkAccess = function (subject, resource, permissions) {
    return new Promise(function (resolve, reject) {
      var pr = function (err,res) {
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

      _this.acl.isAllowed(subject, resource, permissions, function (err, res) {
        if (!pr(err, res)) {
          _this.acl.isAllowed(subject, resource, Permissions.FULL, function (err, res) {
            if (!pr(err, res)) {
              _this.acl.isAllowed(subject, _this.globalMarker, permissions, function (err, res) {
                if (!pr(err, res)) {
                  _this.acl.isAllowed(subject, _this.globalMarker, Permissions.FULL, function (err, res) {
                    if (!pr(err, res)) {
                      _this.acl.isAllowed(_this.globalMarker, resource, permissions, function (err, res) {
                        if (!pr(err, res)) {
                          _this.acl.isAllowed(_this.globalMarker, resource, Permissions.FULL, function (err, res) {
                            if (!pr(err, res)) {
                              _this.acl.isAllowed(_this.globalMarker, _this.globalMarker, permissions,
                                function (err, res) {
                                  if (!pr(err, res)) {
                                    _this.acl.isAllowed(_this.globalMarker, _this.globalMarker, Permissions.FULL,
                                      function (err, res) {
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
    });
  };

  /**
   * @param {String} subject
   * @returns {Promise}
   */
  this._getRoles = function (subject) {
    return new Promise(function (resolve, reject) {
      _this.acl.userRoles(subject, function (err, roles) {
        if (err) {
          return reject(err);
        }
        return resolve(roles);
      });
    });
  };

  /**
   * @param {String | String[]} roles
   * @param {String | String[]} [permissions]
   * @returns {Promise}
   */
  this._getResources = function (roles, permissions) {
    return new Promise(function (resolve, reject) {
      var p = Array.isArray(permissions) ? permissions : [permissions];
      if (p.indexOf(Permissions.FULL) < 0) {
        p.push(Permissions.FULL);
      }
      _this.acl.whatResources(roles, p, function (err, res) {
        if (err) {
          return reject(err);
        }
        return resolve(res);
      });
    });
  };

  /**
   * @param {String} subject
   * @param {String | String[]} resources
   * @returns {Promise}
   */
  this._getPermissions = function (subject, resources, skipGlobals) {
    return new Promise(function (resolve, reject) {
      var r = Array.isArray(resources) ? resources : [resources];
      if (!skipGlobals) {
        if (r.indexOf(_this.globalMarker) < 0) {
          r = r.concat([_this.globalMarker]);
        }
      }

      var res = null;
      _this.acl.allowedPermissions(subject, r, function (err, perm) {
        if (err) {
          return reject(err);
        }
        res = {};
        var nm, i, hasGlobals;

        hasGlobals = false;
        var globalPermissions = {};
        if (!skipGlobals) {
          if (perm.hasOwnProperty(_this.globalMarker)) {
            for (i = 0; i < perm[_this.globalMarker].length; i++) {
              globalPermissions[perm[_this.globalMarker][i]] = true;
              hasGlobals = true;
            }
          }
        }

        if (perm.hasOwnProperty(_this.globalMarker)) {
          delete perm[_this.globalMarker];
        }

        for (nm in perm) {
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
                for (i = 0; i < perm[nm].length; i++) {
                  res[nm][perm[nm][i]] = true;
                }
              }
            }
          }
        }

        if (skipGlobals) {
          return resolve(res);
        }

        _this.acl.allowedPermissions(_this.globalMarker, r, function (err, perm) {
          if (err) {
            return reject(err);
          }

          for (var nm in perm) {
            if (perm.hasOwnProperty(nm) && res.hasOwnProperty(nm)) {
              for (i = 0; i < perm[nm].length; i++) {
                res[nm][perm[nm][i]] = true;
              }
            }
          }

          return resolve(res);
        });
      });
    });
  };

  /**
   * @param {String[]} subjects
   * @param {String[]} roles
   * @returns {Promise}
   */
  this._assignRoles = function (subjects, roles) {
    var promises = [];
    subjects.forEach(function (subject) {
      promises.push(new Promise(function (resolve, reject) {
        _this.acl.addUserRoles(subject, roles, function (err) {
          if (err) {
            return reject(err);
          }
          resolve();
        });
      }));
    });
    return Promise.all(promises);
  };

  /**
   * @param {String[]} roles
   * @param {String[]} resources
   * @param {String[]} permissions
   * @returns {Promise}
   */
  this._grant = function (roles, resources, permissions) {
    return new Promise(function (resolve, reject) {
      _this.acl.allow(roles, resources, permissions, function (err) {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
  };

  /**
   * @param {String[]} roles
   * @param {String[]} resources
   * @param {String[]} permissions
   * @returns {Promise}
   */
  this._deny = function (roles, resources, permissions) {
    return new Promise(function (resolve, reject) {
      _this.acl.removeAllow(roles, resources, permissions, function (err) {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
  };
}

MongoAcl.prototype = new AclProvider();

module.exports = MongoAcl;
