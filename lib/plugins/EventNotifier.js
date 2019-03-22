/**
 * Created by krasilneg on 21.03.19.
 */
const Item = require('core/interfaces/DataRepository').Item;
const normalize = require('core/util/normalize');


/**
 * @param {{}} options
 * @param {{}} options.emitters
 * @param {Notifier} options.notifier
 * @constructor
 */
function EventNotifier(options) {

  function getEventData(e, nm) {
    if (e instanceof Item) {
      return e.get(nm);
    } else if (e && (typeof e === 'object')) {
      if (nm.indexOf('.') > 0) {
        let parts = nm.split('.');
        return getEventData(e[parts[0]], parts.slice(1).join('.'));
      }
    } else if (Array.isArray(e) && nm) {
      const result = [];
      e.forEach((d) => {
        result.push(getEventData(d, nm));
      });
      return result;
    } else {
      return e;
    }
  }


  this.init = function () {
    Object.keys(options.emitters).forEach((nm) => {
      let config = options.emitters[nm];
      if (config.component && (typeof config.component.on === 'function')) {
        config.component.on((e) => {
          if (config.events[e.type] && (config.events[e.type].messageData || config.events[e.type].message)) {
            return options.notifier.notify({
              message: config.events[e.type].messageData ?
                normalize(getEventData(e, config.events[e.type].messageData)) :
              config.events[e.type].message || '',
              sender: String(getEventData(e, config.events[e.type].sender)),
              recievers: getEventData(e, config.events[e.type].recievers),
              subject: String(getEventData(e, config.events[e.type].subject)),
              dispatch: config.events[e.type].dispatch,
              type: config.events[e.type].notificationType
            });
          }
          return Promise.resolve();
        });
      }
    });
    return Promise.resolve();
  };
}

module.exports = EventNotifier;