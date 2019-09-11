#### [Оглавление](/docs/ru/index.md)

### Предыдущая страница: [Зависмости в package.json](docs/ru/2_system_description/platform_configuration/package.md)

# Способы конфигурации параметров:

* через ini-файлы
* через переменную окружения

**NB:** Приоритетной является настройка, заданная через переменные окружения, а не через ini-файлы.
При этом настройки /config/setup.ini не влияют на настройки деплой приложения - они используются только для ядра и модулей. 
Deploy.json всего параметризируеются через ini в дирректории приложения.

## Пример конфигурации параметров ownCloud, вместе с учетной записью

Для начала необходимо задать в `deploy.json` параметрические настройки хранилища:

```json
"ownCloud": 
   "ownCloud": {
            "module": "core/impl/resource/OwnCloudStorage",
            "options": {
              "url": "[[ownCloud.url]]",
              "login": "[[ownCloud.login]]",
              "password": "[[ownCloud.pwd]]"
            }
          }
```

### Конфигурация параметров deploy через ini-файлы:

В ini-файле `deploy.ini` рядом c deploy.json задать параметры следующего вида:

```
ownCloud.url=https://owncloud.iondv.ru/
ownCloud.login=api
ownCloud.pwd=apiapi
```

### Конфигурация параметров deploy через переменную окружения:

В переменных окружения для ноды при конфигурации приложения задать параметры следующего вида:

```
ownCloud.url=https://owncloud.iondv.ru/
ownCloud.login=api
ownCloud.pwd=apiapi
```

## Настройка длины сессии в системе

Длина сессии задается в config/config.json в `sessionHandler`, с применением плейсхолдеров для параметра `cookie.maxAge`:

```json
      "sessionHandler": {
        "module": "lib/session",
        "initMethod": "init",
        "initLevel": 1,
        "options": {
          "app": "ion://application",
          "dataSource": "ion://Db",
          "session": {
            "secret": "ion:demo:secret",
            "resave": false,
            "saveUninitialized": true,
            "cookie": {
              "httpOnly": true,
              "secure": false,
              "maxAge": "[[auth.sessionLifeTime]]"
            }
          }
        }
      }
```

Добавляем настройку в ini-файл проекта. Формат задания аналогичен настройкам периодов в `auth`:

```
auth.tempBlockPeriod=2s
auth.tempBlockInterval=15m
auth.blockPeriod=1d
auth.sessionLifeTime=2h
```

Также можно задавать просто числом, тогда это будет задание в миллисекундах.

## Настройка ограничения

Настройка ограничения переключения по пунктам системного меню для анонимного пользователя. Системное меню формируется с учетом контроля доступа к страницам модулей, т.е. нет прав на страницу модуля - не отображается пункт меню, для перехода на данный модуль, в системном меню. В ini-файле приложения необходимо выставить `auth.checkUrlAccess=true` чтобы задать настройку ограничения. 

## Изменение всех ссылок на относительные

Чтобы изменить все ссылки на относительные, в ini-файле проекта укажите:

```
app.baseUrl= '/нужный_путь/'
```

Если путь не указан то считается по умолчанию '/'.

## Настройка в модуле админа блока управления запуском заданий по расписанию

Для отображения пункта меню необходимо добавить в ini-файл проекта настройку:

```
jobs.enabled=true
```

Она включит шедулер (англ. scheduler) в процессе веб-сервера, что даст возможность управлять джобами из модуля админа .

**Шедулер** — управляет таймерами запуска задач

**Джоб** — конкретная задача, запускаемая по таймеру

## Настройка отключения формы авторизации для перехода на страницу модуля

В конфиге ядра у поля *"auth"* есть настройка `exclude`:

```json
      "auth": {
        "module": "lib/auth",
        "initMethod": "init",
        "initLevel": 2,
        "options": {
          "app": "ion://application",
          "logger": "ion://sysLog",
          "dataSource": "ion://Db",
          "denyTopLevel": "[[auth.denyTop]]",
          "authCallbacks": ["[[auth.callback]]"],
          "publicRegistration": "[[auth.registration]]",
          "exclude": ["[[auth.exclude1]]", "[[auth.exclude2]]", "[[auth.exclude3]]"]
        }
      }
```
То есть прописываем в ini-файле проекта:

```
auth.exclude[] = /registry/ # исключаем только запросы к корню модуля
auth.exclude[] = /registry/** # исключаем запросы ко всем страницам модуля
auth.exclude[] = \/registry\/khv-svyaz-info@naselenniePunkty\/\w+ # исключаем запросы ко всем страницам модуля
внутри ноды khv-svyaz-info@naselenniePunkty
auth.exclude[] = /registry/api/naselenniyPunkt@khv-svyaz-info/** # исключаем запросы к api класса
```

