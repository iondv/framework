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

  this._checkNode = function (user, node) {
    return new Promise(function (resolve, reject) {
      if (user) {
        aclProvider.checkAccess(user, 'n::' + node.id, 'read').then(resolve).catch(reject);
      } else {
        resolve(false);
      }
    });
  };

  this._checkClass = function (user, classObj) {
  };

  this._checkItem = function (user, item) {
  };

  this._checkAttribute = function (user, property) {
  };

  this._accessFilter = function () {
  };

}

IonAccessChecker.prototype = new AccessChecker();

module.exports = IonAccessChecker;
