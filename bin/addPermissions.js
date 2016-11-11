/**
 * Created by Vasiliy Ermilov (ermilov.work@yandex.ru) on 11/11/16.
 */
var config = require('../config');
var di = require('core/di');

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
  {},
  null,
  ['application', 'rtEvents', 'sessionHandler']
).then(
  function (scp) {
    scope = scp;
    return new Promise(function (rs, rj) {
      var Acl = require('acl');

      _this.acl = new Acl(new Acl.mongodbBackend(scope.dataSources.connection(), config.prefix ? config.prefix : 'ion_acl_'));
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

