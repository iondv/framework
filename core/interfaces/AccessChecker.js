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
   * @param {String} node
   * @returns {Promise}
   */
  this.checkNavNode = function (user, node) {
    return this._checkNavNode(user, node);
  };

  /**
   *
   * @param {String} user
   * @param {String} className
   * @returns {Promise}
   */
  this.checkClass = function (user, className) {
    return this._checkClass(user, className);
  };

  /**
   *
   * @param {String} user
   * @param {Item} item
   * @returns {Promise}
   */
  this.checkItem = function (user, item) {
    return this._checkItem(user, item);
  };

  /**
   *
   * @param {String} user
   * @param {Property} attribute
   * @returns {Promise}
   */
  this.checkAttribute = function (user, attribute) {
    return this._checkAttribute(user, attribute);
  };
}

module.exports = AccessChecker;
