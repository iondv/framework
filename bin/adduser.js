/**
 * Created by kras on 24.08.16.
 */
var config = require('../config');
var di = require('core/di');

var IonLogger = require('core/impl/log/IonLogger');

var sysLog = new IonLogger({});

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
      scope.auth.register(
        {
          name: name,
          pwd: pwd
        },
        function (err, u) {
          if (err) {
            return rj(err);
          }
          rs(u);
        }
      );
    });
  }
).then(function () {
  return scope.dataSources.disconnect();
}).then(
  // Справились
  function () {
    console.info('Пользователь успешно зарегистрирован.');
    process.exit(0);
  }
).catch(function (err) {
  console.error(err);
  process.exit(130);
});
