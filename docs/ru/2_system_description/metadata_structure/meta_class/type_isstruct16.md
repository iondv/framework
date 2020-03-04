#### [Оглавление](/docs/ru/index.md)

### Предыдущая страница: [Тип "Коллекция"](type_collection14.md)

# Тип "Структура [16]"

**Структура** - способ отображения связанных объектов (ссылок). Если у поля указано структура, то данный тип атрибута нужен для уменьшения действий при заведении модели, при заранее известных типовых классах, атрибуты которых используются во многих других классах.   
Для класса-структуры в основной части меты класса задается значение `true` в поле `"isStruct"`.    


Для атрибутов типа "Структура [16]" в мете представлений создания и изменения используется тип "Группа [0]".  Если не указывать поля у группы, они создаются автоматически по мете.  В представлениях списка нет необходимости делать колонки для атрибутов-структур, в объекте не будет такого свойства, а будут соответствующие атрибуты класса-структуры. Для них можно добавить колонки.

_NB: Объекты класса-структуры не создаются!_

## Пример

**Класс-структура:**

```
{
  "isStruct": true,
  "key": [
    "id"
  ],
  "semantic": "",
  "name": "is_struct",
  "version": "",
  "caption": "\"isStruct\" класс-структура",
  "ancestor": null,
  "container": null,
  "creationTracker": "",
  "changeTracker": "",
  "history": 0,
  "journaling": false,
  "compositeIndexes": null,
  "properties": [
    {
      "orderNumber": 10,
      "name": "id",
      "caption": "Идентификатор",
      "type": 12,
      "size": null,
      "decimals": 0,
      "allowedFileTypes": null,
      "maxFileCount": 0,
      "nullable": false,
      "readonly": false,
      "indexed": false,
      "unique": true,
      "autoassigned": true,
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
    {
      "orderNumber": 20,
      "name": "last_name",
      "caption": "Фамилия",
      "type": 0,
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
    {
      "orderNumber": 30,
      "name": "first_name",
      "caption": "Имя",
      "type": 0,
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
    {
      "orderNumber": 40,
      "name": "patronymic",
      "caption": "Отчество",
      "type": 0,
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
    {
      "orderNumber": 50,
      "name": "date",
      "caption": "Дата рождения",
      "type": 9,
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
  ]
}
```

**Класс с атрибутом типа "Структура [16]"**

```
{
  "isStruct": false,
  "key": [
    "id"
  ],
  "semantic": "",
  "name": "struct",
  "version": "",
  "caption": "Класс \"Структура [16]\" (класс с типом атрибута 16 - структура)",
  "ancestor": null,
  "container": null,
  "creationTracker": "",
  "changeTracker": "",
  "history": 0,
  "journaling": false,
  "compositeIndexes": null,
  "properties": [
    {
      "orderNumber": 10,
      "name": "id",
      "caption": "Идентификатор",
      "type": 12,
      "size": null,
      "decimals": 0,
      "allowedFileTypes": null,
      "maxFileCount": 0,
      "nullable": false,
      "readonly": false,
      "indexed": false,
      "unique": true,
      "autoassigned": true,
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
    {
      "orderNumber": 20,
      "name": "struct",
      "caption": "Класс \"Структура [16]\"",
      "type": 16,
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
      "refClass": "is_struct",
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
  ]
}
```

Объект класса с атрибутом-структурой в базе:

```
{
    "_id" : ObjectId("57c3e46fd53ecd50123cc4f5"),
    "struct$id" : "5f421610-6dba-11e6-874f-1b746e204b07",
    "struct$last_name" : "Мирошниченко",
    "struct$first_name" : "Ирина",
    "struct$patronymic" : "Львовна",
    "struct$date" : ISODate("1978-07-13T14:00:00.000Z"),
    "id" : "5f41ef00-6dba-11e6-874f-1b746e204b07",
    "_class" : "struct@develop-and-test",
    "_classVer" : ""
}
```




### Следующая страница: [Пользовательский тип](type_user17.md)
--------------------------------------------------------------------------  


 #### [Licence](/LICENSE) &ensp;  [Contact us](https://iondv.com/portal/contacts) &ensp;  [English](/docs/en/2_system_description/metadata_structure/meta_class/type_isstruct16.md)   &ensp;
<div><img src="https://mc.iondv.com/watch/local/docs/framework" style="position:absolute; left:-9999px;" height=1 width=1 alt="iondv metrics"></div>         



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.
All rights reserved. 