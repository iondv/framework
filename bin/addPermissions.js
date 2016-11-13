/**
 * Created by Vasiliy Ermilov (ermilov.work@yandex.ru) on 11/11/16.
 */
var config = require('../config');
var di = require('core/di');

var IonLogger = require('core/impl/log/IonLogger');
var sysLog = new IonLogger({});
var Acl = require('acl');

var name = 'admin';
var pwd = 'admin';

var setName = false;
var setPwd = false;

process.argv.forEach(function (val) {
  if (val === '--name') {
    setName = true;
    setPwd = false;
    return;
  } else if (val === '--pwd') {
    setPwd = true;
    setName = false;
    return;
  } else if (setName) {
    name = val;
  } else if (setPwd) {
    pwd = val;
  }
  setName = false;
  setPwd = false;
});

var scope = null;
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
    return new Promise(function (rs, rj) {
      var acl = new Acl(new Acl.mongodbBackend(scope.Db.connection(), config.prefix ? config.prefix : 'ion_acl_'));
      acl.allow('user',
        [ 'n::develop-and-test',
          'n::bugs',
          'n::readonlyAttrAsString',
          'n::readonlyAttrAsString.readonlyBoolean',
          'n::readonlyAttrAsString.readonlyColl.catalog'
        ], '*');
      acl.addUserRoles('vasya', 'user');
      rs();
    });
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

