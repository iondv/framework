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
      const results = [];
      let promises = Promise.resolve();
      try {
        listeners[event.type].forEach((listener) => {
          promises = promises
            .then(() => listener(event))
            .then((result) => {
              if (typeof result !== 'undefined') {
                results.push(result);
              }
            });
        });
      } catch (err) {
        return Promise.reject(err);
      }
      return promises
        .then(
          () => {
            event.results = results;
            return event;
          }
        );
    } else {
      return Promise.resolve(event);
    }
  };
}

module.exports = EventManager;
