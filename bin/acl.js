/**
 * Created by krasilneg on 19.12.16.
 */
const config = require('../config');
const di = require('core/di');
const fs = require('fs');
const path = require('path');

const IonLogger = require('core/impl/log/IonLogger');
const sysLog = new IonLogger({});
const Permissions = require('core/Permissions');
const errorSetup = require('core/error-setup');
const alias = require('core/scope-alias');
const extend = require('extend');
errorSetup(config.lang || 'ru');

var params = {
  permissions: [],
  users: [],
  resources: [],
  roles: [],
  method: 'grant',
  aclFile: null
};

var aclDefinitions = [];

var setParam = false;

// jshint maxstatements: 40, maxcomplexity: 20

process.argv.forEach(function (val) {
  if (val === '--u') {
    setParam = 'users';
  } else if (val === '--res') {
    setParam = 'resources';
  } else if (val === '--role') {
    setParam = 'roles';
  } else if (val === '--p') {
    setParam = 'permissions';
  } else if (val === '--m') {
    setParam = 'method';
  } else if (val === '--d') {
    setParam = 'aclDir';
  } else if (setParam) {
    if (Array.isArray(params[setParam])) {
      params[setParam].push(val);
    } else if (setParam === 'method') {
      params[setParam] = val === 'deny' ? 'deny' : 'grant';
    } else {
      params[setParam] = val;
    }
  }
});

if (!params.aclDir) {
  if (!params.roles.length) {
    console.error('Не указаны роли!');
    process.exit(130);
  }

  if (!params.users.length && !params.resources.length && !params.permissions.length) {
    console.error('Не указаны ни пользователи, ни ресурсы, ни права!');
    process.exit(130);
  }
} else {
  if (fs.existsSync(params.aclDir)) {
    let files = fs.readdirSync(params.aclDir);
    files.forEach(function (file) {
      if (fs.statSync(path.join(params.aclDir, file)).isFile()) {
        aclDefinitions.push(JSON.parse(fs.readFileSync(path.join(params.aclDir, file), {encoding: 'utf-8'})));
      }
    });
  } else {
    console.warn('Указанная директория списков доступа не существует.');
  }
}

var scope = null;

config.di.roleAccessManager =
{
  module: 'core/impl/access/amAccessManager',
  initMethod: 'init',
  initLevel: 1,
  options: {
    dataSource: 'ion://Db'
  }
};

function setRolePermissions(role, resource, permissions) {
  return function () {
    return scope.roleAccessManager.grant([role], [resource], permissions);
  };
}

function processAclDefinition(u) {
  return function () {
    if (u.type === 'user') {
      return new Promise(function (resolve, reject) {
        scope.auth.register(
          {
            name: u.name,
            pwd: u.pwd
          },
          function (err, u) {
            if (err) {
              return reject(err);
            }
            resolve(u);
          }
        );
      }).catch(function (err) {
        console.warn('Не удалось зарегистрировать пользователя ' + u.name);
        return Promise.resolve();
      }).then(function (user) {
        if (Array.isArray(u.roles)) {
          return scope.roleAccessManager.assignRoles(
            [(user ? user.id : u.name) + '@' + (user ? user.type : 'local')],
            u.roles
          );
        }
        return Promise.resolve();
      });
    } else if (u.type === 'role') {
      let w = Promise.resolve();
      if (u.permissions && typeof u.permissions === 'object') {
        for (let resource in u.permissions) {
          if (u.permissions.hasOwnProperty(resource)) {
            if (Array.isArray(u.permissions[resource])) {
              w = w.then(setRolePermissions(u.name, resource, u.permissions[resource]));
            }
          }
        }
      }
      return w;
    }
  };
}

// Связываем приложение
di('boot', config.bootstrap,
  {
    sysLog: sysLog
  }, null, ['auth', 'rtEvents', 'sessionHandler', 'scheduler'])
  .then((scope) => di('app', extend(true, config.di, scope.settings.get('plugins') || {}), {}, 'boot'))
  .then((scope) => alias(scope, scope.settings.get('di-alias')))
  .then((scope) => params.users.length ?
    scope.roleAccessManager.assignRoles(params.users, params.roles).then(() => scope) : scope
  )
  .then((scope) => {
    if (params.resources.length || params.permissions.length) {
      if (!params.resources.length) {
        params.resources.push(scope.roleAccessManager.globalMarker);
      }
      if (!params.permissions.length) {
        params.permissions.push(Permissions.FULL);
      }
      if (params.method === 'grant') {
        return scope.roleAccessManager.grant(params.roles, params.resources, params.permissions).then(() => scope);
      } else {
        return scope.roleAccessManager.deny(params.roles, params.resources, params.permissions).then(() => scope);
      }
    } else {
      return scope;
    }
  })
  .then((scope) => {
    let w = Promise.resolve();
    aclDefinitions.forEach(function (u) {
      w = w.then(processAclDefinition(u));
    });
    return w.then(() => scope);
  })
  .then((scope) => scope.dataSources.disconnect())
  .then(() => {
    console.info('Права назначены');
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(130);
  });
