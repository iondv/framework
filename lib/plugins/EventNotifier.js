/**
 * Created by krasilneg on 21.03.19.
 */
const Item = require('core/interfaces/DataRepository').Item;
const normalize = require('core/util/normalize');


/**
 * @param {{}} options
 * @param {{}} options.listeners
 * @param {Notifier} options.notifier
 * @param {DataRepository} options.dataRepo
 * @constructor
 */
function EventNotifier(options) {

  function getEventData(e, nm) {
    if (Array.isArray(nm)) {
      const result = [];
      nm.forEach((nm2) => {
        let ed = getEventData(e, nm2);
        if (Array.isArray(ed)) {
          result.push(...ed);
        } else {
          result.push(ed);
        }
      });
      return result;
    } else if (e instanceof Item) {
      return e.get(nm);
    } else if (e && (typeof e === 'object')) {
      if (nm.indexOf('.') > 0) {
        let parts = nm.split('.');
        return getEventData(e[parts[0]], parts.slice(1).join('.'));
      }
    } else if (Array.isArray(e) && nm) {
      const result = [];
      e.forEach((d) => {
        let ed = getEventData(d, nm);
        if (Array.isArray(ed)) {
          result.push(...ed);
        } else {
          result.push(ed);
        }
      });
      return result;
    } else {
      return e;
    }
  }

  function eagerLoading(e, nm) {
    let p = Promise.resolve();
    if (!nm) {
      return p;
    }
    if (Array.isArray(nm)) {
      nm.forEach((nm2) => {
        p = p.then(() => eagerLoading(e, nm2));
      });
    } else if ((e instanceof Item) && (nm.indexOf('.') > 0)) {
      p = p
        .then(() => options.dataRepo.getItem(e, null, {forceEnrichment: [nm.split('.')]}));
    } else if (e && (typeof e === 'object') && (nm.indexOf('.') > 0)) {
      let parts = nm.split('.');
      p = p
        .then(() => eagerLoading(e[parts[0]], parts.slice(1).join('.')))
        .then((item) => {
          if (item instanceof Item) {
            e[parts[0]] = item;
          }
        });
    }
    return p;
  }

  function subst(s, e) {
    return s.replace(/\$\{([\w_.]+)\}/g, (m, p1) => getEventData(e, p1));
  }

  function attrs(config) {
    let result = [];
    if (config.message) {
      config.message.replace(/\$\{([\w_.]+)\}/g, (m, p1) => {
        result.push(p1);
      });
    }
    if (config.subject) {
      config.subject.replace(/\$\{([\w_.]+)\}/g, (m, p1) => {
        result.push(p1);
      });
    }
    if (config.sender) {
      result.push(config.sender);
    }
    if (config.recievers) {
      if (Array.isArray(config.recievers)) {
        result.push(...config.recievers);
      } else {
        result.push(config.recievers);
      }
    }
    return result;
  }

  this.init = function () {
    Object.keys(options.listeners).forEach((nm) => {
      let config = options.listeners[nm];
      if (config.component && (typeof config.component.on === 'function')) {
        Object.keys(config.events).forEach((event) => {
          if (config.events[event] && (config.events[event].messageData || config.events[event].message)) {
            config.component.on(event, e =>
              eagerLoading(e, attrs(config.events[event]))
                .then(() =>
                  options.notifier.notify({
                    message: config.events[event].messageData ?
                      normalize(getEventData(e, config.events[event].messageData)) :
                      subst(config.events[event].message || '', e),
                    sender: String(getEventData(e, config.events[event].sender)),
                    recievers: getEventData(e, config.events[event].recievers),
                    subject: subst(config.events[event].subject, e),
                    dispatch: config.events[event].dispatch,
                    type: config.events[event].notificationType
                  })
                )
            );
          }
        });
      }
    });
    return Promise.resolve();
  };
}

module.exports = EventNotifier;