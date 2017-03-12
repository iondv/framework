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
      let w;
      if (u.permissions && typeof u.permissions === 'object') {
        for (let resource in u.permissions) {
          if (u.permissions.hasOwnProperty(resource)) {
            if (Array.isArray(u.permissions[resource])) {
              if (w) {
                w = w.then(setRolePermissions(u.name, resource, u.permissions[resource]));
              } else {
                w = setRolePermissions(u.name, resource, u.permissions[resource])();
              }
            }
          }
        }
      }
      if (!w) {
        return Promise.resolve();
      }
      return w;
    }
  };
}

// Связываем приложение
di('app', config.di,
  {
    sysLog: sysLog
  },
  null,
  ['application', 'rtEvents', 'sessionHandler']
).then(
  function (scp) {
    scope = scp;
    if (!params.users.length) {
      return Promise.resolve();
    }
    return scope.roleAccessManager.assignRoles(params.users, params.roles);
  }
).then(
  function () {
    if (params.resources.length || params.permissions.length) {
      if (!params.resources.length) {
        params.resources.push(scope.roleAccessManager.globalMarker);
      }
      if (!params.permissions.length) {
        params.permissions.push(Permissions.FULL);
      }
      if (params.method === 'grant') {
        return scope.roleAccessManager.grant(params.roles, params.resources, params.permissions);
      } else {
        return scope.roleAccessManager.deny(params.roles, params.resources, params.permissions);
      }
    } else {
      return Promise.resolve();
    }
  }
).then(
  function () {
    var w = null;

    aclDefinitions.forEach(function (u) {
      if (w) {
        w = w.then(processAclDefinition(u));
      } else {
        w = processAclDefinition(u)();
      }
    });

    if (!w) {
      return Promise.resolve();
    }
    return w;
  }
).then(
  function () {
    return scope.dataSources.disconnect();
  }
).then(
  // Справились
  function () {
    console.info('Права назначены');
    process.exit(0);
  }
).catch(function (err) {
  console.error(err);
  process.exit(130);
});