При переходе на страницу указанного в настройке модуля - данные отображаются без необходимости авторизации.

### Отключение авторизации для статичных путей на примере проекта develop-and-test:

```
; Исключение статичных путей ядра из проверки доступа безопасности
auth.exclude[]=/
auth.exclude[]=/vendor/**
auth.exclude[]=/css/**
auth.exclude[]=/fonts/**
auth.exclude[]=/favicon.ico

; Исключение статичных путей модулей из проверки доступа безопасности
auth.exclude[]=/registry/vendor/**
auth.exclude[]=/registry/css/**
auth.exclude[]=/registry/js/**
auth.exclude[]=/registry/app-vendor/**
auth.exclude[]=/registry/app-static/**
auth.exclude[]=/registry/common-static/**
auth.exclude[]=/registry/img/**
auth.exclude[]=/registry/fonts/**
auth.exclude[]=/dashboard/vendor/**
auth.exclude[]=/dashboard/develop-and-test/** ; для проекта develop-and-test
auth.exclude[]=/dashboard/js/**
auth.exclude[]=/registry/viewlib-ext-static/** ; для проекта viewlib-extra
auth.exclude[]=/registry/viewlib-static/js/** ; для проекта viewlib
auth.exclude[]=/gantt-chart/vendor/**
auth.exclude[]=/gantt-chart/gantt/**
auth.exclude[]=/gantt-chart/css/**
auth.exclude[]=/gantt-chart/js/**
auth.exclude[]=/gantt-chart/common-static/**
auth.exclude[]=/gantt-chart/fonts/**
auth.exclude[]=/geomap/vendor/**
auth.exclude[]=/geomap/css/**
auth.exclude[]=/geomap/js/**
auth.exclude[]=/geomap/common-static/**
auth.exclude[]=/geomap/img/**
auth.exclude[]=/geomap/fonts/**
auth.exclude[]=/report/vendor/**
auth.exclude[]=/report/css/**
auth.exclude[]=/report/js/**
auth.exclude[]=/report/common-static/**
auth.exclude[]=/report/img/**
auth.exclude[]=/report/fonts/**

; Исключение всего модуля из проверки доступа безопасности
auth.exclude[]=/portal/**

```

## Настройка кеширования данных на уровне ядра

Настройка кеширования данных на уровне ядра - позволяет корректно восстановливать из кеша жаднозагружаемые ссылочные атрибуты и коллекции, а также файлы и вычисляемые атрибуты. Корректно кешируются списки. Внедрено кеширование в геомодуле. Настройка раз и навсегда решает проблему циклических ссылок при сериализации объектов.

В ini-файле прописываем:

```
cache.module=memcached
```

## Настройка временных ограничений

`connectTimeOut` - максимальное время установления соединения.

`operTimeOut` - максимальное время выполнения операции.

```
db.connectTimeOut=
db.operTimeOut=
```

## Настройка минимальной длины пароля

```
auth.passwordMinLength=8
```
Переопределить настройку для отдельного приложения можно в файле [deploy.json](https://github.com/iondv/framework/blob/master/docs/ru/2_system_description/platform_configuration/deploy_globals.md#%D0%BD%D0%B0%D1%81%D1%82%D1%80%D0%BE%D0%B9%D0%BA%D0%B0-%D0%BC%D0%B8%D0%BD%D0%B8%D0%BC%D0%B0%D0%BB%D1%8C%D0%BD%D0%BE%D0%B9-%D0%B4%D0%BB%D0%B8%D0%BD%D1%8B-%D0%BF%D0%B0%D1%80%D0%BE%D0%BB%D1%8F-%D0%B4%D0%BB%D1%8F-%D0%B2%D1%85%D0%BE%D0%B4%D0%B0-%D0%B2-%D1%81%D0%B8%D1%81%D1%82%D0%B5%D0%BC%D1%83)

### Следующая страница: [Функциональность приложения](/docs/ru/2_system_description/functionality/functionality.md)

--------------------------------------------------------------------------  


 #### [Licence](/LICENSE) &ensp;  [Contact us](https://iondv.com/portal/contacts) &ensp;  [English](/docs/en/2_system_description/platform_configuration/ini_files.md)   &ensp;
<div><img src="https://mc.iondv.com/watch/local/docs/framework" style="position:absolute; left:-9999px;" height=1 width=1 alt="iondv metrics"></div>
 
 --------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.  
All rights reserved. 