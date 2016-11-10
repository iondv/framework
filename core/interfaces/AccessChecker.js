/**
 * Created by Vasiliy Ermilov (ermilov.work@yandex.ru) on 11/9/16.
 */
'use strict';

/**
 * @constructor
 */
function AccessChecker() {

  this.checkNode = function (user, node) {
    return this._checkNode(user, node);
  };

  this.checkClass = function (user, classObj) {
    return this._checkClass(user, classObj);
  };

  this.checkItem = function (user, item) {
    return this._checkItem(user, item);
  };

  this.checkAttribute = function (property) {
    return this._checkAttribute(property);
  };

  this.accessFilter = function () {
    return this._accessFilter();
  };

}

module.exports = AccessChecker;
