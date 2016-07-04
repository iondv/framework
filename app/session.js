/**
 * Подключение сессий
 */
'use strict';

var debug = require('debug-log')('ION:app:session');
var config = require('app/config');

// Параметры сессий
var session = require('express-session');
var flash = require('connect-flash');
var sessionOptions = config.session;

// Сервер mem-cached // TODO работает?
// var MemcachedStore = require('connect-memcached')(session);
var MongoStore = require('connect-mongo')(session); // Завязка на MongoDB (а если MySQL), переделывать на MEMCACHED

function initSessionPromise(app) {
  return new global.Promise(function (resolve, reject) {
    debug.log('Подключаем работу с сессиями');
    try {
      var sessDs = global.ionDataSources.get(config.sessionDs);
      if (!sessDs) {
        throw 'Не указан источник данных для сессий!';
      }
      var c = sessDs.connection();
      // 2del if (app.get('env') !== 'development') { // Продкутивный режим в NODE_ENV?
      // TODO проверить, что работает memcahed
      // sessionOptions.store = new MemcachedStore(config.memcached);
      sessionOptions.store = new MongoStore({ // TODO передавать уже открытый коннект?
        // Если инициировать самстоятелно, то коннект не закрыт - тесты валятся (не выходят)
        // и так долго на каждый запрос - открывать коннект
        db: c,
        //  Доп.параметры
        //  url: config.mongodb.uri,
        //  mongoOptions: config.mongodb.options,
        ttl: 14 * 24 * 60 * 60 // = 14 days. Default
      });
      // }
      app.use(session(sessionOptions));
      app.use(flash());
      resolve(app);
    } catch (e) {
      debug.error('Ошибка подключения сесссий:', e);
      reject(e);
    }
  });
}

module.exports.initSession = initSessionPromise;
