/**
 * Created by krasilneg on 19.12.16.
 */
const config = require('../config');
const di = require('core/di');

const IonLogger = require('core/impl/log/IonLogger');
const sysLog = new IonLogger({});
const Permissions = require('core/Permissions');

var permissions = [];
var users = [];
var resources = [];
var roles = [];
var method = 'grant';

var addUser = false;
var addPermission = false;
var addResource = false;
var addRole = false;
var setMethod = false;

// jshint maxstatements: 40
process.argv.forEach(function (val) {
  if (val === '--u') {
    addUser = true;
    addPermission = false;
    addResource = false;
    addRole = false;
    setMethod = false;
    return;
  } else if (val === '--res') {
    addUser = false;
    addPermission = false;
    addResource = true;
    addRole = false;
    setMethod = false;
    return;
  } else if (val === '--role') {
    addUser = false;
    addPermission = false;
    addResource = false;
    addRole = true;
    setMethod = false;
    return;
  } else if (val === '--p') {
    addUser = false;
    addPermission = true;
    addResource = false;
    addRole = false;
    setMethod = false;
    return;
  } else if (val === '--m') {
    addUser = false;
    addPermission = false;
    addResource = false;
    addRole = false;
    setMethod = true;
    return;
  } else if (addUser) {
    users.push(val);
  } else if (addResource) {
    resources.push(val);
  } else if (addPermission) {
    permissions.push(val);
  } else if (addRole) {
    roles.push(val);
  } else if (setMethod) {
    method = val === 'deny' ? 'deny' : 'grant';
  }
});

if (!roles.length) {
  console.error('Не указаны роли!');
  process.exit(130);
}

if (!users.length && !resources.length && !permissions.length) {
  console.error('Не указаны ни пользователи, ни ресурсы, ни права!');
  process.exit(130);
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
    if (!users.length) {
      return Promise.resolve();
    }
    return scope.roleAccessManager.assignRoles(users, roles);
  }
).then(
  function () {
    if (resources.length || permissions.length) {
      if (!resources.length) {
        resources.push(scope.roleAccessManager.globalMarker);
      }
      if (!permissions.length) {
        permissions.push(Permissions.FULL);
      }
      if (method === 'grant') {
        return scope.roleAccessManager.grant(roles, resources, permissions);
      } else {
        return scope.roleAccessManager.deny(roles, resources, permissions);
      }
    } else {
      return Promise.resolve();
    }
  }
).then(function () {
  return scope.dataSources.disconnect();
}).then(
  // Справились
  function () {
    console.info('Права назначены');
    process.exit(0);
  }
).catch(function (err) {
  console.error(err);
  process.exit(130);
});
