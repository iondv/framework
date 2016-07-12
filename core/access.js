/**
 * Created by kras on 20.02.16.
 */
'use strict';

var AclProvider = require('core/interfaces/AclProvider');

function AclMediator(conf) {
  /**
   * @type {AclProvider[]}
   */
  this.providers = [];

  var i, p, _this;
  _this = this;

  if (typeof conf.policy !== 'undefined') {
    for (i = 0; i < conf.policy.length; i++) {
      if (conf.policy[i].module) {
        var constructor = require(conf.policy[i].module);
        if (constructor.prototype.constructor.name === 'AclProvider') {
          p = new constructor(conf.policy[i].config);
          this.providers[this.providers.length] = p;
        }
      } else if (
        typeof conf.policy[i] === 'object' && // jscs:ignore disallowTrailingWhitespace
        conf.policy[i].constructor.prototype.constructor.name === 'AclProvider') {
        this.providers[this.providers.length] = conf.policy[i];
      }
    }
  }

  /**
   *
   * @type {Promise}
   * */
  this.init = function () {
    var i, p;
    p = [];
    for (i = 0; i < _this.providers.length; i++) {
      p[i] = _this.providers[i].init();
    }
    return Promise.all(p);
  };

  /**
   * @param {String} subject
   * @param {String} resource
   * @param {String | String[]} permissions
   * @returns {Promise}
   */
  this.checkAccess = function (subject, resource, permissions) {
    return new Promise(function (resolve,reject) {
      var p = null;

      for (i = 0; i < _this.providers.length; i++) {
        if (i === 0) {
          p = _this.providers[i].checkAccess();
        } else {
          p = p.then(resolve).catch(_this.providers[i].checkAccess());
        }
      }

      if (p) {
        p.then(resolve).catch(reject);
      }
    });
  };

  this.routeMiddleware = function (onAccessDenied, resource, permission) {
    return function (req, res, next) {
      _this.checkAccess(req.session.user.id, resource ? resource : req.path, permission || 'get')
        .then(next)
        .fail(function () {
                if (typeof onAccessDenied === 'function') {
                  onAccessDenied.call(req, res);
                } else {
                  throw {message: 'Access to path ' + req.path + ' denied for user ' + req.session.user.name + '!'};
                }
              });
    };
  };
}

module.exports = AclMediator;
