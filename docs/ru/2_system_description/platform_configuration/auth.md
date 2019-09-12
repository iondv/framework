# Настройки авторизации и безопасности

## Параметры конфигруации приложения, файл `deploy.json`
Параметры конфигурации приложения предназначены для определения ключевых возможностей 
системы при работе приложения на этапе проектирования и изменения параметров по умолчанию.

### Настройка параметров авторизации при работе с паролем
Параметры и требования работы с паролем задаются в `di` в конфиграции компонента `auth` модуля. 
Но в большинстве настройки задаются глобально.
```json
{
  "globals": {
    "parametrised": true,  
    "plugins":{
      "auth": {
        "module": "lib/auth",
        "initMethod": "init",
        "initLevel": 2,
        "options": {
          "app": "ion://application",
          "logger": "ion://sysLog",
          "dataSource": "ion://Db",
          "acl": "ion://aclProvider",
          "passwordLifetime": "[[auth.passwordLifeTime]]", // Максимальный срок действия пароля
          "passwordMinPeriod": "[[auth.passwordMinPeriod]]", // Минимальный срок действия пароля
          "passwordMinLength": "[[auth.passwordMinLength]]", // Минимальная длина пароля
          "passwordComplexity": { // Требования к сложности пароля
            "upperLower": true, // Обязательно верхний и нижний регистр
            "number": true, // Обязрательно использование хотя бы одного числа
            "special": true // Обязательно использование хотя бы одного специального символа
          },
          "passwordJournalSize": "[[auth.passwordJournalSize]]", // Вести журнал паролей размере паролей
          "tempBlockInterval": "[[auth.tempBlockInterval]]", // Время до сброса счетчика блокировки
          "attemptLimit": "[[auth.attemptLimit]]", // Пороговое значение количества попыток для блокировки
          "tempBlockPeriod": "[[auth.tempBlockPeriod]]" // Продолжительность блокировки учетной записи
        }
      }
```
При этом значения обозначенные `[[auth.passwordLifeTime]]` могут быть переконфигурированы в файле настроек приложения `/config/setup.ini`.
Но для этого обязательно нужно проверить, что задана настройка "parametrised": true, на уровне global.

Время жизни задается в формает `[длительность][ед. изм]`, при этом единицы измерения:
* y - год
* d - день
* h - час
* m - минута
* s - секунда

По умолчанию значения ключевых параметров:
* passwordLifetime = 100y
* passwordMinPeriod = 0d
* passwordMinLength = 8

Все создаваемые пароли в системе, в том числе импортированные, автоматически проставляются как требуемые к смене.
Чтобы при импорте пароли не требовывалось менять, в свойствах пользователя в импортируемом файле acl должен быть указан параметр `needPwdReset: false`

### Настройка минимальной длины пароля для входа в систему

Для указания минимальной длины пароля для входа в систему используем свойство `"passwordMinLength"`
```
"plugins":{
    "accounts": {
        "options": {
          "passwordMinLength": 8
        }
    }
}
```

### Настройка прав доступа "aclProvider"

`"plugins":{`

```javascript
"aclProvider": {
    "module": "core/impl/access/aclMetaMap",
    "initMethod": "init",
    "initLevel": 1,
    "options":{
      "dataRepo": "lazy://dataRepo",
      "acl": "lazy://actualAclProvider",
      "accessManager": "lazy://roleAccessManager"
    }
}
```


## Параметры настроек фреймворка и приложения в файле `config/setup.ini

Настройки предназначены для уточнения и изменения параметров приложения и 
инициализируются при запуске. Настройки имеют более высокий приоритет чем параметры конфигурации.

Настройки приложения могут быть также заданы в переменных окружения при этом 
переменные окружения имеют более высокий приоритет перед настройками.

### Переопределение параметров конфигурации паролей

Параметры работы с паролями, заданные в `deploy.json` проекта, если включена параметризация и указан код параметр, можно переопределить через настройки платформы или через переменные окружения.

Пример файла настроек `/config/setup.ini` в котором переопределяются значения, указанные в примере файла `deploy.json`.

```ini
# Максимальный срок действия пароля
auth.passwordLifeTime=90d
# Минимальный срок действия пароля
auth.passwordMinPeriod=75d
# Минимальная длина пароля
auth.passwordMinLength=8
# Вести журнал паролей размере паролей
auth.passwordJournalSize=5
# Время до сброса счетчика блокировки
auth.tempBlockInterval=30m
# Пороговое значение блокировки
auth.attemptLimit=6
# Продолжительность блокировки учетной записи
auth.tempBlockPeriod=30m
# Время жизни авторизованной сессии, при отсутствии активности
auth.sessionLifeTime=4h
```

### Настройка параметров сессии в системе

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

### Настройка отключения формы авторизации для перехода на страницу модуля

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


