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

  /**
   *
   * @param {String} user
   * @param {{}} node
   * @param {String | Array} permissions
   * @returns {Promise}
   */
  this._checkNode = function (user, node, permissions) {
    return aclProvider.checkAccess(user, nodePrefix + node.id, permissions);
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
