/**
 * Подключине базовых модулей express
 *
 * TODO
 * 2. Парсить ссесию, если нужно
 * 3. Кэшировать запросы и отдавать закэшированное модулями, без их вызова.
 *
 */

'use strict';

var debug = require('debug-log')('ION:app:main');

var express = require('express');

var assert = require('chai').assert;
// Не используется пока
// var async = require('async');

// 2del - старая модель var ContentModel = xreq.models('ContentModel');

// Работа с файлами
var path = require('path');
var fs = require('fs');

// Возвращает favicon
var favicon = require('serve-favicon');

// Ротация логов или обычный логгер для developer режима
var FileStreamRotator = require('file-stream-rotator');
var logger = require('morgan');

// CHECKME проверить, что не требуется, при использовании express-session
// var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

// Поддержка PUT и DELETE
var methodOverride = require('method-override');

// Для загрузки файлов на сервер
// var multer = require('multer');

// Конфиг
var config = require('app/config');

// Layot для шаблонизатора eJS
var ejsLocals = require('ejs-locals');

var Datasources = require('core/datasources');
var AclMediator = require('core/access');
var MetaRepository = require('core/impl/meta/DsMetaRepository');
var DataRepository = require('core/impl/datarepository/ionDataRepository');
var KeyProvider = require('core/impl/meta/MongoMetaKeyProvider');

/**
 * @type {Datasources}
 */
global.ionDataSources = new Datasources(config);

/**
 * @type {AclMediator}
 */
global.ionAcl = new AclMediator(config);

/**
 * Основная функция инициализации приложения
 *
 * resolve - промизе при положеительном результате, содержит объект app фреймворка express
 * reject - промизе при отрицательном результате, содержит объект e с ошибкой
 */
var initAppPromise = new Promise(function (resolve, reject) {
  try {
    debug.log('Инициируем приложение');
    var app = express();
    // Необходимо выполнять, при работе через прокси Varnish or Nginx - для получения IP клиента
    // CHEKME!!! ВОЗХМОЖНО МЕШАЕТ ССЕСИЯМ
    app.enable('trust proxy');

    /**
     * Middleware - предваительные обработчики запросов, для последующего использования всеми
     * контроллерами, вызываемые из роутов
     */
    if (process.env.NODE_ENV !== 'development') { // Продкутивный режим в NODE_ENV
      /* Ротация логов. Если нужны логи в один файл
       * var accessLogStream = fs.createWriteStream(__dirname + '/access.log', {flags: 'a'})  */
      var logDirectory = path.join(__dirname, '../log');
      if (!fs.existsSync(logDirectory)) {
        var resMkDir = fs.mkdirSync(logDirectory);
        debug.log('Результат создания папки для логов:', logDirectory, resMkDir);
      }
      var accessLogStream = FileStreamRotator.getStream({ // FIXME глюк какой-то поминутно файлы ротирует
        filename: path.join(logDirectory, '/access-%DATE%.log'),
        frequency: 'daily',
        verbose: false
      });
      debug.log('Файл записи логов:', accessLogStream.filename);
      app.use(logger('combined', {stream: accessLogStream})); // Записывать логи в файл
    } else { // Режим разработки, NODE_ENV === development
      app.use(logger('dev'));// Писать инф.о коннекте для разработчика с временем выполнения
      // FIXME старый вызов, подправить.
      // app.use(express.errorHandler());
    }
    app.use(favicon(path.join(__dirname, '../public/favicon.ico')));

    // Поддержка put и deletes
    // override with different headers; last one takes precedence
    app.use(methodOverride('X-HTTP-Method'));       // Microsoft
    app.use(methodOverride('X-HTTP-Method-Override')); // Google/GData
    app.use(methodOverride('X-Method-Override'));      // IBM

    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({extended: true}));

    // FIXME сохраняет все пришедшие файлы в папке uploads. Если вставить в модуль после роутера не сохраняет, т.к. app ему
    // не передается. Нужно сохранять по идее только если включен модуль uploads
    /*
     2del app.use(multer({
     // FIXME чтобы пользователи не перетерали файлы друг-друга. Нужно создавать подпапки по ссессии или логину или
     // подобным образом. Файлы в подпапке дальше при обработке нужно переносить в другие места.
     dest: path.join(__dirname, '../private/uploads/'),  rename: function (fieldname, filename) {
     return filename.replace(/\W+/g, '-').toLowerCase();
     }
     }));*/
    resolve(app);
  } catch (e) {
    debug.error('Ошибка инициализации приложения express:', e);
    reject(e);
  }
});

/**
 * Подключаем шаблонизаторы
 *
 * @param {Object} app - объект express приложения
 * @returns {Object} resolve - промизе при положеительном результате, содержит объект app фреймворка express
 *                     reject - промизе при отрицательном результате, содержит объект e с ошибкой
 */
