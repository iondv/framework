/**
 * Created by Vasiliy Ermilov (ermilov.work@yandex.ru) on 11/9/16.
 */
'use strict';

const AccessChecker = require('core/interfaces/AccessChecker');
const merge = require('merge');
const Permissions = require('core/Permissions');

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
          var rn, i;
          if (permissions[role]) {
            return resolve(permissions[role]);
          } else {
            aclProvider.getResources(role).then(function (res) {
              permissions[role] = {};
              for (rn in res) {
                if (res.hasOwnProperty(rn)) {
                  permissions[role][rn] = {};
                  for (i = 0; i < res[rn].length; i++) {
                    permissions[role][rn][res[rn][i]] = true;
                  }
                }
              }
              resolve(permissions[role]);
            }).catch(reject);
          }
        }));
      });
      Promise.all(promises).then(function (rolePermissions) {
        var result = {};
        for (var i = 0; i < rolePermissions.length; i++) {
          for (var rn in rolePermissions[i]) {
            if (rolePermissions[i].hasOwnProperty(rn)) {
              if (!result.hasOwnProperty(rn)) {
                result[rn] = {};
              }
              result[rn] = merge(result[rn], rolePermissions[i][rn]);
            }
          }
        }
        resolve(result);
      }).catch(reject);
    });
  }

  function permissions(user, code) {
    return new Promise(function (resolve, reject) {
      getRoles(user).then(getPermissions).then(
        function (permissions) {
          if (permissions.hasOwnProperty(code)) {
            resolve(permissions[code]);
          }
          return resolve({});
        }).catch(reject);
    });
  }

  /**
   *
   * @param {String} user
   * @param {{}} node
   * @returns {Promise}
   */
  this._checkNode = function (user, node) {
    return permissions(user, nodePrefix + (node.namespace ? node.namespace + '@' : '') + node.code);
  };

  /**
   *
   * @param {String} user
   * @param {String} className
   * @returns {Promise}
   */
  this._checkClass = function (user, className) {
    return permissions(user, classPrefix + className);
  };

  /**
   *
   * @param {String} user
   * @param {Item} item
   * @returns {Promise}
   */
  this._checkItem = function (user, item) {
    return permissions(user, itemPrefix + item.getClassName() + '@' + item.getItemId());
  };

  /**
   *
   * @param {String} user
   * @param {Property} attribute
   * @returns {Promise}
   */
  this._checkAttribute = function (user, attribute) {
    return permissions(user, attributePrefix + attribute.item.getClassName() + '.' + attribute.name);
  };
}

IonAccessChecker.prototype = new AccessChecker();

module.exports = IonAccessChecker;
