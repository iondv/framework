/**
 * Created by krasilneg on 19.12.16.
 */
const config = require('../config');
const di = require('core/di');

const IonLogger = require('core/impl/log/IonLogger');
const Permissions = require('core/Permissions');
const errorSetup = require('core/error-setup');
const alias = require('core/scope-alias');
const extend = require('extend');
errorSetup(config.lang || 'ru');
const aclImport = require('lib/aclImport');

var params = {
  permissions: [],
  users: [],
  resources: [],
  roles: [],
  method: 'grant'
};

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
}

let sysLog = new IonLogger(config.log || {});

// Связываем приложение
di('boot', config.bootstrap,
  {
    sysLog: sysLog
  }, null, ['rtEvents', 'sessionHandler', 'scheduler', 'application'])
  .then((scope) => di('app', extend(true, config.di, scope.settings.get('plugins') || {}), {}, 'boot'))
  .then((scope) => alias(scope, scope.settings.get('di-alias')))
  .then((scope) => params.aclDir ?
    aclImport(params.aclDir, scope.roleAccessManager, sysLog, scope.auth).then(() => scope) : scope)
  .then((scope) => params.users.length ?
    scope.roleAccessManager.assignRoles(params.users, params.roles).then(() => scope) : scope)
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
  .then((scope) => scope.dataSources.disconnect())
  .then(() => {
    console.info('Права назначены');
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(130);
  });
