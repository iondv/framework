#### [Content](/docs/en/index.md)

### Back: [Configuration file - deploy.json](/docs/en/2_system_description/platform_configuration/deploy.md)

# Module settings in `deploy.json`

# The "registry" module

## Setting of configurable file save

To set the path to save the file in the storage - use the following setting:

```
"modules": {
    "registry": {
      "globals": {
...
        "storage": {
           "className@ns":{
               "file_attr":"/${class}/example_${attr}/${dddd}/"
           }
         },
...
```
In the object, the key is the name of the class, then "attribute name": "relative path".

Aliases are in `${alias}`. Available aliases:

* `class` - class name
* `attr` - attribute name
* `moment.js` - dates

## Setting to specify the number of characters for search query

For all application - `"listSearchMinLength"`.

```
"modules": {
  "registry": {
     "globals": {
       "listSearchMinLength": 1
      }
   }
}
```

For one specific class - `"minLength"`.

```
"modules": {
  "registry": {
     "globals": {
       "listSearchOptions": {
          "className@ns": {
            "*": {
              "searchBy": [
                "atr1"
              ],
              "splitBy": "\\s+",
              "mode": [
                "starts"
              ],
              "joinBy": "and",
              "minLength": 3
            }
         }
      }
   }
}
```
##  Setting of container assignment when creating the nested object

For cases when it is necessary to assign a value for an attribute by reference, not when saving an object, but when creating, specify the setting for the class that contains the assigned value in the `deploy.json` file of the application:

```
"registry": {
   "globals": {
      "forceMaster": {
         "name_class@ns": true
      }
   }
 }
```

An example of the sequence generators - now for each object its code is the code of its direct container plus the next value of the sequence counter associated with the container object.

## Setting the eager loading for printed forms `"skipEnvOptions"`

[Printed forms](/docs/ru/2_system_description/functionality/printed_forms.md) in more details.

Use the `skipEnvOptions` flag to enable/disable the eager loading.

### Example

```
...
"modules": {
    "registry": {
      "globals": {
...
       "customTemplates": [
...
         "di": {
...
           "export": {
            "options": {
              "configs": {
                "class@ns": {
                  "expertItemToDocx": {
                    "type": "item",
                    "caption": "Name",
                    "mimeType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    "extension": "docx",
                    "skipEnvOptions": true,
                    "preprocessor": "ion://expertItemToDocx"
                   }
                 }
               }
             }
           }
...
         }
       }
     }
   }
 }
...
```
Thanks to the eager loading the system creates a file very quickly, but it may not always be acceptable.

## Setting of notifications about editing the object by another user

In the setting of the notification about the editing of an object by another user, the time before blocking is specified in milliseconds:

```
"modules": {
    "registry": {
      "globals": {
        "concurencyCheck": 10000
      }
    }
 } 
```
**ConcurencyChecker component**:

The `ConcurencyChecker` component in the data source stires the lock status for objects.

It stores the following parameters:
* full id of an object (class@id), 
* date/time of block (blockDate), 
* user who blocked.

The component creates blocking states, thus a timer is started, according to which the blocking record is deleted after the timeout expires. If at the time the timer is triggered, the entry is still relevant (updated blockDate), the entry is not deleted, and the timer is updated.

**Logic of the view controller**:

Читаем из сетингов настройку *registry.concurencyCheck* (таймаут блокировки в секундах).

Если она больше 0, обращаемся к `ConcurencyCheker` - проверяем состояние блокировки. 

Если не найдено (либо просрочена - blockDate < now() - registry.concurencyCheck), то через чекер записываем новую блокировку от имени текущего пользователя. Если найдена живая блокировка - передаем в шаблон информацию о блокировке, которую отображаем на форме и отображаем форму в режиме для чтения (`globalReadOnly`).

Дополнительный контроллер `concurencyState`, который принимает id объекта и проверяет его состояние блокировки. Если объект не заблокирован (нет блокировки, либо она просрочена), то блокирует объект от имени текущего пользователя. Если объект заблокирован текущим пользователем, обновляет *blockDate* на *new Date()*. Возвращает состояние блокировки.

**Object form behavior**:

Если в шаблон передана инфа о блокировке, то добавляется скрипт, который периодически (с периодом `registry.concurencyCheck/2`) обращается к контроллеру `concurencyState`.

Если в ответ приходит информация о блокировке другим пользователем - она отображается (обновляем сообщение), если произошел перехват блокировки текущим пользователем - форма перезагружается (она при этом отображается в режиме для редактирования).

## Подключение ресурсов в проекте для оформления

Это имеет отношение к, например, группам в специальном стиле - чтобы не подключать ресурсы через изменения шаблонов модуля - необходимо их подключить в приложении.

