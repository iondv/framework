/**
 * Created by kras on 27.02.16.
 */
'use strict';

var Acl = require('acl');

var AclProvider = require('core/interfaces/AclProvider');

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
          _this.acl.isAllowed(subject, resource, _this.globalMarker, function (err, res) {
            if (!pr(err, res)) {
              _this.acl.isAllowed(subject, _this.globalMarker, permissions, function (err, res) {
                if (!pr(err, res)) {
                  _this.acl.isAllowed(subject, _this.globalMarker, _this.globalMarker, function (err, res) {
                    if (!pr(err, res)) {
                      _this.acl.isAllowed(_this.globalMarker, resource, permissions, function (err, res) {
                        if (!pr(err, res)) {
                          resolve(false);
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
   *
   * @param {String | Array} roles
   * @returns {Promise}
   */
  this._getResources = function (roles) {
    return new Promise(function (resolve, reject) {
      _this.acl.whatResources(roles, function (err, res) {
        if (err) {
          return reject(err);
        }
        return resolve(res);
      });
    });
  };

  /**
   * @param {String[]} subjects
   * @param {String[]} roles
   * @returns {Promise}
   */
  this._assignRoles = function (subjects, roles) {
    return new Promise(function (resolve, reject) {
      _this.acl.addUserRoles(subjects, roles, function (err) {
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
