/**
 * Created by Vasiliy Ermilov (ermilov.work@yandex.ru) on 11/9/16.
 */
'use strict';

/**
 * @constructor
 */
function AccessChecker() {

  /**
   *
   * @param {String} user
   * @param {{}} node
   * @param {String | Array} permissions
   * @returns {Promise}
   */
  this.checkNode = function (user, node, permissions) {
    return this._checkNode(user, node, permissions);
  };

  /**
   *
   * @param {String} user
   * @param {String} className
   * @param {String | Array} permissions
   * @returns {Promise}
   */
  this.checkClass = function (user, className, permissions) {
    return this._checkClass(user, className, permissions);
  };

  /**
   *
   * @param {String} user
   * @param {Item} item
   * @param {String | Array} permissions
   * @returns {Promise}
   */
  this.checkItem = function (user, item, permissions) {
    return this._checkItem(user, item, permissions);
  };

  /**
   *
   * @param {String} user
   * @param {Property} attribute
   * @param {String | Array} permissions
   * @returns {Promise}
   */
  this.checkAttribute = function (user, attribute, permissions) {
    return this._checkAttribute(user, attribute, permissions);
  };

  /**
   *
   * @returns {Promise}
   */
  this.accessFilter = function () {
    return this._accessFilter();
  };

}

module.exports = AccessChecker;
