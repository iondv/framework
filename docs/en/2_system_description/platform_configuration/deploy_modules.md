## Настройка отображения имени пользователя и аватара во всех модулях проекта

Для задания аватара через деплой прописываем связку с изображением.
Аватар будет браться из соответствующего атрибута класса, объект которого привязан к текущему системному пользователю.

```json
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

#### Скрытие ролей в админке от назначения поьзователю

Для ролей, которые должны быть скрыты в админке от назначения пользователю, в деплое приложения прописываем фильтры на основе регулярок, по которым такие роли и будут определятся.

```json
"ionadmin": {
      "globals": {
        "securityParams": {          
          "hiddenRoles": [
            "^somePrefix_"
          ]
        }
      }
    }
```

## Настройка отображения общего системного меню для всех модулей проекта

Для того, что бы в системном меню отображался одинаковый набор пунктов, не зависимо от того, на странице какого модуля находишься - необходимо в deploy.json файле проекта задать `"explicitTopMenu"` на глобальном уровне, с сохранением возможности переопределять `"explicitTopMenu"` в registry

*пример* : 

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
взято из https://git.iondv.ru/ION-APP/project-management/blob/v2.2/deploy.json

где, 
* `"id"` - идентификатор секции навигации
* `"url"` - url секции навигации
* `"caption"` - наименование секции навигации
* `"name"` - системное наименование модуля

## Настройка скрытия модуля из отображения в системном меню

Для скрытия модуля из системного меню проекта присваиваем этому модулю, в файле deploy.json, значение _null_, например `"ionadmin": null`

*пример:*

```json
"globals": {
    "moduleTitles": {
      "report": {
        "description": "Аналитика",
        "order": 90
      },
      "ionadmin": null
    },
```