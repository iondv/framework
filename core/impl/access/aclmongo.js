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
    this.acl = new Acl(new Acl.mongodbBackend(ds.connection(), config.prefix ? config.prefix : 'ion_acl_'));
    return Promise.resolve();
  };

  /**
   * @param {String} subject
   * @param {String} resource
   * @param {String | String[]} permissions
   * @returns {Promise}
   */
  this._checkAccess = function (subject, resource, permissions) {
    return new Promise(function (resolve, reject) {
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
   * @param {String | String[]} resources
   * @returns {Promise}
   */
  this._getPermissions = function (subject, resources, skipGlobals) {
    return new Promise(function (resolve, reject) {
      let r = Array.isArray(resources) ? resources : [resources];
      let returnGlobal = r.indexOf(_this.globalMarker) >= 0;
      if (!skipGlobals) {
        if (r.indexOf(_this.globalMarker) < 0) {
          r = r.concat([_this.globalMarker]);
        }
      }
      let res = null;
      _this.acl.allowedPermissions(subject, r, function (err, perm) {
        if (err) {
          return reject(err);
        }
        res = {};
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

        _this.acl.allowedPermissions(_this.globalMarker, r, function (err, perm) {
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
    });
  };

  /**
   * @param {String} subject
   * @param {String | String[]} permissions
   * @returns {Promise}
   */
  this._getResources = function (subject, permissions) {
    return new Promise(function (resolve, reject) {
      var p = Array.isArray(permissions) ? permissions : [permissions];
      if (p.indexOf(_this.globalMarker) < 0) {
        p.push(_this._globalMarker);
      }
      _this.acl.userRoles(subject, function (err, roles) {
        if (err) {
          return reject(err);
        }
        _this.acl.whatResources(roles, p, function (err, resources) {
          return err ? reject(err) : resolve(resources);
        });
      });
    });
  };

  /**
   * @param {String} subject
   * @returns {Promise}
   */
  this._getCoactors = function (subject) {
    return new Promise(function (resolve, reject) {
      _this.acl.userRoles(subject, function (err, roles) {
        return err ? reject(err) : resolve(roles);
        });
    });
  };
}

MongoAcl.prototype = new AclProvider();

module.exports = MongoAcl;
