### Предыдущая страница: []()
# Метки времени создания и изменения

Речь идет о следующих полях общей части меты классов:

1. `"creationTracker"` - **Метка времени создания**:  Позволяет сохранять в классе дату/время создания объекта, требует наличия соответствующего атрибута класса, `"name"` которого и вносится в данное поле.
2. `"changeTracker"` - **Метка времени изменения**: Позволяет сохранять в классе дату/время изменения объекта, требует наличия соответствующего атрибута класса, `"name"` которого и вносится в данное поле.

## Пример
```
{
  "isStruct": false,
  "key": "id",
  "semantic": "rtrs",
  "name": "digitTv",
  "caption": "Цифровое ТВ",
  "ancestor": null,
  "container": null,
  "creationTracker": "createDate",
  "changeTracker": "modifeDate",
  "properties": [
    {
      "orderNumber": 60,
      "name": "createDatet",
      "caption": "createDate",
      "type": 9,
      "size": null,
      "decimals": 0,
      "nullable": false,
      "readonly": false,
      "indexed": false,
      "unique": true,
      "autoassigned": true,
      "defaultValue": null,
      "refClass": "",
      "itemsClass": "",
      "backRef": "",
      "backColl": "",
      "binding": "",
      "selConditions": [],
      "selSorting": [],
      "selection_provider": null,
      "indexSearch": false,
      "eagerLoading": false
    },
    {
      "orderNumber": 70,
      "name": "modifeDate",
      "caption": "modifeDate",
      "type": 9,
      "size": null,
      "decimals": 0,
      "nullable": true,
      "readonly": false,
      "indexed": false,
      "unique": false,
      "autoassigned": false,
      "defaultValue": null,
      "refClass": "",
      "itemsClass": "",
      "backRef": "",
      "backColl": "",
      "binding": "",
      "selConditions": [],
      "selSorting": [],
      "selection_provider": null,
      "indexSearch": false,
      "eagerLoading": false
    }
]
```

## Изначальная постановка

В ION реализовать возможность определять в доменном классе атрибуты, которые бы хранили информацию о дате-времени создания и изменения объекта и автоматически заполнялись компонентом доступа к данным. Для реализации необходимы доработки во всех основных компонентах системы:  

* В ядре необходимо реализовать свойства (CreationTracker и ChangeTracker) в интерфейсе IClassMeta. Данные свойства будут хранить имена атрибутов хранящих метки времени соответственно создания и редактирования экземпляра класса.
* В modeling и meta реализовать логику установки этих свойств, и чтения их из файлов доменной модели.
* В dao реализовать логику автоматического заполнения соответствующих атрибутов объектов.
* В modeler реализовать возможность указания для доменного класса значений свойств CreationTracker и ChangeTracker

_Пример выдернут из:_ https://ion-dv.atlassian.net/browse/IONPORTAL-125   
_Изначальная постановка:_ https://ion-dv.atlassian.net/browse/OFFLINE-25

# Метки пользователя создавшего и измененившего

1. `"creatorTracker"` - **Метка пользователя создавшего**:  Позволяет сохранять в классе имя пользователя, создавшего объект, требует наличия соответствующего атрибута класса, `"name"` которого и вносится в данное поле.

1. `"editorTracker"` - **Метка пользователя изменившего**: Позволяет сохранять в классе имя пользователя, изменившего объект, требует наличия соответствующего атрибута класса, `"name"` которого и вносится в данное поле.

```json
{
  "isStruct": false,
  "key": [
    "guid"
  ],
  "semantic": "name",
  "name": "basicObj",
  "abstract": true,
  "version": "31",
  "caption": "Учетный объект",
  "ancestor": null,
  "cacheDependencies": [
    "basicObj"
  ],
  "container": null,
  "creatorTracker": "creator",
  "editorTracker": "editor",
  "history": 0,
  "journaling": true,
  "compositeIndexes": null,
  "properties": [
    ...
    {
      "orderNumber": 20,
      "name": "creator",
      "caption": "Метка пользователя, создавшего объект",
      "type": 18,
      "size": null,
      "decimals": 0,
      "allowedFileTypes": null,
      "maxFileCount": 0,
      "nullable": true,
      "readonly": false,
      "indexed": false,
      "unique": false,
      "autoassigned": true,
      "hint": "",
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
      "name": "editor",
      "caption": "Метка пользователя, изменившего объект",
      "type": 18,
      "size": null,
      "decimals": 0,
      "allowedFileTypes": null,
      "maxFileCount": 0,
      "nullable": true,
      "readonly": false,
      "indexed": false,
      "unique": false,
      "autoassigned": true,
      "hint": "",
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
  ],
  "metaVersion": "2.0.61"

```

### Следующая страница []()
--------------------------------------------------------------------------  


 #### [Licence](/LICENCE.md) &ensp;  [Contact us](https://iondv.com) &ensp;  [English](/README.md)   &ensp; [FAQs](/faqs.md)          



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.
All rights reserved. 