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

  function checker(user, subject, permissions) {
    return new Promise(function (resolve, reject) {
      if (user) {
        aclProvider.checkAccess(user, subject, permissions, function (err, res) {
          if (err) {
            return reject(err);
          }
          return resolve(res ? true : false);
        });
      } else {
        resolve(false);
      }
    });
  }

  /**
   *
   * @param {String} user
   * @param {{}} node
   * @param {String | Array} permissions
   * @returns {Promise}
   */
  this._checkNode = function (user, node, permissions) {
    return checker(user, nodePrefix + node.id, permissions);
  };

  /**
   *
   * @param {String} user
   * @param {String} className
   * @param {String | Array} permissions
   * @returns {Promise}
   */
  this._checkClass = function (user, className, permissions) {
    return checker(user, classPrefix + className, permissions);
  };

  /**
   *
   * @param {String} user
   * @param {Item} item
   * @param {String | Array} permissions
   * @returns {Promise}
   */
  this._checkItem = function (user, item, permissions) {
    return checker(user, itemPrefix + item.getClassName() + '@' + item.getItemId(), permissions);
  };

  /**
   *
   * @param {String} user
   * @param {Property} attribute
   * @param {String | Array} permissions
   * @returns {Promise}
   */
  this._checkAttribute = function (user, attribute, permissions) {
    return checker(user, attributePrefix + attribute.item.getClassName + attribute.name, permissions);
  };

  this._accessFilter = function () {
  };

}

IonAccessChecker.prototype = new AccessChecker();

module.exports = IonAccessChecker;
