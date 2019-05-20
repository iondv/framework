<h1 align="center"> <a href="https://www.iondv.com/"><img src="/docs/ru/images/ION_logo_black_mini.png" alt="IONDV. Framework logo" width="600" align="center"></a>
</h1>  

<h4 align="center">JS framework for rapid business application development</h4>
  
<p align="center">
<a href="http://www.apache.org/licenses/LICENSE-2.0"><img src="https://img.shields.io/badge/license-Apache%20License%202.0-blue.svg?style=flat" alt="license" title=""></a>
</p>

<div align="center">
  <h3>
    <a href="https://www.iondv.com/" target="_blank">
      Website
    </a>
    <span> | </span>
    <a href="https://www.iondv.com/portal/get-it" target="_blank">
      Get it Free
    </a>
    <span> | </span>
    <a href="https://github.com/iondv/framework/docs/en/index.md" target="_blank">
      Documentation
    </a>
  </h3>
</div>

<p align="center">
<a href="https://twitter.com/ion_dv" target="_blank"><img src="/docs/ru/images/twitter.png" height="36px" alt="" title=""></a>
<a href="https://www.facebook.com/iondv/" target="_blank"><img src="/docs/ru/images/facebook.png" height="36px" margin-left="20px" alt="" title=""></a>
<a href="https://www.linkedin.com/company/iondv/" target="_blank"><img src="/docs/ru/images/linkedin.png" height="36px" margin-left="20px" alt="" title=""></a>
<a href="https://www.instagram.com/iondv/" target="_blank"><img src="/docs/ru/images/Insta.png" height="36px" margin-left="20px" alt="" title=""></a> 
</p>

# IONDV. Framework 

This page in [English](/README.md/)

<h1 align="center"> <a href="https://www.iondv.com/"><img src="/docs/ru/images/iondv_readme1.png" alt="IONDV. Framework in numbers: rest api, soap, json, yaml, JavaScript - free open source web business application development" align="center"></a>
</h1>  

## Описание 
**IONDV.Framework** — это инструмент для создания веб-приложений, на основе метаданных и без программирования. Можно изменять и дополнять систему с помощью наращивания дополнительной функциональности в виде модулей. Есть готовые модули, но ничто не ограничевает вас создать свои собственные и персонализировать приложение. 

Основное предназначение - реализация сложносоставных систем реестра данных. Основу функциональности составляет реестр данных — модуль Регистри. Это ключевой модуль, предназначенный непосредственно для работы с данными на основе структур метаданных – в том числе по ведению проектов, программ, мероприятий и др. IONDV.Framework это открытый исходный код на JavaScript и открытая структура метаданных в формате JSON.

**Типичные приложения**:
* система управления проектами предприятия;
* реестры учета и обработки данных на основе бизнес-процессов;
* CRM - система управления отношениями с клиентами.

**Структура типичного приложения**

`core + metadata + modules`

<h1 align="center"> <a href="https://www.iondv.com/"><img src="/docs/ru/images/app_structure.png" alt="Application structure - core, metadata, modules" align="center"></a>
</h1>  

В квадратных рамках - ioncore, meta class, meta view, meta navigation и registry module - это база простейшего приложения. Чуть ниже представлены дополнительные типы меты и модули. Они представляют собой дополнительную функциональность и применяются в соответсвии с приложением. Зависимости приложения смотрим в файле `package.json`.

## Демо приложения

## Функциональные возможности  

* создание произвольных многопользовательских систем учета данных
* распределение доступа и безопасность данных
* управление данными на основе бизнес-процессов
* формирование отчетов и аналитики
* возможность визуализации данных на геослое
* возможность произвольного представления данных в виде портальных форм
* простая интеграция данных по REST и SOAP 

## Быстрый старт с использованием репозитория

