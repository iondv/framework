#### [Content](/docs/en/index.md)

### The previous page: [Meta navigation](/docs/en/2_system_description/metadata_structure/meta_view/meta_navigation.md)

# Meta section navigation

### JSON
```
{
  "code": "class_boolean",
  "orderNumber": 0,
  "type": 0,
  "title": "",
  "caption": "Class \"Boolean [10]\"",
  "classname": null,
  "container": null,
  "collection": null,
  "url": null,
  "hint": null,
  "conditions": [],
  "sorting": [],
  "pathChains": [],
  "metaVersion": "2.0.7"
}
```
## Описание полей

| Field        | Name  | Acceptable values                                                                                                                                                                              | Description                                                                                                 |
|:------------|:----------------------|:-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|:---------------------------------------------------------------------------------------------------------|
| `"code"` | **System name**     | Строка латиницей, без пробелов                                                                                                                                                                                          | Задает в том числе первую часть имени файла меты секции навигации, служебное имя                         |
| `"orderNumber"` | **Order number**    | Целое                                                                                                                                                                                          | Порядковый номер секции навигации, по отношению к остальным                                              |
| `"type"`        | **Type**               | _Группа: 0_                          | Тип. Задает логику работы пункта меню, выводимые при переходе/активации значения. Накладывает ограничения на прочие поля меты узла навигации.                                                                                                                                            |
|                 |                       | _Страница класса: 1_                 |                                                                                                                                                                                                                                                                                          |
|                 |                       | _Страница контейнера: 2_             |                                                                                                                                                                                                                                                                                          |
|                 |                       | _Гиперссылка: 3_                     |                                                                                                                                                                                                                                                                                          |
| `"classname"` | **Class name**    | Строка или null                                                                                                                                                                                           | Не указывается если "type": 0                                                  |
| `"container"` | **Container ID**    | Строка или null                                                                                                                                                                                          | Не указывается если "type": 0                                                  |
| `"collection"` | **Collection attribute**    | Строка или null                                                                                                                                                                                         | Не указывается если "type": 0                                                  |
| `"url"` | **URL**               | Гиперссылка (принимает любые строки)                                                                                                                                                                                           | Не указывается если "type": 0                                                  |
| `"hint"` | **Hint**         | Строка                                                                                                                                                                                           | Не указывается если "type": 0                                                  |
| `"conditions"` | **Sample conditions**   | Массив объектов                                                                                                                                                                                           | Не указывается если "type": 0                                                  |
| `"sorting"` | **Sorting**        | Массив объектов                                                                                                                                                                                           | Не указывается если "type": 0                                                  |
| `"pathChains"` | **Хлебные крошки**    | Массив объектов                                                                                                                                                                                           | Не указывается если "type": 0                                                  |
| `"metaVersion"` | **Metaversion**    | Строка                                                                                                                                                                                           | Версия метаданных                                               |

## Structure in mongoDB (registry)
```
{
    "_id" : ObjectId("578f07aa0ce0024ce143e71e"),
    "code" : "class_boolean",
    "orderNumber" : 0,
    "type" : 0,
    "caption" : "Класс \"Логический [10]\"",
    "classname" : "",
    "container" : null,
    "collection" : null,
    "url" : null,
    "hint" : null,
    "conditions" : [],
    "sorting" : [],
    "pathChains" : [],
    "itemType" : "node",
    "section" : "",
    "namespace" : ""
}
```

### The next page: [Meta node navigation](/docs/en/2_system_description/metadata_structure/meta_navigation/navigation_nodes.md)

--------------------------------------------------------------------------  


 #### [Licence](/LICENCE.md) &ensp;  [Contact us](https://iondv.com) &ensp;  [Russian](/docs/ru/2_system_description/metadata_structure/meta_navigation/navigation_section.md)   &ensp; [FAQs](/faqs.md)          



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.  
All rights reserved. 