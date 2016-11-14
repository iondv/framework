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

  function userPermissions(user) {
    return new Promise(function (resolve, reject) {
      getRoles(user).then(getPermissions).then(resolve).catch(reject);
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
    return new Promise(function (resolve, reject) {
      userPermissions(user)
        .then(function (permissions) {
          var nodeId = nodePrefix + (node.namespace ? node.namespace + '@' : '') + node.code;
          for (var i = 0; i < permissions.length; i++) {
            if (permissions[i][nodeId]) {
              if (permissions[i][nodeId].indexOf('*') > -1 || permissions[i][nodeId].indexOf(permission) > -1) {
                return resolve(true);
              }
            }
          }
          return resolve(false);
        }).catch(reject);
    });
  };

  /**
   *
   * @param {String} user
   * @param {String} className
   * @param {String | Array} permissions
   * @returns {Promise}
   */
  this._checkClass = function (user, className, permissions) {
    return aclProvider.checkAccess(user, classPrefix + className, permissions);
  };

  /**
   *
   * @param {String} user
   * @param {Item} item
   * @param {String | Array} permissions
   * @returns {Promise}
   */
  this._checkItem = function (user, item, permissions) {
    return aclProvider.checkAccess(user, itemPrefix + item.getClassName() + '@' + item.getItemId(), permissions);
  };

  /**
   *
   * @param {String} user
   * @param {Property} attribute
   * @param {String | Array} permissions
   * @returns {Promise}
   */
  this._checkAttribute = function (user, attribute, permissions) {
    return aclProvider.checkAccess(user, attributePrefix + attribute.item.getClassName + attribute.name, permissions);
  };

  this._accessFilter = function () {
  };

}

IonAccessChecker.prototype = new AccessChecker();

module.exports = IonAccessChecker;
