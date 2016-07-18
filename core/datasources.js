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
   * @param {String} name
   * @returns {DataSource}
   */
  this.get = function (name) {
    return this.sources[name];
  };

  /**
   * @returns {Promise}
   */
  this.connect = function () {
    var all, i;
    all = [];
    i = 0;
    for (var nm in this.sources) {
      if (this.sources.hasOwnProperty(nm)) {
        all[i] = this.sources[nm].open();
        i++;
      }
    }
    return Promise.all(all);
  };

  /**
   * @returns {Promise}
   */
  this.disconnect = function () {
    var all, i;
    all = [];
    i = 0;
    for (var nm in this.sources) {
      if (this.sources.hasOwnProperty(nm)) {
        all[i] = this.sources[nm].close();
        i++;
      }
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
