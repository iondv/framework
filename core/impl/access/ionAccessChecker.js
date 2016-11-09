/**
 * Created by Vasiliy Ermilov (ermilov.work@yandex.ru) on 11/9/16.
 */
'use strict';

const AccessChecker = require('core/interfaces/AccessChecker');

function IonAccessChecker(config) {

  var aclProvider = config.accessChecker;

  if (!aclProvider) {
    throw new Error('Не указан aclProvider!');
  }

  this._checkNode = function (node) {
    return new Promise(function(resolve, reject){
      
    });
  };

  this._checkClass = function (classObj) {
  };

  this._checkItem = function (item) {
  };

  this._checkAttribute = function (property) {
  };

  this._accessFilter = function () {
  };

}

IonAccessChecker.prototype = new AccessChecker();

module.exports = IonAccessChecker;