```
        "statics": {
          "geoicons": "applications/khv-svyaz-info/icons"
        },
```
Все, что внутри директории `icons` будет доступно по ссылке `registry/geoicons`.

## Настройка формы указания параметров экспорта (для печатных форм)

Example с параметрами в `params`:

```
...
        "di": {
          "pmListToDocx": {
            "module": "modules/registry/export/listToDocx",
            "initMethod": "init",
            "initLevel": 0,
            "options": {
              "tplDir": "applications/project-management/export/item2",
              "log": "ion://sysLog"
            }
          }
...
          "export": {
            "options": {
              "configs": {
                "evaluationPerform@project-management": {
                  "rating": {
                    "caption": "Оценка деятельности исполнителя и соисполнителей проекта",
                    "mimeType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    "extension": "docx",
                    "type": "list",
                    "query": {
                      "filter": {
                        "and": [
                          {
                            "eq": [
                              "$basicObjPerform",
                              ":project"
                            ]
                          },
                          {
                            "gte": [
                              "$date",
                              ":since"
                            ]
                          },
                          {
                            "lte": [
                              "$date",
                              ":till"
                            ]
                          }
                        ]
                      }
                    },
                    "params": {
                      "project": {
                        "caption": "Проект",
                        "type": "reference",
                        "className": "project@project-management"
                      },
                      "since": {
                        "caption": "Период с",
                        "type": "date",
                        "default": "$monthStart"
                      },
                      "till": {
                        "caption": "Период по",
                        "type": "date",
                        "default": "$monthEnd"
                      }
                    },
                    "eagerLoading": [
                      "ownOrg",
                      "basicObjs"
                    ],
                    "preprocessor": "ion://pmListToDocx"
                  }
                }
...
```
##  Настройка параметров поиска в списке объектов

Функционал позволяет на уровне класса определять, как ищем объекты класса из представления списка: по вхождению слов или полные слова, по отдельным атрибутам или по указанным атрибутам в списке с параметрами поиска через пробел.

### Формат и доступные операции:

```
"listSearchOptions": {
    "person@khv-childzem": {...} // для класса
       "khv-childzem@person": {...} // только в узле навигации person
      "*": {...} // везде по умолчанию
}
```

вместо `...` подставляем атрибуты и задаем операции для поиска, например:

```
        "searchBy": [ // атрибуты по которым ищем, по умолчанию то, что выводится в колонках
         "surname",
         "name",
         "patronymic"
       ],
       "splitBy": "\\s+", // разбивать поисковую фразу регуляркой, части сопоставить с атрибутами
       "mode": ["starts", "starts", "starts"], // режимы сопоставления - в данном случае "начинается с" (доступны like, contains, starts, ends)
       "joinBy": "and" // режим объединения условий на атрибуты (по умолчанию or)
```
## Настройка иерархического представления для коллекций

**Иерархическое представление коллекций**- отображает коллекции, в которых элементы связаны друг с другом в виде иерархического справочника. В библиотеке `viewlib` реализован кастомный контроллер, возвращающий в формате `TreeGrid` очередной уровень иерархии.

### Example

```
"treegridController": {
            "module": "applications/viewlib/lib/controllers/api/treegrid",
            "initMethod": "init",
            "initLevel": 0,
            "options": {
              "module": "ion://module",
              "logger": "ion://sysLog",
              "securedDataRepo": "ion://securedDataRepo",
              "metaRepo": "ion://metaRepo",
              "auth": "ion://auth",
              "config": {
                "*": {
                  "project@project-management":{
                    "roots":[{
                      "property": "name",
                      "operation": 1,
                      "value": [null],
                      "nestedConditions": []
                    }],
                    "childs":["stakeholders", "basicObjs"]
                  },
                  "governmentPower@project-management": {
                    "roots":[],
                    "childs":null,
                    "override": {
                      "descript": "url"
                    }
                  },
                  "object@project-management": {
                    "roots":[],
                    "childs":null
                  },
                  "event@project-management": {
                    "roots":[],
                    "childs":null
                  }
                }
              }
            }
          }
...
```

Поле `config` - в нем все настройки:
* первый ключ это навигационная нода (в данном примере "*" значит распространяется на все ноды), 
* потом идут классы, у классов `roots` - это какие объекты этого класса вытаскивать в качестве корневых (используются конидшены),
* `childs` - это атрибуты класса из которых доставать иерархию.

## Настройка текстового поиска в глубину по ссылочным атрибутам

`searchByRefs` - это массив настроек, для обозначения иерархии классов. Можно сопоставлять с несколькими классами.

### Example

```
"family@khv-childzem": {
            "*": {
              "searchByRefs":[
                {
                  "class": "person@khv-childzem",
                  "idProperties": ["famChilds", "famParentMale", "famParentFemale"],
                  "searchBy": [
                    "surname",
                    "name",
                    "patronymic"
                  ],
                  "splitBy": "\\s+",
                  "mode": [
                    "starts",
                    "starts",
                    "starts"
                  ],
                  "joinBy": "and"
                }
              ]
            }
          }
```

