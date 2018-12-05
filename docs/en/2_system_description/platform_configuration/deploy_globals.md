#### [Content](/docs/en/index.md)

### Back: [Configuration file - deploy.json](/docs/en/2_system_description/platform_configuration/deploy.md)

# Global settings in `deploy.json`

### Structure of global settings `"globals"` on the example of "Project management system":

```
"globals": {
  "moduleTitles": {
  "explicitTopMenu": [
  "plugins": {
     "sessionHandler": {
     "wfEvents": {
     "actualAclProvider": {
     "aclProvider": {
     "fileStorage": {
     "dataRepo": {
     "customProfile": {
     "securedDataRepo": {
     "indicatorWfHandler": {
     "auth": {
  "jobs": {
     "fact-creator": {
     "report-builder": {
```
## Setting to hide module in system menu

Set the **null** value in the module that you would like to hide in the system menu of the project, for example `"ionadmin": null`.
```
{
  "namespace": "project-management",
  "parametrised": true, //
  "globals": {
    "moduleTitles": {
      "registry": {
        "description": "Project management",
        "order": 10,
        "skipModules": true
      }
      "ionadmin": null
    },
```

## Setting to display the system menu for all modules of the project

Set the `"explicitTopMenu"` at the global level, preserving the ability to override `" explicitTopMenu "` in `registry`. The `"explicitTopMenu"` setting allows to display the same set of items in the system menu,regardless of modules.

### Example 

```
"globals": {
    "explicitTopMenu": [
      {
        "id":"mytasks",
        "url": "/registry/project-management@indicatorValue.all",
        "caption":"My tasks"
      },
      {
        "id":"projectmanagement",
        "url": "/registry/project-management@project",
        "caption":"Project management"
      },
      {
        "type": "system",
        "name": "gantt-chart"
      },
      {
        "type": "system",
        "name": "portal"
      },
      {
        "type": "system",
        "name": "geomap"
      },
      {
        "type": "system",
        "name": "report"
      },
      {
        "id":"distionary",
        "url": "/registry/project-management@classification.okogu",
        "caption":"References"
      },
      {
        "id":"mark",
        "url": "/registry/project-management@person",
        "caption":"Progress-indicators"
      }
    ],

```
### Field description

* `"id"` - identifier of the navigation section
* `"url"` - url of the navigation section
* `"caption"` - name of the navigation section
* `"name"` - system name of the module
 
## Setting the HTML attributes to display and save images in attributes

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

```
"fileStorage": {
        "module": "core/impl/resource/OwnCloudStorage",
        "options": {
          "url": "https://owncloud.iondv.ru/",
          "login": "api",
          "password": "apiapi"
        }
      },
```

```
"htmlFiles": {
        "module": "core/impl/resource/FsStorage",
        "initMethod":"init",
        "initLevel": 3,
        "options": {
          "storageBase": "./htmlFiles",
          "urlBase": "/htmlFiles",
          "dataSource": "ion://Db",
          "log": "ion://sysLog",
          "app": "ion://application",
          "auth": "ion://auth"
        }
      },
      "htmlImages": {
        "module": "core/impl/resource/ImageStorage",
        "initMethod": "init",
        "initLevel": 3,
        "options": {
          "fileStorage": "ion://htmlFiles",
          "app": "ion://application",
          "auth": "ion://auth",
          "log": "ion://sysLog",
          "urlBase": "/htmlFiles",
          "thumbnails": {
            "small": {
              "width": 100,
              "height": 100
            }
          }
        }
```

`"modules": {`
`"registry": {`
`"globals": {`
```
"refShortViewDelay": 1000, //milliseconds before the window opens 
// If 0, not specified or not shortView, the window is not displayed.
        "defaultImageDir": "images",
        "contentImageStorage": "htmlImages"
```
## Setting to display username and user icon (avatar) in all modules of the project 

Set the connection with the icon in the "avatar" field to set the user icon. The system will choose the user icon from the corresponding class attribute whose object is bound to the current system user.

### Example

```
"globals": {
    "plugins": {
      "customProfile": {
        "module": "lib/plugins/customProfile",
        "initMethod": "inject",
        "options": {
          "auth": "ion://auth",
          "metaRepo": "ion://metaRepo",
          "dataRepo": "ion://dataRepo",
          "propertyMap": {
            "person@project-management": {
              "filter": "user",
              "properties": {
                "avatar": "foto"
              }
            }
          }
        }
      }
    }
  }
}
```

## The "sessionHandler" field - TODO
## The "wfEvents" field - TODO
## The "actualAclProvider" field - TODO
## The "dataRepo" field - TODO
## The "securedDataRepo" field - TODO
## The "indicatorWfHandler" field - TODO
## The "auth" field - TODO

### The [full example](/docs/en/2_system_description/platform_configuration/deploy_ex.md) of the deploy.json file

--------------------------------------------------------------------------  


 #### [Licence](/LICENCE.md) &ensp;  [Contact us](https://iondv.com) &ensp;  [Russian](/docs/ru/2_system_description/platform_configuration/deploy_globals.md)   &ensp; [FAQs](/faqs.md) 
 
 --------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.  
All rights reserved. 