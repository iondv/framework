/**
 * Created by kras on 24.02.16.
 */
'use strict';

const LoggerProxy = require('core/impl/log/LoggerProxy');
const i18n = require('core/i18n');

const t = msg => i18n.t(msg)({domain: 'datasource'})

function Datasources(options) {
  var _this = this;
  /**
   * @type {DataSource[]}
   */
  this.sources = options.sources;

  /**
   * @type {RuntimeEvents}
   */
  this.runtimeEvents = options.runtimeEvents;

  var log = options.logger || new LoggerProxy();

  /**
   * @returns {Promise}
   */
  this.connect = function () {
    var all, i;
    all = [];
    log.info(t('Connecting datasources'));
    for (i = 0; i < this.sources.length; i++) {
      all.push(this.sources[i].open());
    }
    return Promise.all(all);
  };

  /**
   * @returns {Promise}
   */
  this.disconnect = function () {
    var all, i;
    all = [];
    for (i = 0; i < this.sources.length; i++) {
      all.push(this.sources[i].close());
    }
    return Promise.all(all);
  };

  if (this.runtimeEvents) {
    this.runtimeEvents.on('stop', function () {
      _this.disconnect().then(function () {
        log.info(t('All datasources successfully disconnected!'));
      }).catch(function (err) {
        log.error(err);
      });
    });
  }
}

module.exports = Datasources;