Вы можете посмотреть собранные приложения, развернутые в облаке или получить продукты для изучения другим способом на [сайте фреймворка](https://iondv.com), в том числе:
* инсталятор для операционной системы Windows
* архив с собранным приложением
* docker-контейнер с собранным приложением

### Cистемное окружение

Запуск фреймворка осуществляется в среде [Node.js](<https://nodejs.org/en/>) версии 10.x.x.

Для хранения данных необходимо установить и запустить [MongoDb](https://www.mongodb.org/) версии 3.6.

### Глобальные зависимости

Для сборки компонентов и библиотек фреймворка необходимо установить глобально:
* пакет [node-gyp](<https://github.com/nodejs/node-gyp>) `npm install -g node-gyp`. Для работы библиотеки под операционной системой семейства windows дополнительно необходимо установить пакет windows-build-tools `npm install -g --production windows-build-tools`.
* пакет сборщика проектов [Gulp](<http://gulpjs.com/>) `npm install -g gulp@4.0`. `4.0` - поддерживаемая версия `Gulp`.
* менджер пакетов фронтенд библиотек [Bower](<https://bower.io>) `npm install -g bower`.

### Установка ядра, модулей и приложения

Рассматриваем на примере приложения `develop-and-test`. На месте приложения `develop-and-test` в пути может быть указано `namespace`. Это значит, что необходимо самостоятельно проставить название приложения в путь, вместо `namespace`. Находим приложение `develop-and-test` в репозитории.   
Смотрим зависимости указаные в файле `package.json`.   

```
   "engines": {
    "ion": "1.24.1"
  },
  "ionModulesDependencies": {
    "registry": "1.27.1",
    "geomap": "1.5.0",
    "graph": "1.3.2",
    "portal": "1.3.0",
    "report": "1.9.2",
    "ionadmin": "1.4.0",
    "dashboard": "1.1.0",
    "lk": "1.0.1",
    "soap": "1.1.2",
    "gantt-chart": "0.8.0"
  },
  "ionMetaDependencies": {
    "viewlib": "0.9.1"
    "viewlib-extra": "0.1.0"

```
* Начинаем установку с ядра, версия которого указана в парметре `engines": {"ion": "1.24.1"}`. Скопируйте адрес репозитория ядра и в командной строке выполните комманду `git clone https://github.com/iondv/framework`. Перейдите в папку ядра, переключитесь на tag номера версии `git checkout tags/v1.24.1`.
* После этого устанавливаются необходимые для приложения модули, указанные в параметре `"ionModulesDependencies"`. Модули устанавливаются в папку `modules` ядра, для этого пейдите в неё командой `cd modules`. Клонируем модули из списка `"ionModulesDependencies"`, для модуля registry это осуществляется коммандой `git clone https://github.com/iondv/registry`. Перейдите в папку установленного модуля, переключитесь на tag номера версии `git checkout tags/v1.27.1`. Повторите для каждого модуля.
* Установка самого приложения осуществляется в папку `applications`, для этого перейдите в неё командой  `cd ..\applications`, если вы находитесь в папке модулей. Установку выполните клонированием репозитория коммандой `git clone https://github.com/iondv/dnt_ru`. Перейдите в папку установленного приложения, переключитесь на tag номера версии `git checkout tags/v1.17.0`
* После этого установите дополнительно необходимые приложения из параметра `"ionMetaDependencies"`. Установка осуществляется в папку `applications`, для установки необходимо убедиться, что находитесь в папке приложений. Клонируем приложения из списка в параметре  `"ionMetaDependencies"`, для приложения `viewlib` осуществляется командой `https://github.com/iondv/viewlib`.  Перейдите в папку установленного приложения, переключитесь на tag номера версии `git checkout tags/v0.9.1`. Повторите для каждого приложения.

### Сборка, конфигрурирование и развертывание приложения

Сборка приложения обеспечивает установку всех зависимых библиотек, импорт данных в базу данных и подготовку приложения для запуска.  

Создайте конфигурационный файл `setup.ini`  в папке `config` ядра для задания основных параметров окружения приложения. 

```
auth.denyTop=false 
auth.registration=false 
auth.exclude[]=/files/**
auth.exclude[]=/images/**
db.uri=mongodb://127.0.0.1:27017/db
db.user=username
db.pwd=password
server.ports[]=8888
server.ports[]=8889
server.ports[]=3000
module.default=registry
module.skip[]=offline-sync
fs.storageRoot=./files
fs.urlBase=/files

```
Открываем файл в редакторе и вставляем содержимое. Самый главный параметр `db.uri=mongodb://127.0.0.1:27017/ion-dnt` он указывает на название базы которую мы будем использовать для приложения. База данных будет создана автоматически.  

Задайте переменную окружения NODE_PATH равной пути к ядру приложения следующей командой `set NODE_PATH=c:\workspace\dnt` для Windows и `export NODE_PATH=/workspace/dnt` для Linux, где `workspace\dnt` - папка файлов ядра приложения.    

При первом запуске необходимо выполнить `npm install` - она поставит ключевые зависимости, в том числе локально сборщик `gulp`. Убедитесь, что версия `Gulp` - `4.0`.

Далее выполните команду сборки приложения `gulp assemble`. 

Если вы хотите выполнить импорт данных в вашем проекте, проверьте папку `data` в приложении и выполните команду:
`node bin/import-data --src ./applications/develop-and-test --ns develop-and-test`

Добавьте пользователя admin с паролем 123 командой `node bin\adduser.js --name admin --pwd 123`.

Добавьте пользователю права администратора командой `node bin\acl.js --u admin@local --role admin --p full`.

### Запуск

Запустите приложение командой в папке ядра `npm start`. 

Откройте браузер с адресом `http://localhost:8888` и авторизуйтесь в приложении , где `8888` - порт указанный в параметре server.ports конфигурации запуска.

### Docker
Для запуска приложений с докер контейнера, следуйте следующим инструкциям на примере приложения `develop-and-test`:

1. Запустите СУБД mongodb

```bash
docker run  --name mongodb \
            -v mongodb_data:/data/db \
            -p 27017:27017 \
            --restart unless-stopped \
            -d \
            mongo
```

2. Разверните **IONDV. Develop-and-test** и вспомогательные приложения (import и setup должны быть выполенны для всех приложений)
```bash
docker run --entrypoint="" --link mongodb --rm iondv/dnt node bin/import --src ./applications/develop-and-test --ns develop-and-test
docker run --entrypoint="" --link mongodb --rm iondv/dnt node bin/setup develop-and-test --reset
docker run --entrypoint="" --link mongodb --rm iondv/dnt node bin/setup viewlib
```

Если вы хотите импортированных данные в ваше проект, проверьте папку с демо данными `data` в приложении и выполните команду:
```bash
docker run --entrypoint="" --link mongodb --rm iondv/dnt node bin/import-data --src ./applications/develop-and-test --ns develop-and-test
```

3. Создайтей пользователя `admin` с паролем `123` и ролью `admin`
```
docker run --entrypoint="" --link mongodb --rm iondv/dnt node bin/adduser --name admin --pwd 123
docker run --entrypoint="" --link mongodb --rm iondv/dnt node bin/acl --u admin@local --role admin --p full
```

4. Запустите приложение
```
docker run -d -p 80:8888 --name dnt --link mongodb iondv/dnt
```

Откройте в браузере `http://localhost/`.


## Документация 

Документация по платформе IONDV.Framework доступна на двух языках  - [русский](/docs/ru/index.md) и [english](/docs/en/index.md).

## Ссылки

Ниже представлены ссылки на дополнительную информацию по разработке приложений с использованием IONDV.Framework.
* [Руководство пользователя](/docs/ru/manuals/user_manual.md)
* [Руководство разработчика](/docs/ru/manuals/dev_manual.md)
* [Домашняя страница фреймворка](https://iondv.com/)
* Обратная связь на [stack overflow](https://stackoverflow.com/questions/tagged/iondv)


--------------------------------------------------------------------------  


#### [Licence](/LICENSE) &ensp;  [Contact us](https://iondv.com) &ensp;  [English](/README.md)   &ensp; [FAQs](/faqs.md)
<div><img src="https://mc.iondv.com/watch/local/docs/framework" style="position:absolute; left:-9999px;" height=1 width=1 alt="iondv metrics"></div>         

--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.  
All rights reserved. 


