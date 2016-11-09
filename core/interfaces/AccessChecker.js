/**
 * Created by Vasiliy Ermilov (ermilov.work@yandex.ru) on 11/9/16.
 */
'use strict';

/**
 * @constructor
 */
function AccessChecker() {

  this.checkNode = function (node) {
    return this._checkNode(node);
  };

  this.checkClass = function (classObj) {
    return this._checkClass(classObj);
  };

  this.checkItem = function (item) {
    return this._checkItem(item);
  };

  this.checkAttribute = function (property) {
    return this._checkAttribute(property);
  };

  this.accessFilter = function () {
    return this._accessFilter();
  }

}

module.exports = AccessChecker;
