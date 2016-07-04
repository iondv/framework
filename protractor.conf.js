'use strict';

exports.config = {
  // The address of a running selenium server.
  seleniumAddress: 'http://localhost:4444/wd/hub', // Используется для автономного запуска protracotr в директории
  // проекта, сервер должен быть предварительно запущен заранее,стационарно или например командо webdriver-manager start
  // Задается в gulp файле в аргументах запуска, может использоваться для атономного запуска protractor,
  // чтобы он сам запуска selenium. Нужно проверять корректность ссылки на файл, в т.ч. версию
  // seleniumServerJar: './node_modules/protractor/selenium/selenium-server-standalone-2.45.0.jar',
  // Локальный запуск без селениума, только драйвер броузера:
  // chromeOnly: true, chromeDriver: './node_modules/protractor/selenium/chromedriver',
  framework: 'mocha',
  // Capabilities to be passed to the webdriver instance.
  capabilities: {
    //  'browserName': 'firefox'
    browserName: 'chrome'
    // 'browserName': 'internet explorer'
  },

  // Spec patterns are relative to the current working directly when protractor is called.
  specs: ['./test/e2e/**/*.spec.js'],

  // The timeout in milliseconds for each script run on the browser. This should
  // be longer than the maximum time your application needs to stabilize between tasks.
  allScriptsTimeout: 60000,

  // How long to wait for a page to load.
  getPageTimeout: 60000,

  // A callback function called once configs are read but before any environment
  // setup. This will only run once, and before onPrepare.
  // You can specify a file containing code to run by setting beforeLaunch to
  // the filename string.
  beforeLaunch: function () {
    // At this point, global variable 'protractor' object will NOT be set up,
    // and globals from the test framework will NOT be available. The main
    // purpose of this function should be to bring up test dependencies.

  },

  // A callback function called once protractor is ready and available, and
  // before the specs are executed.
  // If multiple capabilities are being run, this will run once per
  // capability.
  // You can specify a file containing code to run by setting onPrepare to
  // the filename string.
  onPrepare: function () {
    // At this point, global variable 'protractor' object will be set up, and
    // globals from the test framework will be available. For example, if you
    // are using Jasmine, you can add a reporter with:
    //     jasmine.getEnv().addReporter(new jasmine.JUnitXmlReporter(
    //         'outputdir/', true, true));
    //
    // If you need access back to the current configuration object,
    // use a pattern like the following:
    //     browser.getProcessedConfig().then(function(config) {
    //       // config.capabilities is the CURRENT capability being run, if
    //       // you are using multiCapabilities.
    //       //console.log('Executing capability', config.capabilities);
    //     });
    /* Пример глобальных настроек
    global.chai = require('chai');
    global.chaiAsPromised = require('chai-as-promised');
    global.chai.use(chaiAsPromised);
    global.expect = chai.expect;
    global.writeScreenShot = require('./test/e2e/testE2Eutils');// Утилиты и функции тестов
    global.config = require('./test/e2e/config');// Конфигурация тестов */
    global.ionTest = {};
    let config =  require('app/config');
    let port = typeof config.port === 'object' ?  config.port[0] : config.port || 8888;
    global.ionTest.serverURL = process.env.ION_URL ? process.env.ION_URL :
                                                     config.appURL ? config.appURL + ':' + port :
                                                                     'http://localhost:' + port;
    console.info('Адрес портала для тестирования:', global.ionTest.serverURL);
    if (process.env.ION_USER && process.env.ION_PSW) {
      global.ionTest.auth = {username: process.env.ION_USER, password: process.env.ION_PSW};
    } else if (config.auth && config.auth.test) {
      global.ionTest.auth = config.auth.test;
    } else {
      global.ionTest.auth = {username: 'admin', password: '123'};
    }
    browser.ignoreSynchronization = true;// Позволяет работать со страницами без angular, но также не обеспечивает
    // автоматическое ожидание загрузки страницы, которое обеспечивает использование angular-a
  },

  // A callback function called once tests are finished.
  onComplete: function () {
    // At this point, tests will be done but global objects will still be
    // available.
  },

  // A callback function called once the tests have finished running and
  // the WebDriver instance has been shut down. It is passed the exit code
  // (0 if the tests passed). This is called once per capability.
  onCleanUp: function (exitCode) {

  },

  // A callback function called once all tests have finished running and
  // the WebDriver instance has been shut down. It is passed the exit code
  // (0 if the tests passed). This is called only once before the program exits (after onCleanUp).
  // //afterLaunch: function () {
  // //},

  // Options to be passed to Jasmine-node.
  jasmineNodeOpts: {
    showColors: true,
    defaultTimeoutInterval: 30000
  },
  mochaOpts: {
    reporter: 'spec',
    timeout: 5000, // Время ожидания шагов теста 60000 чтобы не вываливался при долгой загрузке страницы getPageTimeout
    // может задаваться в тесте так
    // this.timeout(10000), нужно чтобы на шаге можно было проверить загрузку элемент, для динамичных страниц.
    // enableTimeouts: false, //блокировать ограничение по времени для ожидания
    slow: 40000
  }
};
