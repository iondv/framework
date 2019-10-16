# Authorization and Security Settings

## Application configuration options, `deploy.json` file
Application configuration options are designed to identify key features.
system when the application is running at the design stage and changing the default settings.

### Setting authorization parameters when working with a password
Password settings and requirements are set in `di` in `auth` component configuration of the module. 
But mostly settings are set globally.
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
          "passwordLifetime": "[[auth.passwordLifeTime]]", // Maximum password validity
          "passwordMinPeriod": "[[auth.passwordMinPeriod]]", // Minimum password validity
          "passwordMinLength": "[[auth.passwordMinLength]]", // Minimum password length
          "passwordComplexity": { // Password complexity requirements
            "upperLower": true, // Upper and lower case required
            "number": true, // Mandatory use of at least one number
            "special": true // Must use at least one special character
          },
          "passwordJournalSize": "[[auth.passwordJournalSize]]", // Keep a password log of password size
          "tempBlockInterval": "[[auth.tempBlockInterval]]", // Time to reset block counter
          "attemptLimit": "[[auth.attemptLimit]]", // Limit of attempts
          "tempBlockPeriod": "[[auth.tempBlockPeriod]]" // Account lockout duration
        }
      }
```
The values indicated as`[[auth.passwordLifeTime]]` can be reconfigured in the application settings file - `/config/setup.ini`.
But for this, it is necessary to verify that the `"parametrised": true` setting is set to global.

The lifetime is set in the format `[duration][unit]`, while units:
* y - year
* d - day
* h - hour
* m - minute
* s - second

By default, the key parameter values are:
* passwordLifetime = 100y
* passwordMinPeriod = 0d
* passwordMinLength = 8

All created passwords in the system, including imported ones, are automatically set as required for the change.
In order to avoid changing passwords during import, the `needPwdReset: false` parameter must be specified in the user properties in the imported acl file.

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


## Settings for the framework and application in `config/setup.ini

Settings are used to specify and change the application parameters and
initialized at start. Settings take precedence over configuration settings.

Application settings can also be set in environment variables, while environment variables take precedence over settings.

### Overriding password configuration settings

The password parameters set in the `deploy.json` of the project, if parameterization is enabled and the parameter code is specified, you can redefine them via the platform settings or through environment variables.

Example of the setup file `/config/setup.ini` in which the values specified in the `deploy.json` file are redefined.

```ini
# Maximum password validity
auth.passwordLifeTime=90d
# Maximum password validity
auth.passwordMinPeriod=75d
# Minimum password length
auth.passwordMinLength=8
# Keep a password log of password length
auth.passwordJournalSize=5
# Time to reset block counter
auth.tempBlockInterval=30m
# Limit of attempts
auth.attemptLimit=6
# Limit duration
auth.tempBlockPeriod=30m
# Lifetime of an authorized session, in the absence of activity
auth.sessionLifeTime=4h
```

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