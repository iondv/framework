/**
 * Created by kras on 09.09.16.
 */
'use strict';

const di = require('core/di');
const onError = require('./error');

module.exports = function (required, worker, res) {
  var scope = di.context('app');
  if (!scope) {
    return onError(scope, new Error('Не найден DI-контейнер app'), res, true);
  }

  if (Array.isArray(required)) {
    for (var i = 0; i < required.length; i++) {
      if (typeof scope[required[i]] === 'undefined' || !scope[required[i]]) {
        return onError(scope, new Error('Не настроен необходимый компонент ' + required[i]), res, true);
      }
    }
  }

  worker(scope);
};
