/**
 * Created by kras on 19.07.16.
 */
'use strict';
const {t} = require('core/i18n');

var DsChangeLogger = require('./DsChangeLogger');

function DsChangeLogFactory(options) {
  this.ds = options.dataSource;

  if (!this.ds) {
    throw new Error(t('Datasource not specified for changelogger factory!'));
  }

  this.logger = function (authCallback) {
    return new DsChangeLogger(this.ds, authCallback);
  };
}

module.exports = DsChangeLogFactory;
