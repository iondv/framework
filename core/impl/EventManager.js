/**
 * Created by Vasiliy Ermilov (ermilov.work@yandex.ru) on 10/18/16.
 */

function EventManager() {

  var listeners = {};

  this.on = function (event, func) {
    if (!listeners[event]) {
      listeners[event] = [];
    }
    listeners[event].push(func);
  };

  this.trigger = function (event, values) {
    return new Promise(function (resolve, reject) {
      if (listeners[event]) {
        var promises = [];
        for (var i = 0; i < listeners[event].length; i++) {
          promises.push(listeners[event][i](values));
        }
        Promise.all(promises).then(resolve).catch(reject);
      } else {
        resolve();
      }
    });
  };

}

module.exports = EventManager;
