/**
 * Created by kras on 19.07.16.
 */
'use strict';

var DsChangeLogger = require('./DsChangeLogger');

function DsChangeLogFactory(options) {
  this.ds = options.dataSource;

  if (!this.ds) {
    throw new Error('Не указан источник данных фабрики логгеров изменений!');
  }

  this.logger = function (authCallback) {
    return new DsChangeLogger(this.ds, authCallback);
  };
}

module.exports = DsChangeLogFactory;
