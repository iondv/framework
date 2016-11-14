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
        ['n::develop-and-test@key_guid',
          'n::develop-and-test@oneToOne.refBackRef.ref',
          'n::develop-and-test@simple_workflow',
          'n::develop-and-test@schedule',
          'n::develop-and-test@class_string',
          'c::develop-and-test@class_string'
        ], '*', function (err) {
          acl.addUserRoles('vasya', 'user', function (err) {
              var promises = [];
              promises.push(new Promise(function (resolve, reject) {
                acl.isAllowed('vasya', 'n::develop-and-test@key_guid', '1', function (err,res) {
                  resolve('isAllowed=' + res);
                });
              }));
              promises.push(new Promise(function (resolve, reject) {
                acl.userRoles('vasya', function (err, roles) {
                  resolve(roles);
                });
              }));
              promises.push(new Promise(function (resolve, reject) {
                acl.whatResources('user', function (err, data) {
                  resolve(data);
                });
              }));
              Promise.all(promises).then(function (results) {console.log(results); rs();}).catch(function (err) {console.log(err);});
            });
        });
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

