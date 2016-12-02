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

  this.trigger = function (event) {
    return new Promise(function (resolve, reject) {
      if (listeners[event.type]) {
        var promises = [];
        try {
          var r;
          for (var i = 0; i < listeners[event.type].length; i++) {
            r = listeners[event.type][i](event);
            if (r instanceof Promise) {
              promises.push(r);
            }
          }
        } catch (err) {
          return reject(err);
        }
        Promise.all(promises).then(function (results) {
          event.results = results;
          resolve(event);
        }).catch(reject);
      } else {
        resolve(event);
      }
    });
  };

}

module.exports = EventManager;
