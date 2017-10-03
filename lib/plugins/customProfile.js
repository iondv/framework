/**
 * Created by Vasiliy Ermilov (ermilov.work@yandex.ru) on 4/4/17.
 */
'use strict';
const ProfilePlugin = require('lib/interfaces/ProfilePlugin');

/**
 *
 * @param {{}} options
 * @param {{}} options.fields
 * @param {Auth} options.auth
 * @param {MetaRepository} options.metaRepo
 * @param {DataRepository} options.dataRepo
 * @constructor
 */
function CustomProfile(options = {}) {

  if (!options.metaRepo || !options.dataRepo) {
    throw new Error('Не настроены необходимые компоненты');
  }

  var fields = options.fields || {};

  this._fields = function () {
    var result = {};
    var promises = [];
    Object.keys(fields).forEach(function (fieldName) {
      if (fields[fieldName]) {
        if (fields[fieldName].selection) {
          promises.push(options.dataRepo
              .getList(fields[fieldName].selection)
              .then(list => {
                result[fieldName] = [];
                if (list && list.length) {
                  for (let item of list) {
                    result[fieldName].push({key: item.toString(), value: item.getItemId()});
                  }
                }
                return Promise.resolve();
              })
          );
        } else {
          result[fieldName] = fields[fieldName];
        }
      }
    });
    return Promise.all(promises).then(() => {return result;});
  };

  this._validate = function (data) {
    var user = {};
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
