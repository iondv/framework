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

function permit(uid, className, acl) {
  return new Promise(function (resolve, reject) {
    var rolePromises = [];
    rolePromises.push(acl.allow(className + 'Reader', 'read', 'c:::' + className));
    rolePromises.push(acl.allow(className + 'Creator', 'create', 'c:::' + className));
    rolePromises.push(acl.allow(className + 'Editor', 'update', 'c:::' + className));
    rolePromises.push(acl.allow(className + 'Deletor', 'delete', 'c:::' + className));

    Promise.all(rolePromises).then(function () {
      var permPromises = [];
      permPromises.push(acl.addUserRoles(uid, className + 'Reader'));
      return Promise.all(permPromises);
    }).then(resolve).catch(reject);
  });
}

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
      var classes = [
        'mzRPNSanEpidConclusionsOpeka',
        'smv0003546',
        'smv2120SOCINFOTEX',
        'smv2158SOCINFOTEX',
        'smv2173SOCINFOTEX',
        'rqstMain',
        'smvFNSdeptRequestNew',
        'rqstPfrSnilsVerify'
      ];
      var promises = [];
      for (var i = 0; i < classes.length; i++) {
        promises.push(permit('vasya', classes[i], acl));
      }
      Promise.all(promises).then(rs).catch(rj);
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

