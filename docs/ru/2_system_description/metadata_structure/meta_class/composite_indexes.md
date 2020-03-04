#### [Оглавление](/docs/ru/index.md)

### Предыдущая страница: [Журналирование изменений](journaling.md)

# Индексация 

**Индексация** - составные уникальные поля. Используется для поиска и контроля целостности данных. 

 В общей части меты классов есть поле `"compositeIndexes"`, которое позволяет задать требование уникальности сочетания полей.

## Описание

Cоставной индекс задается перечислением входящих в него атрибутов и указанием признака уникальности. Когда в классе присутсвует составной индекс, при сохранении объекта в базе проверяется отсутвие одинаковых сочетаний перечисленных полей. То есть значения полей `"protocol"` и `"family"` из примера ниже могут повторятся, но пара значений - всегда уникальна.

### Пример:
```
{
  "isStruct": false,
  "key": [
    "id"
  ],
  "semantic": "protocol|family",
  "name": "refusal",
  "version": "",
  "caption": "Письменные отказы граждан",
  "ancestor": null,
  "container": null,
  "creationTracker": "",
  "changeTracker": "",
  "history": 0,
  "journaling": false,
  "compositeIndexes": [
    {
      "properties": [
        "protocol",
        "family"
      ],
      "unique": true
    }
  ],
  "properties": [
    {
      "orderNumber": 10,
      "name": "id",
      "caption": "Идентификатор",
      "type": 0,
      "size": 24,
      "decimals": 0,
      "allowedFileTypes": null,
      "maxFileCount": 0,
      "nullable": false,
      "readonly": true,
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
      "name": "protocol",
      "caption": "Протокол заседания комиссии",
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
      "selConditions": [],
      "selSorting": [],
      "selectionProvider": null,
      "indexSearch": false,
      "eagerLoading": false,
      "formula": null
    },
    {
      "orderNumber": 31,
      "name": "family",
      "caption": "Семья, поставленная на учет",
      "type": 13,
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
      "refClass": "family",
      "itemsClass": "",
      "backRef": "",
      "backColl": "",
      "binding": "",
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



### Следующая страница: [Атрибуты](meta_class_attribute.md)
--------------------------------------------------------------------------  


 #### [Licence](/LICENSE) &ensp;  [Contact us](https://iondv.com/portal/contacts) &ensp;  [English](/docs/en/2_system_description/metadata_structure/meta_class/composite_indexes.md)   &ensp;
<div><img src="https://mc.iondv.com/watch/local/docs/framework" style="position:absolute; left:-9999px;" height=1 width=1 alt="iondv metrics"></div>         



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.  
All rights reserved. 