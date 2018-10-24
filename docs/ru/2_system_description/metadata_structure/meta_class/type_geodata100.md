### Предыдущая страница: [Пользовательский тип](/docs/ru/2_system_description/metadata_structure/meta_class/type_user17.md)
# Геоданные

Тип атрибута **геокоординаты** - является атрибутом, который хранит координаты с уникальными представлениями для создания и редактирования. 

## Описание:

1. Если в объекте задан тип `геокоординаты` и его данные, то на форме отображается поле карты с координатами и кнопка "Изменить".
2. Если данные не заданы - то карта не отображается, а только кнопка "Задать координаты".
3. *Особенности работы*. Если задано свойство "autoassigned": true и не заданы данные при создании формы - то нужно определять координаты автоматически по данным адреса из атрибутов указанных в свойствах геометки.

Значение свойства `"type"` у атрибута геокоординат = 100.  

## Способы отображения на форме

У полей типа `Геообъект` есть три режима отображения `"mode"`:   

* **Карта (0)** - отображаем геообъект на карте,
* **Поиск по адресу (1)** - отображаем геообъект на карте, можем по адресу найти место на карте и переместить туда геообъект, можем задать координаты геообъекта, 
* **Холст (2)** - отображаем геообъект на карте, можем по адресу найти место на карте и переместить туда геообъект, можем задать координаты геообъекта

## Способы хранения в БД
Строка со значениями через запятую; строка в формате JSON с массивом; строка в формет JSON с объектом. 

### Пример структуры атрибута в режиме Карта (0): 
```
{
      "orderNumber": 20,
      "name": "class_geodata",
      "caption": "Геоданные [100] mode [0] - Карта",
      "type": 100,
      "size": null,
      "decimals": 0,
      "allowedFileTypes": null,
      "maxFileCount": 0,
      "nullable": true,
      "readonly": false,
      "indexed": false,
      "unique": false,
      "autoassigned": false,
      "hint": null,
      "defaultValue": null,
      "refClass": "",
      "itemsClass": "",
      "backRef": "",
      "backColl": "",
      "binding": "",
      "semantic": null,
      "selConditions": [],
      "selSorting": [],
      "selectionProvider": null,
      "indexSearch": false,
      "eagerLoading": false,
      "formula": null
    },

```
### Пример структуры атрибута в режиме Поиск по адресу (1):
```
{
      "orderNumber": 30,
      "name": "class_geodata1",
      "caption": "Геоданные [100] mode [1] - Поиск по адресу",
      "type": 100,
      "size": null,
      "decimals": 0,
      "allowedFileTypes": null,
      "maxFileCount": 0,
      "nullable": true,
      "readonly": false,
      "indexed": false,
      "unique": false,
      "autoassigned": false,
      "hint": null,
      "defaultValue": null,
      "refClass": "",
      "itemsClass": "",
      "backRef": "",
      "backColl": "",
      "binding": "",
      "semantic": null,
      "selConditions": [],
      "selSorting": [],
      "selectionProvider": null,
      "indexSearch": false,
      "eagerLoading": false,
      "formula": null
    },
```
### Пример структуры атрибута в режиме Холст (2):
```
{
      "orderNumber": 40,
      "name": "class_geodata2",
      "caption": "Геоданные [100] mode [2] - Холст",
      "type": 100,
      "size": null,
      "decimals": 0,
      "allowedFileTypes": null,
      "maxFileCount": 0,
      "nullable": true,
      "readonly": false,
      "indexed": false,
      "unique": false,
      "autoassigned": false,
      "hint": null,
      "defaultValue": null,
      "refClass": "",
      "itemsClass": "",
      "backRef": "",
      "backColl": "",
      "binding": "",
      "semantic": null,
      "selConditions": [],
      "selSorting": [],
      "selectionProvider": null,
      "indexSearch": false,
      "eagerLoading": false,
      "formula": null
    }
```
### Следующая страница: [Расписание](/docs/ru/2_system_description/metadata_structure/meta_class/type_schedule210.md) 
--------------------------------------------------------------------------  


 #### [Licence](/LICENCE.md) &ensp;  [Contact us](https://iondv.com) &ensp;  [English](/docs/en/2_system_description/metadata_structure/meta_class/type_geodata100.md)   &ensp; [FAQs](/faqs.md)          



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.
All rights reserved. 