#### [Оглавление](/docs/ru/index.md)

### Назад: [Конфигурационный файл - deploy.json](/docs/ru/2_system_description/platform_configuration/deploy.md)

# Глобальные настройки в `deploy.json`

### Структура глобальных настройек `"globals"` на примере приложения "Project management system": 
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
## Настройка скрытия модуля в системном меню

Для скрытия модуля из системного меню проекта присваиваем этому модулю, в файле `deploy.json`, значение _null_, например `"ionadmin": null`.

```
{
  "namespace": "project-management",
  "parametrised": true, //
  "globals": {
    "moduleTitles": {
      "registry": {
        "description": "Проектное управление",
        "order": 10,
        "skipModules": true
      }
      "ionadmin": null
    },
```

## Настройка отображения общего системного меню для всех модулей проекта

Для того, что бы в системном меню отображался одинаковый набор пунктов, не зависимо от того, на странице какого модуля находишься - необходимо в `deploy.json` файле проекта задать `"explicitTopMenu"` на глобальном уровне, с сохранением возможности переопределять `"explicitTopMenu"` в `registry`.

### Пример 

```
"globals": {
    "explicitTopMenu": [
      {
        "id":"mytasks",
        "url": "/registry/project-management@indicatorValue.all",
        "caption":"Мои задачи"
      },
      {
        "id":"projectmanagement",
        "url": "/registry/project-management@project",
        "caption":"Проектное управление"
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
        "caption":"Справочники"
      },
      {
        "id":"mark",
        "url": "/registry/project-management@person",
        "caption":"Прогресс-индикатор"
      }
    ],

```
### Описание полей

* `"id"` - идентификатор секции навигации
* `"url"` - url секции навигации
* `"caption"` - наименование секции навигации
* `"name"` - системное наименование модуля
* 
## Настройка HTML атрибутов для отражения и сохранения картинок в атрибуте

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
"refShortViewDelay": 1000, //количество миллисекунд до появления окна 
//с инфо. Если не указан или 0, или нет shortView представления, то 
//окно не выводится
        "defaultImageDir": "images",
        "contentImageStorage": "htmlImages"
```
## Настройки отображения имени пользователя и аватара во всех модулях проекта

Для задания аватара через деплой прописываем связь с изображением.
Аватар будет браться из соответствующего атрибута класса, объект которого привязан к текущему системному пользователю.

### Пример

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

## Поле "sessionHandler" - TODO
## Поле "wfEvents" - TODO
## Поле "actualAclProvider" - TODO
## Поле "dataRepo" - TODO
## Поле "securedDataRepo" - TODO
## Поле "indicatorWfHandler" - TODO
## Поле "auth" - TODO

### Полный пример файла [deploy.json](/docs/ru/2_system_description/platform_configuration/deploy_ex.md)

--------------------------------------------------------------------------  


 #### [Licence](/LICENCE.md) &ensp;  [Contact us](https://iondv.com) &ensp;  [English](/docs/en/2_system_description/platform_configuration/deploy_desc.md)   &ensp; [FAQs](/faqs.md) 
 
 --------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.  
All rights reserved. 