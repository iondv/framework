# Настройки авторизации и безопасности

## Параметры конфигруации приложения, файл `deploy.json`
Параметры конфигурации приложения предназначены для определения ключевых возможностей 
системы при работе приложения на этапе проектирования и изменения параметров по умолчанию.

## Параметры конфигруации приложения, файл `deploy.json`

### Setting the minimum password length

You can specify the minimum password length to log in, using the `"passwordMinLength"` property.
```
"plugins":{
    "accounts": {
        "options": {
          "passwordMinLength": 8
        }
    }
}
```

### Setting the access rights "aclProvider"

`"plugins":{`

```
 "aclProvider": {
        "module": "core/impl/access/aclMetaMap",
        "initMethod": "init",
        "initLevel": 1,
        "options":{
          "dataRepo": "lazy://dataRepo",
          "acl": "lazy://actualAclProvider",
          "accessManager": "lazy://roleAccessManager",
```


## Параметры настроек фреймворка и прложения в файле `config/setup.ini

### Setting the session length in the system

Set the session length in the в config/config.json in `sessionHandler`, using placeholders for the `cookie.maxAge` parameter:

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

Add this setting in the ini-file of the project. The format is the same as for the period setting in the `auth`: 

```
auth.tempBlockPeriod=2s
auth.tempBlockInterval=15m
auth.blockPeriod=1d
auth.sessionLifeTime=2h
```

You can also set it in numbers, and then it will be in milliseconds. 

### Setting to disable the authorization form to go to the module page

In the core setting the *"auth"* field has the `exclude` setting:

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
So in the ini-file of the project, write the following:

```
auth.exclude[] = /registry/ # exclude only queries to the root of the module
auth.exclude[] = /registry/** # exclude queries to all pages of the module
auth.exclude[] = \/registry\/khv-svyaz-info@naselenniePunkty\/\w+ # exclude queries to all pages of the module 
inside the node - khv-svyaz-info@naselenniePunkty
auth.exclude[] = /registry/api/naselenniyPunkt@khv-svyaz-info/** # exclude queries to the class api
```

When you go to the page specified in the module settings - the data is displayed without the authorization.

### Deactivation of the authorization for static paths on the example of the develop-and-test project:

```
; Exclude static core paths from security access checks
auth.exclude[]=/
auth.exclude[]=/vendor/**
auth.exclude[]=/css/**
auth.exclude[]=/fonts/**
auth.exclude[]=/favicon.ico

; Exclude static module paths from security access checks
auth.exclude[]=/registry/vendor/**
auth.exclude[]=/registry/css/**
auth.exclude[]=/registry/js/**
auth.exclude[]=/registry/app-vendor/**
auth.exclude[]=/registry/app-static/**
auth.exclude[]=/registry/common-static/**
auth.exclude[]=/registry/img/**
auth.exclude[]=/registry/fonts/**
auth.exclude[]=/dashboard/vendor/**
auth.exclude[]=/dashboard/develop-and-test/** ; for the develop-and-test project
auth.exclude[]=/dashboard/js/**
auth.exclude[]=/registry/viewlib-ext-static/** ; for the viewlib-extra project
auth.exclude[]=/registry/viewlib-static/js/** ; for the viewlib project
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

; Exclude entire module from security access check
auth.exclude[]=/portal/**

```