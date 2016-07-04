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

  this.acl = new Acl(new Acl.mongodbBackend(ds.connection(), config.prefix ? config.prefix : 'ion_acl_'));

  this.globalMarker = config.allAlias ? config.allAlias : '*';

  /**
   * @returns {Promise}
   * @private
   */
  this._init = function () {
    return new Promise(function (resolve, reject) {
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

      this.acl.isAllowed(subject, resource, permissions, function (err, res) {
        if (!pr(err, res)) {
          _this.acl.isAllowed(subject, resource, _this.globalMarker, function (err, res) {
            if (!pr(err, res)) {
              _this.acl.isAllowed(subject, _this.globalMarker, permissions, function (err, res) {
                if (!pr(err, res)) {
                  _this.acl.isAllowed(subject, _this.globalMarker, _this.globalMarker, function (err, res) {
                    if (!pr(err, res)) {
                      _this.acl.isAllowed(_this.globalMarker, resource, permissions, function (err, res) {
                        if (!pr(err, res)) {
                          reject();
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
}

MongoAcl.prototype = new AclProvider();

module.exports = MongoAcl;
