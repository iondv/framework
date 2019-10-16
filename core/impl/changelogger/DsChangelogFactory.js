/**
 * Created by kras on 19.07.16.
 */
'use strict';

var DsChangeLogger = require('./DsChangeLogger');

function DsChangeLogFactory(options) {
  this.ds = options.dataSource;

  if (!this.ds) {
    throw new Error('No data source of change logger factory specified!');
  }

  this.logger = function (authCallback) {
    return new DsChangeLogger(this.ds, authCallback);
  };
}

module.exports = DsChangeLogFactory;
