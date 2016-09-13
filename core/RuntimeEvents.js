/**
 * Created by kras on 19.07.16.
 */
'use strict';
var EventEmitter = require('events').EventEmitter;
var util = require('util');

function RuntimeEvents(options) {
  var _this = this;

  if (options.target instanceof EventEmitter) {
    if (options.startEvent) {
      options.target.on(options.startEvent, function () {
        _this.emit('started');
      });
    }
    if (options.stopEvent) {
      options.target.on(options.stopEvent, function () {
        _this.emit('stopped');
      });
    }
  }
}

util.inherits(RuntimeEvents, EventEmitter);
module.exports = RuntimeEvents;

