#### [Оглавление](/docs/ru/index.md)

### Предыдущая страница: [Настройка безопасности](/docs/ru/2_system_description/platform_configuration/deploy_security.md)

# Настройки в `deploy.json`

## Настрйоки отображения имени пользователя и аватара во всех модулях проекта

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

## Подключение ресурсов в проекте для оформления

Это имеет отношение к, например, группам в специальном стиле - чтобы не подключать ресурсы через изменения шаблонов модуля - необходимо их подключить в приложении.

```
        "statics": {
          "geoicons": "applications/khv-svyaz-info/icons"
        },
```
Все, что внутри директории `icons` будет доступно по ссылке `registry/geoicons`.



## Настройка HTML атрибутов для отражения и сохранения картинок в атрибуте

`"globals": {`
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

```json
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

## Настройка конфигурируемого сохранения файлов

Для того, что бы задать путь сохранения файла в хранилище - указываем:

```json
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
В объекте ключом является название класса, дальше "название атрибута" : "относительный путь".

Алиасы записываются в `${алиас}` . Доступные алиасы:

* `class` - имя класс
* `attr` - имя атрибута
* также доступны обозначения дат из `moment.js`

## Настройка для указания количества символов для поискового запроса

Для всего приложения - `"listSearchMinLength"`.

```
"modules": {
  "registry": {
     "globals": {
       "listSearchMinLength": 1
      }
   }
}
```

Для отдельного класса `"minLength"`.

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

# Настройка скрытия модуля в системном меню

Для скрытия модуля из системного меню проекта присваиваем этому модулю, в файле `deploy.json`, значение _null_, например `"ionadmin": null`

### Пример

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

#  Настройка присвоения контейнера при создании вложенного объекта

Для случаев, когда необходимо присваивать значение для атрибут по ссылке, не при сохранении объекта, а при создании, указываем в `deploy.json` приложения настройку для класса, который содержит присваемое значение:

```
"registry": {
   "globals": {
      "forceMaster": {
         "name_class@ns": true
      }
   }
 }
```
Пример использования генераторов последовательностей - сейчас для каждого объекта его код - это код его непосредственного контейнера плюс очередное значение счетчика последовательности привязанного к объекту-контейнеру.

## Настройка формы указания параметров экспорта (для печатных форм)

Пример с параметрами в `params`:

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

## Настройка жадной загрузки для печатных форм `"skipEnvOptions"`

Подробнее о [печатных формах](/docs/ru/2_system_description/functionality/printed_forms.md).

С помощью флага `skipEnvOptions` можно настроить/отключить жадную загрузку.

### Пример

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
                    "caption": "Наименование",
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
При жадной загрузке файл создается быстро, но это не всегда может быть приемлемо.

## Настройка шкалы времени 

Шкала времени настраивается посредством настройки "Шаг" в модуле Гаанта.
В преконфигурации "Шаг" задается через параметр `step`:

```
{
  "unit": "year",
  "step": 5
}
```

### Пример

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

## Настройка иерархического представления для коллекций

**Иерархическое представление коллекций**- отображает коллекции, в которых элементы связаны друг с другом в виде иерархического справочника. В библиотеке `viewlib` реализован кастомный контроллер, возвращающий в формате `TreeGrid` очередной уровень иерархии.

### Пример

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

## Настройка текстового поиска в глубину по ссылочным атрибутам

`searchByRefs` - это массив настроек, для обозначения иерархии классов. Можно сопоставлять с несколькими классами.

### Пример

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

## Настройка уведомления о редактировании объекта другим пользователем

В настройке уведомления о редактировании объекта другим пользователем указывается время жизни для блокировки в милисекундах:

```
"modules": {
    "registry": {
      "globals": {
        "concurencyCheck": 10000
      }
    }
 } 
```
**Компонент ConcurencyChecker**:

Компонент `ConcurencyChecker` в датасорсе хранит состояние блокировки для объектов.
Хранит следующие параметры:
* полный id объекта (класс@id), 
* датавремя блокировки (blockDate), 
* заблокировавший юзер.

Компонент создает состояния блокировки, при этом запускается таймер, по которому запись о блокировке удаляется по истечении таймаута. Если на момент срабатывания таймера запись оказывается еще актуальной (обновляли blockDate), то запись не удаляется, а таймер обновляется.

**Логика в контроллере view**:

Читаем из сетингов настройку *registry.concurencyCheck* (таймаут блокировки в секундах).

Если она больше 0, обращаемся к `ConcurencyCheker` - проверяем состояние блокировки. 

Если не найдено (либо просрочена - blockDate < now() - registry.concurencyCheck), то через чекер записываем новую блокировку от имени текущего пользователя. Если найдена живая блокировка - передаем в шаблон информацию о блокировке, которую отображаем на форме и отображаем форму в режиме для чтения (`globalReadOnly`).

Дополнительный контроллер `concurencyState`, который принимает id объекта и проверяет его состояние блокировки. Если объект не заблокирован (нет блокировки, либо она просрочена), то блокирует объект от имени текущего пользователя. Если объект заблокирован текущим пользователем, обновляет *blockDate* на *new Date()*. Возвращает состояние блокировки.

**Поведение формы объекта**:

Если в шаблон передана инфа о блокировке, то добавляется скрипт, который периодически (с периодом `registry.concurencyCheck/2`) обращается к контроллеру `concurencyState`.

Если в ответ приходит информация о блокировке другим пользователем - она отображается (обновляем сообщение), если произошел перехват блокировки текущим пользователем - форма перезагружается (она при этом отображается в режиме для редактирования).

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

### Пример:

```
"geomap": {
   "globals": {
      "hidePageHead": true, //отобразить шапку
      "hidePageSidebar": false, //скрыть боковое меню 
      ...
    }
 }
```

### Следующая страница: [Полный пример файла deploy.json](/docs/ru/2_system_description/platform_configuration/deploy_ex.md)

--------------------------------------------------------------------------  


 #### [Licence](/LICENCE.md) &ensp;  [Contact us](https://iondv.com) &ensp;  [English](/docs/en/2_system_description/platform_configuration/deploy_modules.md)   &ensp; [FAQs](/faqs.md) 
 
 --------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.  
All rights reserved. 