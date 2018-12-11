#### [Оглавление](/docs/ru/index.md)

### Предыдущая страница: [Зависмости в package.json](docs/ru/2_system_description/platform_configuration/package.md)

# Способы конфигурации параметров:

* через ini-файлы
* через переменную окружения

**NB:** Приоритетной является настройка, заданная через переменные окружения, а не через ini-файлы.


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

Добавляем настройку в **ini-файл** проекта. Формат задания аналогичен настройкам периодов в `auth`:

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

Чтобы изменить все ссылоки на относительные, в ini-файле проекта укажите:

```
app.baseUrl= '/нужный_путь/'
```

если путь не указан то считается по умолчанию '/'.

## Настройка в админке блока управления запуском заданий по расписанию

Для отображения пункта меню необходимо добавить в ini-файл проекта настройку:

```
jobs.enabled=true
```

Она включит шедулер (англ. scheduler) в процессе веб-сервера, что даст возможность управлять джобами из админки.

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
т.е. прописываем в ini-файле проекта:

```
auth.exclude[] = /registry/ # исключаем только запросы к корню модуля
auth.exclude[] = /registry/** # исключаем запросы ко всем страницам модуля
auth.exclude[] = \/registry\/khv-svyaz-info@naselenniePunkty\/\w+ # исключаем запросы ко всем страницам модуля внутри ноды khv-svyaz-info@naselenniePunkty
auth.exclude[] = /registry/api/naselenniyPunkt@khv-svyaz-info/** # исключаем запросы к api класса
```

при переходе на страницу указанного в настройке модуля - данные отображаются без необходимости авторизации.

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

### Следующая страница: [Функциональность приложения](/docs/ru/2_system_description/functionality/functionality.md)

--------------------------------------------------------------------------  


 #### [Licence](/LICENCE.md) &ensp;  [Contact us](https://iondv.com) &ensp;  [English](/docs/en/2_system_description/platform_configuration/ini_files.md)   &ensp; [FAQs](/faqs.md) 
 
 --------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.  
All rights reserved. 