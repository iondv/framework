/**
 * Created by kras on 24.02.16.
 */
'use strict';

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

  /**
   * @returns {Promise}
   */
  this.connect = function () {
    var all, i;
    all = [];
    console.log('Подключение источников данных');
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
        console.info('Successfully disconnected from datasources!');
      }).catch(function (err) {
        console.error(err);
      });
    });
  }
}

module.exports = Datasources;
