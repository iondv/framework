/**
 * Created by kalias_90 on 23.10.17.
 */

const RoleAccessManager = require('core/interfaces/RoleAccessManager');
const fs = require('fs');
const path = require('path');
const {readYAML} = require('core/util/read');
const {readJSON} = require('core/util/read');

/**
 *
 * @param {String} aclDir
 * @param {RoleAccessManager} accessManager
 * @param {Logger} log
 * @param {Object} auth
 * @returns {Promise}
 */
module.exports = function (aclDir, accessManager, log, auth) {
  if (accessManager instanceof RoleAccessManager) {
    if (fs.existsSync(aclDir) && fs.statSync(aclDir).isDirectory()) {
      let chain1 = Promise.resolve();
      let files = fs.readdirSync(aclDir);
      files.forEach(function (file) {
        let f = path.join(aclDir, file);
        if (fs.statSync(f).isFile()) {
          chain1 = chain1.then(() => {
            if (path.extname(f) === '.yml') {
              return readYAML(f);
            } else if (path.extname(f) === '.json') {
              return readJSON(f);
            } else {
              return Promise.reject(`Файл ${f} не прочитан. Неизвестное расширение.`);
            }
          }).then((data) => {
            if (Array.isArray(data)) {
              let chain2 = Promise.resolve();
              data.forEach(function (d) {
                chain2 = chain2.then(() => aclObjectImport(d, accessManager, log, auth));
              });
              return chain2;
            } else {
              return aclObjectImport(data, accessManager, log, auth);
            }
          }).then(() => log.info(`Файл ${f} импортирован.`))
            .catch((err) => {
              log.error(`Файл ${f} не импортирован.`);
              log.error(err);
            });
        }
      });
      return chain1.then(() => log.info(`Импорт списков доступа завершен.`));
    } else {
      return Promise.reject(new Error(`Указанная директория списков доступа не существует.`));
    }
  } else {
    return Promise.reject(new Error(`accessManager does not implement RoleAccessManager.`));
  }
};

/**
 * @param {Object} object
 * @param {RoleAccessManager} am
 * @param {Logger} log
 * @param {Object} auth
 * @returns {*}
 */
function aclObjectImport(object, am, log, auth) {
  switch (object.type) {
    case 'resource':
      return am.defineResource(object.id, object.name)
        .then(() => log.info(`Доступ к ресурс ${object.name} импортирован.`))
        .catch((err) => log.error(err));
    case 'role':
      return am.defineRole(object.id, object.name)
        .then(() => log.info(`Роль доступа ${object.name} импортирована.`))
        .catch((err) => log.error(err))
        .then(function () {
          let p = Promise.resolve();
          let perms = object.permissions;
          if (perms && typeof perms === 'object') {
            Object.keys(perms).forEach((resource) => {
              if (perms.hasOwnProperty(resource) && Array.isArray(perms[resource])) {
                p = p.then(() => am.grant([object.id], [resource], perms[resource]))
                  .catch((err) => log.error(err));
              }
            });
          }
          return p.then(log.info(`Права роли доступа ${object.name} импортированы.`));
        });
    case 'user':
      return new Promise(function (resolve, reject) {
        auth.register(
          {
            name: object.name,
            pwd: object.pwd
          },
          function (err, u) {
            if (err) {
              log.error(err);
              return resolve();
            }
            log.info(`Пользователь ${object.name} зарегистрирован.`);
            return resolve(u);
          }
        );
      }).then(function (u) {
        if (Array.isArray(object.roles)) {
          return am.assignRoles(
            [(u ? u.id : object.name) + '@' + (u ? u.type : 'local')],
            object.roles
          )
            .then(() => log.info(`Пользователю ${object.name} назначены роли доступа.`))
            .catch((err) => log.error(err));
        }
        return Promise.resolve();
      });
  }
  return Promise.resolve();
}