# Модуль "geomap"

## Настройка иконки приложения

Логотип для модуля описывается через стандартный механизм статичных маршрутов:

```json
{
  "modules": {
    "geomap": {
      "statics":[{"path":"applications/khv-svyaz-info/icons", "name":"icons"}],
      "logo": "icons/logo.png"
    }
  }
}
```

## Настройка скрытия шапки и бокового меню

### Example:

```
"geomap": {
   "globals": {
      "hidePageHead": true, //отобразить шапку
      "hidePageSidebar": false, //скрыть боковое меню 
      ...
    }
 }
```

# Модуль "gantt-chart"

## Настройка шкалы времени 

Шкала времени настраивается посредством настройки "Шаг" в модуле Гаанта.
В преконфигурации "Шаг" задается через параметр `step`:

```
{
  "unit": "year",
  "step": 5
}
```

### Example

```
...
   "gantt-chart": {
      "globals": {
        "config": {
...
          "preConfigurations": {
...
            "config3": {
              "caption": "Третья конфигурация",
              "showPlan": true,
              "units": "year",
              "step": 5,
              "days_mode": "full",
              "hours_mode": "full",
              "columnDisplay": {
                "text": true,
                "owner": true,
                "priority": true
              },
              "filters": {
                "priority": "Обычный"
              }
            }
          }
...
        }
      }
    }
```

# Модуль "report"
```
"report": {
      "globals": {
        "namespaces": {
          "project-management": "Проектное управление"
        },
        "defaultNav": {
          "namespace": "project-management",
          "mine": "projects",
          "report": "roadmap"
        },
        "mineBuilders": {
          "project-management": {
            "test": {
              "projects": "mineBuilder"
            },
            "projects": {
              "indicatorAll": "mineBuilder"
            }
          }
        },
        "di": {},
        "statics": {
          "common-static": "applications/project-management/templates/static"
        },
        "logo": "common-static/logo.png"
      },
      "import": {
        "src": "applications/project-management/bi",
        "namespace": "project-management"
      }
    },
```

# Модуль "rest"
```
 "rest": {
      "globals": {
        "di": {}
      }
    },
 ```

# Модуль "portal"
```
"portal": {
      "import": {
        "src": "applications/project-management/portal",
        "namespace": "project-management"
      },
      "globals": {
        "portalName": "pm",
        "needAuth": true,
        "default": "index",
        "theme": "project-management/portal",
        "templates": [
          "applications/project-management/themes/portal/templates"
        ],
        "statics": {
          "pm": "applications/project-management/themes/portal/static"
        },
        "pageTemplates": {
          "navigation": {
            "index": "pages/index"
          }
        }
      }
    },
 ```

# Модуль "ionadmin"

#### Скрытие ролей в админе от назначения поьзователю

Для ролей, которые должны быть скрыты в админе от назначения пользователю, в деплое приложения прописываем фильтры на основе регулярных выражений, по которым такие роли и будут определятся.

```
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

# Модуль "dashboard"

Для того что бы данные из меты загружались в модуль "dashboard", необходимо в файле конфигурации приложения
`deploy.json` добавить следующую секцию, в раздел `"modules"`:

```
   "dashboard": {
      "globals": {
        "namespaces": {
          "project-management": "Project management"
        },
        "root": {
          "project-management": "applications/project-management/dashboard"
        }
      }
    },
```
# The "diagram" module

```
"diagram": {
      "globals": {
        "config": {
          "org1": {
            "caption": "Organizational structure",
            "edit": true,
            "showSections": false,
            "relations": {
              "className": "organization@project-management",
              "title": "name",
              "text": "address",
              "img": "",
              "filter": [
                {
                  "property": "headOrg",
                  "operation": 0,
                  "value": [
                    null
                  ],
                  "nestedConditions": []
                }
              ],
              "children": [
                {
                  "className": "branchOrg@project-management",
                  "property": "branch",
                  "title": "name",
                  "text": "address",
                  "children": [
                    {
                      "className": "branchOrg@project-management",
                      "property": "branch",
                      "children": []
                    }
                  ]
                }
              ]
            }
          }
        }
      }
    }
 ```

### The [full example](/docs/en/2_system_description/platform_configuration/deploy_ex.md) of the deploy.json file

--------------------------------------------------------------------------  


 #### [Licence](/LICENCE.md) &ensp;  [Contact us](https://iondv.com) &ensp;  [Russian](/docs/ru/2_system_description/platform_configuration/deploy_modules.md)   &ensp; [FAQs](/faqs.md) 
 
 --------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.  
All rights reserved. 