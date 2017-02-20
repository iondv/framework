/**
 * Created by krasilneg on 17.02.17.
 */
const config = require('../config');
const di = require('core/di');
const IonLogger = require('core/impl/log/IonLogger');
const sysLog = new IonLogger({});

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
    var mongo = scope.Db.connection();
    return new Promise(function (resolve, reject) {
      mongo.collection('__autoinc', {strict: true},
        function (err, c) {
          c.dropIndex('type_1', function (err) {
            c.deleteMany({__type: {$exists: true}}, {}, function (err) {
              c.find().toArray(function (err, docs) {
                var w = [];
                docs.forEach(function (doc) {
                  w.push(new Promise(function (resolve, reject) {
                    c.updateOne(
                      {type: doc.type},
                      {$set: {__type: doc.type}, $unset: {type: ''}},
                      {},
                      function (err) {
                        if (err) {
                          return reject(err);
                        }
                        console.log('Изменен ключ счетчика коллекции ' + doc.type);
                        resolve();
                      }
                    );
                  }));
                });
                Promise.all(w).then(resolve).catch(reject);
              });
            });
          });
        }
      );
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