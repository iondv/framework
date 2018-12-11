#### [Content](/docs/en/index.md)

### The previous page: [Dependencies in package.json](docs/en/2_system_description/platform_configuration/package.md)

# How to configure the parameters?

* using ini-files
* using environment variable

**NB:** We recommend you to configure the parameters by use of the environment variables, not the ini-files.

## How to configure the parameters of OwnCloud with a user account

First of all, set the parametric settings of the storage in the `deploy.json` file:

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

### Configure the parameters in `deploy` by use of the ini-files:

In the `deploy.ini` ini-file near the deploy.json file set the following parameters: 

```
ownCloud.url=https://owncloud.iondv.ru/
ownCloud.login=api
ownCloud.pwd=apiapi
```

### Configure the parameters in `deploy` by use of the environment variable:

In the environment variables for the NODE set the following parameters: 

```
ownCloud.url=https://owncloud.iondv.ru/
ownCloud.login=api
ownCloud.pwd=apiapi
```

## Setting the session length in the system

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

Add this setting in the **ini-file** of the project. The format is the same as for the perioud setting in the `auth`: 

```
auth.tempBlockPeriod=2s
auth.tempBlockInterval=15m
auth.blockPeriod=1d
auth.sessionLifeTime=2h
```

You can also set it in numbers, and then it will be in milliseconds. 

## Setting the limit 

Setting the limit for switching items in the system menu for an anonymous user. The system menu is formed taking into account the access control to the module pages, i.e. if there are no access rights to the module - the menu item is not displayed to go to the module page. Set the `auth.checkUrlAccess=true` in the ini-file of the project to set the limit setting.

## Changing all references to relative ones

To change all references to relative ones, in the ini-file set the following parameter:

```
app.baseUrl= '/desired_path/'
```

If the path is not specified, then it is '/' by default.

## Setting the control unit to run jobs on a schedule in admin module

To display the control unit, in the ini-file of the project add the following setting:

```
jobs.enabled=true
```

This setting enable the scheduler in the process of the web server, which will give the opportunity to manage Jobs from the admin module.

**Scheduler** — manages task start timers.

**Job** — specific task run by a timer.

## Setting to disable the authorization form to go to the module page

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
auth.exclude[] = \/registry\/khv-svyaz-info@naselenniePunkty\/\w+ # exclude queries to all pages of the module inside the node - khv-svyaz-info@naselenniePunkty
auth.exclude[] = /registry/api/naselenniyPunkt@khv-svyaz-info/** # exclude queries to the class api
```

When you go to the page specified in the module settings - the data is displayed without the authorization.

## Setting to cache the data at the core level

Setting of cached data at the core level - allows to correctly recover from the cache eager loaded reference attributes and collections, as well as files and calculated attributes. Lists are cached correctly. Caching is implemented in the geomodule. This setting once and for all solves the problem of circular references when serializing objects.

In the ini-file of the project, write the following::

```
cache.module=memcached
```

## Setting the time limit

`connectTimeOut` - the maximum time connection time.
`operTimeOut` - the maximum time to complete an operation.

```
db.connectTimeOut=
db.operTimeOut=
```

### The next page: [Functionality](/docs/en/2_system_description/functionality/functionality.md)

--------------------------------------------------------------------------  


 #### [Licence](/LICENCE.md) &ensp;  [Contact us](https://iondv.com) &ensp;  [Russian](/docs/ru/2_system_description/platform_configuration/ini_files.md)   &ensp; [FAQs](/faqs.md) 
 
 --------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.  
All rights reserved. 