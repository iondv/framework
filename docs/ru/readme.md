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

This page in [English](/README.md/)

<h1 align="center"> <a href="https://www.iondv.com/"><img src="/docs/ru/images/iondv_readme1.png" height="800px" alt="IONDV. Framework in numbers: rest api, soap, json, yaml, JavaScript - free open source web business application development" align="center"></a>
</h1>  

# IONDV. Framework 

IONDV. Framework - это опенсорный фреймворк на node.js для разработки учетных приложений 
или микросервисов на основе метаданных и отдельных модулей. Он является частью 
инструментальной цифровой платформы для создания enterprise 
(ERP) приложений состоящей из опенсорсных компонентов: самого [фреймворка](https://github.com/iondv/framework), 
[модулей](https://github.com/topics/iondv-module) и готовых приложений расширяющих его 
функциональность, визуальной среды [Studio](https://github.com/iondv/studio) для 
разработки метаданных приложений.

## Описание 

**IONDV. Framework** — это инструмент для создания веб-приложений, на основе метаданных без программирования. Можно изменять и дополнять систему с помощью наращивания дополнительной функциональности в виде модулей. Есть готовые модули, но ничто не ограничевает вас создать свои собственные и персонализировать приложение. 

Основное предназначение - реализация сложносоставных систем реестра данных. Основу функциональности составляет реестр данных — модуль Регистри. Это ключевой модуль, предназначенный непосредственно для работы с данными на основе структур метаданных – в том числе по ведению проектов, программ, мероприятий и др. 

**IONDV. Framework** это фреймворк с открытым исходным кодом на JavaScript и открытой структурой метаданных в формате JSON.

## Как спроектировать приложение?

**Что?**
Бизнес-приложение любого класса.

**Как?**
Описать данные и примененить готовые модули с возможностью корректировки под конкретные задачи.

`core + metadata + modules = application`

<h1 align="center"> <a href="https://www.iondv.com/"><img src="/docs/ru/images/app_structure1.png" height="500px" alt="Application structure - core, metadata, modules" align="center"></a>
</h1>  

В квадратных рамках - *ioncore*, *meta class*, *meta view*, *meta navigation* и *registry module* - это база простейшего приложения. Чуть ниже представлены дополнительные типы меты и модули. Они представляют собой дополнительную функциональность и применяются в соответствии с приложением. Зависимости приложения смотрим в файле `package.json`.

### Типичные приложения

Каркас для создания приложений, как уровня предприятия, так и узкофункциональных - от портала до аналитики:

- Управление документами;
- Бухгалтерский учет и отчетность;
- Управление ресурсами предприятия;
- Управление рабочим процессом и проектной деятельностью;
- Сбор данных;
- Бизнес-аналитика;
- Системная интеграция.

### Бесплатные демоверсии

Посмотрите наши демо уже сейчас:

* [Studio](https://studio.iondv.com/index) - специализированная IDE, помогающая ускорить и упростить разработку приложений на IONDV. Framework. [GitHub Репозиторий](https://github.com/iondv/studio). [Инструкция по созданию приложения при помощи ION. Studio](https://github.com/iondv/nutrition-tickets/blob/master/tutorial/ru/index.md)
* [DNT](https://dnt.iondv.com/auth) - наше приложение для разработки и тестирования, на основе которого внедряются и тестируются новые метакомпоненты. Практически все элементы системы находятся в приложении DNT.[GitHub Репозиторий](github.com/iondv/develop-and-test).
* [War Archive](https://war-archive.iondv.com/portal/index) - это программное решение на основе IONDV. Framework, реализованное для действующего проекта "Вспомнить каждого", цель которого оцифровать архивные документы, внести информацию в базу и обеспечить к ним свободный доступ. [GitHub Репозиторий](https://github.com/iondv/war-archive).
* [Project Management](https://pm-gov-ru.iondv.com) - это программное решение на основе IONDV. Framework, реализованное для организации проектной деятельности, целью которой является контроль результатов, соблюдение и сокращение сроков их достижения, эффективное использование временных, человеческих и финансовых ресурсов, принятие своевременных и обоснованных управленческих решений. [GitHub Repo](https://github.com/iondv/pm-gov-ru)
* [Telecom](https://telecom-ru.iondv.com) - это программное решение на основе IONDV. Framework, реализованное для организации учета, хранения и отображения данных о наличии услуг связи
(интернет, сотовая связь, телевидение, почта и др.) в населенных пукнтах региона. [GitHub Repo](https://github.com/iondv/telecom-ru)
* CRM - *скоро на GitHub*.

Логин для доступа - demo, пароль - ion-demo. Регистрация не требуется.

## Функциональные возможности  

**IONDV. Framework** обеспечивает реализацию следующей функциональности:

- обеспечение трансляции описательных метаданных в структуру хранения данных в СУБД;
- обеспечение функциональности работы с различными СУБД (ORM технологию);
- обеспечение авторизации в системе с различными политиками, по умолчанию oath2, с открытым конфигурируемым API для подключения авторизационных модулей библиотеки passport обеспечивает до 500 различных политик авторизации;
- обеспечение безопасности доступа к данным – статической к типам данных, к навигации, к этапам бизнес-процессов, к действиям на форме; динамической – через условия в данных, которым должен соответствовать профиль текущего пользователя (принадлежность к подразделению или организации указанной в объекте, группе или другим условиям); через url; обеспечение исключения в авторизации и безопасности по url или для специального пользователя;
- подключение модулей, обеспечивающих дополнительную функциональность и реализуемую через доступ к интерфейсам (API) ядра;
- обеспечение импорта, экспорта данных в системе, метаданных, безопасности из файлов;
- обеспечение взаимодействия с файловой системой для хранения данных, в том числе с внешними файловыми хранилищами, такими как nextcloud;
- расчет значения с формулами и кэширование этих данных;
- обеспечение жадной загрузки данных и их фильтрации в связанных коллекциях;
- кэширование запросов и сессий в memcached, redis;
- выполнение задач по расписанию;
- уведомление пользователей по событиям.

Подробнее о функциональных возможностях фреймворка и его модулей можно узнать [здесь](/docs/ru/key_features.md).

## Быстрый старт

Вы можете посмотреть собранные приложения, развернутые в облаке или получить продукты для изучения другим способом на [сайте фреймворка](https://iondv.com), в том числе:
* инсталятор для операционной системы Linux
* клонирование репозитория и установка всех компонентов
* docker-контейнер с собранным приложением
* архив с собранным приложением

### Cистемное окружение

Запуск фреймворка осуществляется в среде [Node.js](<https://nodejs.org/en/>) версии 10.x.x.

Для хранения данных необходимо установить и запустить [MongoDb](https://www.mongodb.org/) версии 3.6.

### Установщик

Вы можете использовать установщик приложений IONDV. Framework [iondv-app](https://github.com/iondv/iondv-app), требующий установленных node, mongodb и git. 
В ходе установки будет проверены и установлены все остальные зависимости, а также собрано и запущено само приложение.

Установка в одну строку:

```
bash <(curl -sL https://raw.githubusercontent.com/iondv/iondv-app/master/iondv-app) -t git -q -i -m localhost:27017 develop-and-test
```

Где параметры для iondv-app `localhost:27017` адрес многодб, а `develop-and-test` название приложения. После запуска открыть ссылку 'http://localhost:8888', учетная запись бек офиса **demo**, пароль **ion-demo**.


Также другой способ заключается в клонировании - (`git clone https://github.com/iondv/iondv-app.git`) и установите приложение с помощью команды `bash iondv-app -m localhost:27017 develop-and-test`.

Можно также собрать приложение в докер конейтнерах, тогда из окружения нужен только docker и СУБД mongodb в докер контейнере. Подробнее на странице сборщика приложения  IONDV. Framework [iondv-app](https://github.com/iondv/iondv-app)

<details>
  <summary> 
    <h3> 
      Сборка приложения из репозитория
    </h3> 
  </summary>

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
db.uri=mongodb://127.0.0.1:27017/db
server.ports[]=8888
module.default=registry
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

Добавьте пользователю права администратора командой `node bin/acl.js --u admin@local --role admin --p full`.

### Запуск

Запустите приложение командой в папке ядра `npm start`. 

Откройте браузер с адресом `http://localhost:8888` и авторизуйтесь в приложении , где `8888` - порт указанный в параметре server.ports конфигурации запуска.

</details>

### Docker

Запуск приложения с использованием докер контейнера:

1. Запустите СУБД mongodb: `docker run --name mongodb -v mongodb_data:/data/db -p 27017:27017 -d mongo`
2. Запустите IONDV. develop-and-test  `docker run -d -p 80:8888 --link mongodb iondv/develop-and-test`.
3. Откройте ссылку `http://localhost` в браузере через минуту (время требуется для инициализации данных). Для бек офиса логин: **demo**, пароль: **ion-demo** 


## Документация 

Документация по платформе IONDV.Framework доступна на двух языках  - [русский](index.md) и [english](/docs/en/index.md).

## Ссылки

Ниже представлены ссылки на дополнительную информацию по разработке приложений с использованием IONDV.Framework.
* [Документация](index.md)
* [Домашняя страница фреймворка](https://iondv.com/)
* Обратная связь на [Facebook](https://www.facebook.com/iondv/)


--------------------------------------------------------------------------  


#### [License](/LICENSE) &ensp;  [Contact us](https://iondv.com/portal/contacts) &ensp;  [English](/README.md)   &ensp; 
<div><img src="https://mc.iondv.com/watch/local/docs/framework" style="position:absolute; left:-9999px;" height=1 width=1 alt="iondv metrics"></div>         

--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.  
All rights reserved. 