function initTemplatesPromise(app) {
  debug.log('Подключаем шаблоны');
  return new global.Promise(function (resolve, reject) {
    try {
      app.engine('ejs', ejsLocals);// INFO если layout для каркаса страниц не используется, можно отключить
      app.set('views', path.join(__dirname, '../private/templates'));
      // По умолчанию используется ejs, остальные задаются расширением. Пример
      // router.get('/jade', function(req, res, next) {res.render('home.jade', { title: 'Express.jade' });});
      app.set('view engine', 'ejs');
      resolve(app);
    } catch (e) {
      debug.error('Ошибка инициализации шаблонов express:', e);
      reject(e);
    }
  });
}

/**
 * Редирект по умолчанию - перенаправляем запрос корня на основной модуль
 *
 * @param {Object} app - объект express приложения
 * @returns {Object} resolve - промизе при положеительном результате, содержит объект app фреймворка express
 *                     reject - промизе при отрицательном результате, содержит объект e с ошибкой
 */
function redirectRootPagePromise(app) {
  return new global.Promise(function (resolve, reject) {
    try {
      if (config.content.homeRedirect) {
        debug.log('Устанавливаем переадресацию запроса корня на адрес:', config.content.homeRedirect);
        app.get('/', function (req, res, next) {
          res.redirect(config.content.homeRedirect);
        });
        resolve(app);
      } else {
        debug.log('Нет установки переадресации запроса корня');
        resolve(app);
      }
    } catch (e) {
      debug.error('Ошибка инициализации редиректа корневой страницы:', e);
      reject(e);
    }
  });
}

/**
 * Подключаем статичные страницы - перенаправляем запрос корня на основной модуль
 *
 * @param {Object} app - объект express приложения
 * @returns {Object} resolve - промизе при положеительном результате, содержит объект app фреймворка express
 *                     reject - промизе при отрицательном результате, содержит объект e с ошибкой
 */
function staticPagePromise(app) {
  var staticPagePath = path.join(__dirname, '../public');
  debug.log('Подключаем обработчик статичных страниц для пути:', staticPagePath);
  return new global.Promise(function (resolve, reject) {
    try {
      app.use(express.static(staticPagePath));
      resolve(app);
    } catch (e) {
      debug.error('Ошибка инициализации обработки статичных страниц:', e);
      reject(e);
    }
  });
}

function initDataSources(app) {
  return new global.Promise(function (resolve, reject) {
    debug.info('Соединяемся с источниками данных');
    global.ionDataSources.connect().then(
      function () {
        var gds = global.ionDataSources.get(config.globalDs);
        app.locals.db = gds.connection();
        try {
          global.metaRepo = new MetaRepository({
            Datasource: gds,
          });
        } catch (err) {
          return reject(err);
        }

        global.metaRepo.init().then(function(){
          var keyProvider = new KeyProvider(global.metaRepo, app.locals.db);
          global.dataRepo = new DataRepository(gds, global.metaRepo, keyProvider);
          resolve(app);
        }).catch(reject);
      }
    ).catch(reject);
  });
}

/**
 * Получение списка модулей
 * @param {Object} app - объект express приложения
 * @returns {Object} resolve - промизе при положеительном результате, содержит объект app фреймворка express
 *                   reject - промизе при отрицательном результате, содержит объект e с ошибкой
 */

function getModulesNamePromise(app) {
  return new Promise(function (resolve, reject) {
    try {
      debug.info('Загружаем конфигруацию моделей');

      var appMetaDs = global.ionDataSources.get(config.appStructDs);
      if (!appMetaDs) {
        throw new Error('Не указан источник данных для сессий!');
      }

      appMetaDs.fetch('ion_modules', {})
        .then(function (listRouts) {
          if (typeof app.locals.ionModules === 'undefined') {
            app.locals.ionModules = {};
          }
          for (var key in listRouts) {
            if (listRouts.hasOwnProperty(key)) {
              try {
                assert.isString(listRouts[key].name);
                // Сохраняем, для последующего использования в авторизации
                app.locals.ionModules[listRouts[key].name] = listRouts[key];
              } catch (e) {
                debug.error('Ошибка подключения модулей', e); // Или выходить совсем, тогда try/catch не нужен?
                // Но так можно перегрузить список, без выхода, если добавить функцию очищения у app.use
              }
            }
          }
          debug.log('Список модулей:', Object.keys(app.locals.ionModules).toString());
          resolve(app);
        })
        .catch(reject);
    } catch (e) {
      debug.error('Ошибка конфигурирования модулей', e);
      reject(e);
    }
  });
}

module.exports.initApp = initAppPromise;
module.exports.initDs = initDataSources;
module.exports.initTemplates = initTemplatesPromise;
module.exports.redirectRootPage = redirectRootPagePromise;
module.exports.staticPage = staticPagePromise;
module.exports.getModulesName = getModulesNamePromise;
module.exports.onStop = function(){ global.ionDataSources.disconnect(); };
