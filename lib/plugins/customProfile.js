/**
 * Created by Vasiliy Ermilov (ermilov.work@yandex.ru) on 4/4/17.
 */
'use strict';
const ProfilePlugin = require('lib/interfaces/ProfilePlugin');
const F = require('core/FunctionCodes');

/**
 *
 * @param {{}} options
 * @param {{}} options.fields
 * @param {Auth} options.auth
 * @param {MetaRepository} options.metaRepo
 * @param {DataRepository} options.dataRepo
 * @param {Logger} options.log
 * @param {{}} [options.propertyMap]
 * @constructor
 */
function CustomProfile(options = {}) {

  if (!options.metaRepo || !options.dataRepo) {
    throw new Error('Не настроены необходимые компоненты');
  }

  var fields = options.fields || {};

  this._fields = function () {
    const result = {};
    let promises = Promise.resolve();
    Object.keys(fields).forEach((fieldName) => {
      if (fields[fieldName]) {
        if (typeof fields[fieldName].selection === 'string') {
          promises = promises
            .then(() => options.dataRepo.getList(fields[fieldName].selection))
            .catch((err) => {
              if (options.log) {
                options.log.warn(err.message || err);
              }
              return [];
            })
            .then((list) => {
              result[fieldName] = fields[fieldName];
              result[fieldName].selection = [];
              if (list && list.length) {
                for (let item of list) {
                  result[fieldName].selection.push({key: item.toString(), value: item.getItemId()});
                }
              }
            });
        } else {
          result[fieldName] = fields[fieldName];
        }
      }
    });
    return promises.then(() => result);
  };

  function recursion(master, cn, opts, eager, needed, props, processed) {
    let f = [];
    for (let an in opts.recursion) {
      if (opts.recursion.hasOwnProperty(an)) {
        let v = master.get(opts.recursion[an]);
        if (Array.isArray(v)) {
          f.push({[F.IN]: ['$' + an, v]});
        } else {
          f.push({[F.EQUAL]: ['$' + an, v]});
        }
      }
    }
    if (!f.length) {
      return Promise.resolve();
    }


    return options.dataRepo.getList(
      cn,
      {
        filter: f.length ? {[F.AND]: f} : null,
        forceEnrichment: eager,
        needed
      }
    ).catch((err) => {
      if (options.log) {
        options.log.warn(err.message || err);
      }
      return [];
    }).then((list) => {
      let r = Promise.resolve();
      list.forEach((item) => {
        if (processed[item.getItemId()]) {
          return;
        }
        processed[item.getItemId()] = true;
        for (let p in opts.properties) {
          if (opts.properties.hasOwnProperty(p)) {
            if (Array.isArray(props[p])) {
              let v = item.get(opts.properties[p]);
              if (Array.isArray(v)) {
                props[p].push(...v);
              } else {
                props[p].push(v);
              }
            } else if (!props[p]) {
              props[p] = item.get(opts.properties[p]);
            }
          }
        }
        r = r.then(() => recursion(item, cn, eager, needed, props, processed));
      });
      return r;
    });
  }

  this._properties = function (uid) {
    let result = Promise.resolve();
    let props = {};
    if (options.propertyMap && typeof options.propertyMap === 'object') {
      Object.keys(options.propertyMap).forEach((className) => {
        let opts = options.propertyMap[className];
        if (opts.properties && typeof opts.properties === 'object' && typeof opts.filter === 'string') {
          let eager = [];
          let needed = {};
          for (let p in opts.properties) {
            if (opts.properties.hasOwnProperty(p)) {
              let path = opts.properties[p].split('.');
              eager.push(path);
              needed[opts.properties[p]] = true;
            }
          }
          if (eager.length) {
            result = result
              .then(() => options.dataRepo.getList(
                className,
                {
                  filter: {[F.EQUAL]: ['$' + opts.filter, uid]},
                  count: 1,
                  forceEnrichment: eager,
                  needed
                }
              ))
              .catch((err) => {
                if (options.log) {
                  options.log.warn(err.message || err);
                }
                return [];
              })
              .then((list) => {
                let r = Promise.resolve();
                const processed = {};
                list.forEach((item) => {
                  for (let p in opts.properties) {
                    if (opts.properties.hasOwnProperty(p)) {
                      props[p] = item.get(opts.properties[p]);
                    }
                  }
                  if (opts.recursion) {
                    processed[item.getItemId()] = true;
                    r = r.then(() => recursion(item, className, opts, eager, needed, props, processed));
                  }
                });
                return r;
              });
          }
        }
      });
    }
    return result.then(() => props);
  };

  this._validate = function (data) {
    const user = {};
    for (let key of Object.keys(fields)) {
      if (fields[key] && fields[key].required) {
        if (!data[key]) {
          return Promise.reject(new Error('Не заполнены обязательные поля'));
        }
      }

      if (data[key] && ['username', 'password', 'password2', 'name', 'pwd'].indexOf(key) < 0) {
        user[key] = data[key];
      }
    }
    return Promise.resolve(user);
  };

  this.inject = function () {
    if (options.auth && typeof options.auth.addProfilePlugin === 'function') {
      options.auth.addProfilePlugin(this);
    }
    return Promise.resolve();
  };
}

CustomProfile.prototype = new ProfilePlugin();

module.exports = CustomProfile;
