#### [Content](/docs/en/index.md)

### The previous page: [Dependencies in package.json](package.md)

# How to configure the parameters?

* using ini-files
* using environment variable

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
ownCloud.url=https://owncloud.com/
ownCloud.login=api
ownCloud.pwd=api
```

### Configure the parameters in `deploy` by use of the environment variable:

In the environment variables for the NODE set the following parameters: 

```
ownCloud.url=https://owncloud.com/
ownCloud.login=api
ownCloud.pwd=api
```



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

## Setting the minimum password length

```
auth.passwordMinLength=8
```
You can override the setting for an application in the [deploy.json](https://github.com/iondv/framework/blob/masterdeploy_globals.md#%D0%BD%D0%B0%D1%81%D1%82%D1%80%D0%BE%D0%B9%D0%BA%D0%B0-%D0%BC%D0%B8%D0%BD%D0%B8%D0%BC%D0%B0%D0%BB%D1%8C%D0%BD%D0%BE%D0%B9-%D0%B4%D0%BB%D0%B8%D0%BD%D1%8B-%D0%BF%D0%B0%D1%80%D0%BE%D0%BB%D1%8F-%D0%B4%D0%BB%D1%8F-%D0%B2%D1%85%D0%BE%D0%B4%D0%B0-%D0%B2-%D1%81%D0%B8%D1%81%D1%82%D0%B5%D0%BC%D1%83) file.

### The next page: [Functionality](/docs/en/2_system_description/functionality/functionality.md)

--------------------------------------------------------------------------  


 #### [Licence](/LICENSE) &ensp;  [Contact us](https://iondv.com/portal/contacts) &ensp;  [Russian](/docs/ru/2_system_description/platform_configuration/ini_files.md)   &ensp;  
 
 --------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.  
All rights reserved. 