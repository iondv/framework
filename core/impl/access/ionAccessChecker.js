/**
 * Created by Vasiliy Ermilov (ermilov.work@yandex.ru) on 11/9/16.
 */
'use strict';

const AccessChecker = require('core/interfaces/AccessChecker');

function IonAccessChecker(config) {

  var aclProvider = config.aclProvider;
  if (!aclProvider) {
    throw new Error('Не указан aclProvider!');
  }
  var nodePrefix = config.nodePrefix  || 'n::';
  var classPrefix = config.classPrefix  || 'c::';
  var itemPrefix = config.itemPrefix || 'i::';
  var attributePrefix = config.attributePrefix || 'a::';

  var permissions = {};
  var userRoles = {};

  function getRoles(user) {
    return new Promise(function (resolve, reject) {
      if (userRoles[user]) {
        return resolve(userRoles[user]);
      } else {
        aclProvider.getRoles(user).then(function (roles) {
          userRoles[user] = roles;
          return resolve(roles);
        }).catch(reject);
      }
    });
  }

  function getPermissions(roles) {
    return new Promise(function (resolve, reject) {
      var promises = [];
      roles.forEach(function (role) {
        promises.push(new Promise(function (resolve, reject) {
          if (permissions[role]) {
            return resolve(permissions[role]);
          } else {
            aclProvider.getResources(role).then(function (res) {
              permissions[role] = res;
              return resolve(res);
            }).catch(reject);
          }
        }));
      });
      Promise.all(promises).then(resolve).catch(reject);
    });
  }

  function checkPermission(user, code, permission) {
    return new Promise(function (resolve, reject) {
      getRoles(user).then(getPermissions).then(function (permissions) {
          for (var i = 0; i < permissions.length; i++) {
            if (permissions[i][code]) {
              if (permissions[i][code].indexOf('*') > -1 || permissions[i][code].indexOf(permission) > -1) {
                return resolve(true);
              }
            }
          }
          return resolve(false);
        }).catch(reject);
    });
  }

  /**
   *
   * @param {String} user
   * @param {{}} node
   * @param {String} permission
   * @returns {Promise}
   */
  this._checkNode = function (user, node, permission) {
    var code = nodePrefix + (node.namespace ? node.namespace + '@' : '') + node.code;
    return checkPermission(user, code, permission);
  };

  /**
   *
   * @param {String} user
   * @param {String} className
   * @param {String} namespace
   * @param {String} permission
   * @returns {Promise}
   */
  this._checkClass = function (user, className, namespace, permission) {
    var code = classPrefix + (namespace ? namespace + '@' : '') + className;
    return checkPermission(user, code, permission);
  };

  /**
   *
   * @param {String} user
   * @param {Item} item
   * @param {String} permission
   * @returns {Promise}
   */
  this._checkItem = function (user, item, permission) {
    var code = itemPrefix + item.getClassName() + '@' + item.getItemId();
    return checkPermission(user, code, permission);
  };

  /**
   *
   * @param {String} user
   * @param {Property} attribute
   * @param {String} permission
   * @returns {Promise}
   */
  this._checkAttribute = function (user, attribute, permission) {
    var code = attributePrefix + attribute.item.getClassName + attribute.name;
    return checkPermission(user, code, permission);
  };

  this._accessFilter = function () {
  };

}

IonAccessChecker.prototype = new AccessChecker();

module.exports = IonAccessChecker;
