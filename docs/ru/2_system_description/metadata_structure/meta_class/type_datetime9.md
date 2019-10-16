#### [Оглавление](/docs/ru/index.md)

### Назад: [Типы атрибутов](property_types.md)

# Тип атрибута дата/время

## Описание

**Тип атрибута дата/время** - представляет собой дату в формате ISODate. Может быть отображена как дата, либо как дата-время.

## Режимы даты и времени

Режимы хранения даты задаются в параметре `mode` атрибутивной части меты класса. 
Доступно 3 режима хранения даты - реальный, локализованный, универсальный:

* 0 - **Реальный** (по умолчанию). Дата хранится без информации о часовом поясе. При отображении приводится к часовому поясу пользователя. Т.е. 01.01.2017 заданное на Камчатке в Хабаровске отобразится как 31.12.2016.

* 1 - **Локализованный**. Дата хранится вместе с часовым поясом, в котором была задана. При отображении приводится к этому часовому поясу. Т.е. 01.01.2017 заданное на Камчатке, в Хабаровске отобразиться так же - 01.01.2017. Но правильно его отображать с указанием часового пояса, т.е. 01.01.2017 (+11). При редактировании часовой пояс обновляется часовым поясом новой даты. При этом в БД хранится РЕАЛЬНЫЙ момент времени, что нужно учитывать в условиях выборки задаваемых хардкодом в мете. 

* 2 - **Универсальный**. Дата сохраняется как если бы она задавалась в UTC. Т.е. не приводится к UTC, а сохраняется в UTC так же, как была введена. Т.е. если мы в Хабаровске ввели 01.01.2017 по Хабаровску, то сохранится она как "01.01.2017 00:00 UTC", а не как "31.12.2016 14:00 UTC". Отображается в любом часовом поясе так же, как была введена. Использовать для дат в реквизитах (дата рождения, дата выдачи документа и т.д.), т.е. когда важен не реальный, а формальный момент времени. Либо, когда не нужно учитывать время вообще.

### Пример

```
{
  "isStruct": false,
  "metaVersion": "2.0.7",
  "key": [
    "id"
  ],
  "semantic": "",
  "name": "class_datetime",
  "version": "",
  "caption": "Класс \"Дата/Время [9]\"",
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
      "size": 24,
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
      "name": "data_data",
      "caption": "Выбор даты [120]",
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
    },
    {
      "orderNumber": 30,
      "name": "data_datatime",
      "caption": "Реальная дата",
      "type": 9,
      "mode": 0,
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
      "name": "data_datatime1",
      "caption": "Дата с часовым поясом",
      "type": 9,
      "mode": 1,
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
      "name": "data_datatime2",
      "caption": "Универсальная дата",
      "type": 9,
      "mode": 2,
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

--------------------------------------------------------------------------  


 #### [Licence](/LICENSE) &ensp;  [Contact us](https://iondv.com/portal/contacts) &ensp;  [English](/docs/en/2_system_description/metadata_structure/meta_class/type_datetime9.md)   &ensp;
<div><img src="https://mc.iondv.com/watch/local/docs/framework" style="position:absolute; left:-9999px;" height=1 width=1 alt="iondv metrics"></div>         



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.  
All rights reserved. 