# IONPortal
## Статус проверки мастер ветки
[![build status](http://192.168.0.222/ci/projects/1/status.png?ref=master)](http://192.168.0.222/ci/projects/1?ref=master)
## Проектная WIKI
[Описание деталей, приведено в проектной wiki](http://git.iondv.ru/ION/ion-portal/wikis/home)

------
**TODO**
Установка с дистрибутива
nmp install
gulp db:init
npm start


## Резюме
Для любой установки (дистрибутив или разработка) ожидаем, что на машине установлены, прописаны в путях и 
сконфигурированы нижеследующие модули, при этом звездочкой* обозначены обязательные для установки пакетов 
и продуктивного запуска, без сборки и тестирования:
* node.js*
* MongoDB*
* memcached*
* python*
* компилятор* для среды (gcc для linux, MSVS2013e для windows)
* GraphicsMagick Image Processing System* - для обработки изображений
* jre - для Silenium server-а, используемого для e2e тестирования

Установлены глобально библиотеки node.js
* node-gyp*: `npm install -g node-gyp`
* gulp: `npm install -g gulp`
* bower: `npm install -g bower`

Для тестирования дополнительно необходимо установить глобально компоненты node.js:
* mocha: `npm install -g mocha`
* protractor: `npm install -g protractor`
* Silenium сервер для protractor: `webdriver-manager update`
* JSHint, JSCS и jscs-jsdoc: `npm install -g jshint jscs jscs-jsdoc`
* phantomjs - браузер без отобржаения страниц, для работы из кода и тестирования JS: `npm install -g phantomjs`
* chai: `npm install -g chai`
* karma - модуль запуска тестов: `npm install -g karma`
* модули для karma - karma-chai, karma-coverage, karma-mocha, karma-phantomjs-launcher:
`npm install -g karma-mocha karma-chai karma-coverage karma-phantomjs-launcher`

Перед запуском портала запущены:
* mongodb://localhost:27017/ion - монгоДБ*
* 127.0.0.1:11211 - memcached*
* http://localhost:4444/wd/hub - силениум сервер для e2e тестов

Для установки и запуска из дистрибутива необходимо установить только пакеты
* `npm install --production` - если только для продуктивно запуска (также необходимо выполнить эту команду в КАЖДОМ из 
модулей в папке `/modules/*`
* `npm start`

Для запуска версии полученной из репозитория.
* Клонировать версию из репозитория `git clone http://192.168.0.222/ION/ion-portal.git ion-portal`
* Клонировать все необходимые модули, для чего:
  * Перейти в папку модулей cd ion-portal\modules 
  * Клонировать модуль - название папки модуля должно быть правильным, т.е. находится после 
  portal-modules-[название модуля], например для модуля ionadmin в папке модулей 
  `git clone http://192.168.0.222/ION/portal-modules-ionadmin.git ionadmin`
* Перед первым запуском проведена инициализация всех пакетов `npm install`, а также инициализация производится в папках
всех модулей
* В дальнейшем (при запущенных компонентах ДБ, мемкешед, силениум - см.выше), после клонирования и инициализации пакетов
всех необходимых модулей в папке портала, выполняем `gulp build`. При этом:
  * Если необходимо залить примеры, нужно установить переменную окружения ION_INIT=example
  * Если необходимо сбрасывать БД перед инициализацией, нужно установить переменную окружения ION_INIT=drop
  * Если необходимо сбрасывать БД и заливать примеры при инициализациеи - , нужно установить переменную окружения 
  ION_INIT=drop&example
* Для старта выполняем `npm start`
* Для тестов `npm test` или `gulp test`

Портал в продуктивном режиме запускается по адресу http://localhost:8888/
Есил установлена NODE_ENV=DEVELOPMENT (при запуке из IDE)- то по адресу http://localhost:3000/


