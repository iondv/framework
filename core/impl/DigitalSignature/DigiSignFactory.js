/**
 * Created by Данил on 06.08.2016.
 */

'use strict';

var JsonDigiSignDataProvider = require('./JsonDigiSignDataProvider');
var SignedDataHandler = require('./SignedDataHandler');

function DigiSignFactory(options) {
  this.dsModel = options.DigiSignModel;

  if (!this.dsModel) {
    throw new Error('Не указан источник данных фабрики цифровых подписей!');
  }

  this.dataProvider = new JsonDigiSignDataProvider();

  this.handler = function (authCallback) {
    return new SignedDataHandler(this.dsModel, authCallback);
  };
}

module.exports = DigiSignFactory;
