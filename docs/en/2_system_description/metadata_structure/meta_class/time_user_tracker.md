#### [Content](/docs/en/index.md)

### The previous page: [Ancestor](ancestor.md)

# Time tag of created objects and committed changes

These are the following fields of the main part of the meta class:

1. `"creationTracker"` - **Time tag of created objects**:  allows you to save the date/time of creation of the object in the class. It requires the corresponding class attribute, `"name"`of which should be entered into this field.
2. `"changeTracker"` - **Time tag of committed changes**: allows you to save the date/time of committed changes of the object in the class. It requires the corresponding class attribute, `"name"`of which be entered into this field.

### Example:
```
{
  "isStruct": false,
  "key": "id",
  "semantic": "rtrs",
  "name": "digitTv",
  "caption": "Digital TV",
  "ancestor": null,
  "container": null,
  "creationTracker": "createDate",
  "changeTracker": "modifeDate",
  "properties": [
    {
      "orderNumber": 60,
      "name": "createDate",
      "caption": "Time tag of created objects",
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
      "caption": "Time tag of committed changes",
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

# Tag of the user who created and changed the object

1. `"creatorTracker"` - **Tag of the user who created the object**: allows you to save the name of the user who created the object in the class. It requires the corresponding class attribute, `"name"`of which be entered into this field.  

2. `"editorTracker"` - **Tag of the user who changed the object**: allows you to save the name of the user who changed the object in the class. It requires the corresponding class attribute, `"name"`of which be entered into this field.  

### Example:
```
{
  "isStruct": false,
  "key": [
    "guid"
  ],
  "semantic": "name",
  "name": "basicObj",
  "abstract": true,
  "version": "31",
  "caption": "Basic object",
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
    {
      "orderNumber": 20,
      "name": "creator",
      "caption": "Tag of the user who created the object",
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
      "caption": "Tag of the user who changed the object",
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

### The next page: [Journaling the changes](journaling.md) 
--------------------------------------------------------------------------  


 #### [Licence](/LICENSE) &ensp;  [Contact us](https://iondv.com/portal/contacts) &ensp;  [Russian](/docs/ru/2_system_description/metadata_structure/meta_class/time_user_tracker.md)   &ensp;
<div><img src="https://mc.iondv.com/watch/local/docs/framework" style="position:absolute; left:-9999px;" height=1 width=1 alt="iondv metrics"></div>       



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.  
All rights reserved. 