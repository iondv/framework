'use strict';
/**
 * Created by kalias_90 on 23.10.17.
 */

const RoleAccessManager = require('core/interfaces/RoleAccessManager');
const fs = require('fs');
const path = require('path');
const {readYAML, readJSON} = require('core/util/read');
const UserTypes = require('core/UserTypes');

/**
 * @param {{id: String, name: String}} r
 * @param {RoleAccessManager} am
 * @param {Logger} log
 * @returns {Promise}
 */
function importResource(r, am, log) {
  return am.defineResource(r.id, r.name)
    .then(() => log.info(`Зарегистрирован ресурс ${r.name}[${r.id}].`))
    .catch(err => log.error(err));
}

/**
 * @param {{id: String, name: String}} r
 * @param {{}} [r.permissions]
 * @param {RoleAccessManager} am
 * @param {Logger} log
 * @returns {Promise}
 */
function importRole(r, am, log) {
  return am.defineRole(r.id, r.name, r.description)
    .then(() => log.info(`Создана роль ${r.name}[${r.id}].`))
    .then(function () {
      let p = Promise.resolve();
      if (r.permissions && typeof r.permissions === 'object') {
        Object.keys(r.permissions).forEach((resource) => {
          if (
            r.permissions.hasOwnProperty(resource) &&
            Array.isArray(r.permissions[resource])
          ) {
            p = p
              .then(() => am.defineResource(resource, resource.replace(/^\w+:::/, '')))
              .then(() => am.grant([r.id], [resource], r.permissions[resource]))
              .then(() => log.info(`Заданы права роли ${r.name} на ресурс ${resource}.`))
              .catch(err => log.error(err));
          }
        });
      }
      return p;
    })
    .catch((err) => log.error(err));
}

/**
 * @param {{id: String, pwd: String}} u
 * @param {String} [u.name]
 * @param {String} [u.type]
 * @param {Array} [u.roles]
 * @param {Boolean} [u.needPwdReset]
 * @param {Auth} auth
 * @param {RoleAccessManager} am
 * @param {Logger} log
 * @returns {Promise}
 */
function importUser(u, auth, am, log) {
  return new Promise((resolve) => {
    auth.register(
      {
        id: u.id,
        name: u.name,
        pwd: u.pwd,
        type: u.type,
        needPwdReset: (typeof u.needPwdReset == 'undefined') ? true : u.needPwdReset
      },
      function (err, ru) {
        if (err) {
          log.warn(err);
          return resolve(u);
        }
        log.info(`Пользователь ${u.name} зарегистрирован.`);
        resolve(ru);
      }
    );
  })
    .then((ru) => {
      if (Array.isArray(u.roles)) {
        return am.assignRoles(
          [ru.id()],
          u.roles
        )
          .then(() => log.info(`Пользователю ${u.name} назначены роли.`));
      }
    })
    .catch((err) => log.error(err));
}

/**
 * @param {String} aclDir
 * @param {RoleAccessManager} accessManager
 * @param {Logger} log
 * @param {Object} auth
 * @returns {Promise}
 */
module.exports = function (aclDir, accessManager, log, auth) {
  if (accessManager instanceof RoleAccessManager) {
    if (fs.existsSync(aclDir) && fs.statSync(aclDir).isDirectory()) {
      let chain = Promise.resolve();
      let files = fs.readdirSync(aclDir);
      files.forEach(function (file) {
        let f = path.join(aclDir, file);
        if (fs.statSync(f).isFile() && (path.extname(f) === '.yml' || path.extname(f) === '.json')) {
          chain = chain.then(() => path.extname(f) === '.yml' ? readYAML(f) : readJSON(f))
            .then(
              (data) => {
                let chain = Promise.resolve();

                if (Array.isArray(data.roles)) {
                  data.roles.forEach((r) => {
                    chain = chain.then(() => importRole(r, accessManager, log));
                  });
                }

                if (Array.isArray(data.users)) {
                  data.users.forEach((u) => {
                    chain = chain.then(() => importUser(u, auth, accessManager, log));
                  });
                }

                if (Array.isArray(data.resources)) {
                  data.resources.forEach((r) => {
                    chain = chain.then(() => importResource(r, accessManager, log));
                  });
                }
                return chain;
              }
            )
            .then(() => log.info(`Файл ${f} импортирован.`))
            .catch((err) => {
              log.error(`Файл ${f} не был импортирован.`);
              log.error(err);
            });
        }
      });
      return chain.then(() => log.info(`Импорт настроек доступа завершен.`));
    } else {
      return Promise.reject(new Error(`Указанная директория настроек доступа не существует.`));
    }
  } else {
    return Promise.reject(new Error(`Не передан компонент управления ролевым доступом.`));
  }
};
