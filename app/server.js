/**
 * Функции инициализации сервера
 */

'use strict';

var debug = require('debug-log')('ION:server');
var xreq = require('xreq'); // Подключаем модуль для базовых путей
// Конфиг
var config = xreq.app('config');

// Модуль работы с http
var http = require('http');

var cfgPort; // Переменная с текущим значением запуска порта сервера
var cfgPortSeq; // Если переменная определена - то массив портов, при занятом порте - запускаем другие.
// Если не определена - единичное значение порта

/**
 * Функция инициализация сервера - загружает также все параметры обработки в /app/main
 */
function createServerPromise(onStop) {
  return function(app) {
    debug.log('Создаем сервер');
    var server = http.createServer(app);// Создаем HTTP сервер.
    server.on('error', onError);
    server.on('listening', onListening);
    server.on('close',onStop);
    return server;
  }
}

/**
 * Функция запуска сервера на указанном порту
 * @param curPort - порт запуска
 */

function startServerPromise(server) {
  debug.log('Запускаем сервер');
  return new Promise(function (resolve, reject) {
    startServerOnPort(server, function (err, port) {
      if (err) {
        reject (err);
      } else {
        // TODO нужно сохранять значение порта в Express?
        //        app.set('port', port);
        resolve(server);
      }
    });
  });
}

function startServerOnPort(server, port, callback) {
  if (typeof port === 'function') {
    callback = port;
    // Получаем порт из конфига или окружения
    if (typeof config.port === 'object') {// Если в конфигурации указан массив, а не один порт
      cfgPortSeq = 0;
      cfgPort = config.port[cfgPortSeq];
    } else {
      cfgPort = config.port;
    }
    debug.log('Стартовый порт заданный в конфигурации:', cfgPort);
    port = normalizePort(cfgPort || process.env.PORT || 8888);// Берет порт из конфига, окружения или по умолчанию
  }
  server.listen(port, // Слуашем порт, на всех интерфейсах: server.listen(port, [hostname], [backlog], [callback])
    function (err) {
      callback(err, port);
    });
}

/**
 * Открыть соединение на следующим порту из массива портов, указанных в конфигурации
 */

function nextPort(server) {
  cfgPortSeq++;
  cfgPort = config.port[cfgPortSeq];
  debug.log('Проверяем следующий порт конфигурации:', cfgPort);
  if (cfgPort) {
    var port = normalizePort(cfgPort);
    startServerOnPort(server, port, function(){});
  } else {
    debug.error('Все порты из конфигурации уже используются');
    process.exit(1);
  }
}

/**
 * Нормализуем порт в число, строку (pipe) или выдаем false
 * @param val - порт для проверки
 */

function normalizePort(val) {
  var normPort = parseInt(val, 10);
  if (isNaN(normPort)) {    // Named pipe
    return val;
  }
  if (normPort >= 0) {    // Port number
    return normPort;
  }
  debug.error('Не может быть определен порт');
  return false;
}

/**
 * Слушатель HTTP сервера на сообщения об ошибках по событию "error".
 * @param error - сообщение об ошибке
 */

function onError(error) {
  var _this = this;
  if (error.syscall !== 'listen') {
    throw error;
  }
  var bind = typeof cfgPort === 'string' ?
  'Поток (pipe) ' + cfgPort :
  'Порт ' + cfgPort;
  switch (error.code) {
    case 'EACCES':
      debug.error(bind + ' требует дополнителных прав доступа');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      // Переменная cfgPortSeq определяется, если в конфиге задан массив портов - запуск нескольких процессов сервера
      if (cfgPortSeq === undefined) {
        debug.error(bind + ' уже используется');
        process.exit(1);
      } else {
        nextPort(_this);
      }
      break;
    default:// Действия сервера, при ошибке кода.
      debug.error('Ошибка при выполнении приложения: ');
      console.dir(error); // Генерит стек когда страница не найдена? //
    // Вываливаться из приложения, если ошибка. Чтобы портал продолжал работать, нужно игонировать
    // throw error;
  }
}

/**
 * Слушатель HTTP сервера о сообщении начала обработки запросов по событию "listening".
 */

function onListening(server) {
  var _this = this;

  var addr = _this.address();
  var bind = typeof addr === 'string' ?
  'pipe ' + addr :
  'port ' + addr.port;
  debug.info('Слушается порт: ' + bind);
}

module.exports.createServer = createServerPromise;
module.exports.startServer = startServerPromise;
