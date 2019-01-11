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
                list.forEach((item) => {
                  for (let p in opts.properties) {
                    if (opts.properties.hasOwnProperty(p)) {
                      props[p] = item.get(opts.properties[p]);
                    }
                  }
                });
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
