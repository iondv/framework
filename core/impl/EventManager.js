/**
 * Created by Vasiliy Ermilov (ermilov.work@yandex.ru) on 10/18/16.
 */

function EventManager() {

  var listeners = {};

  this.on = function (event, func) {
    if (Array.isArray(event)) {
      event.forEach(e => this.on(e, func));
    } else {
      if (!listeners[event]) {
        listeners[event] = [];
      }
      listeners[event].push(func);
    }
  };

  this.trigger = function (event) {
    if (listeners[event.type]) {
      var promises = [];
      try {
        for (let i = 0; i < listeners[event.type].length; i++) {
          let r = listeners[event.type][i](event);
          if (r instanceof Promise) {
            promises.push(r);
          }
        }
      } catch (err) {
        return Promise.reject(err);
      }
      return Promise.all(promises)
        .then(
          function (results) {
            event.results = results;
            return Promise.resolve(event);
          }
        );
    } else {
      return Promise.resolve(event);
    }
  };
}

module.exports = EventManager;
