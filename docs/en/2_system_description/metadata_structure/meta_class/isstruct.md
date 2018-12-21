#### [Content](/docs/en/index.md)

### The previous page: [Meta class - general part](/docs/en/2_system_description/metadata_structure/meta_class/meta_class_main.md)

# Structure

**Structure** - is a way of displaying related attributes of the structure-class. It simplifies the procedure of creating a meta class. The "true" value in the `"isStruct"` field means that this meta class is a structure-class. If the meta class has an attribute of the "structure [16]" type and in the "refClass" field the name of the structure-class, than it displays all the attributes of the structure-class.  

 Use the type "Group [0]" for the attributes of the "Structure [16]" type in the create and edit view modes. If you do not specify the fields in the group, they will be created automatically according to the meta. In the list view, there is no need to create columns for structure attributes, because the object will not have such property, but it will have the corresponding attributes of the structure-class. For them, you can add columns.

**NB:** Objects of structure-class are not created!

### Example

**Structure-class:**

```
{
  "isStruct": true,
  "key": [
    "id"
  ],
  "semantic": "",
  "name": "is_struct",
  "version": "",
  "caption": "\"isStruct\" structure-class",
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
      "caption": "Identifier",
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
      "caption": "Surname",
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
      "caption": "Name",
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
      "caption": "Patronymic",
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
      "caption": "Date of birth ",
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

**Meta class with an attribute of the "Structure [16]" type**

```
{
  "isStruct": false,
  "key": [
    "id"
  ],
  "semantic": "",
  "name": "struct",
  "version": "",
  "caption": "Class \"Structure [16]\" (class with the attribute type 16 - structure)",
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
      "caption": "Identifier",
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
      "caption": "Class \"Structure [16]\"",
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
Class object with an attribute of structure type in DB:

```
{
    "_id" : ObjectId("57c3e46fd53ecd50123cc4f5"),
    "struct$id" : "5f421610-6dba-11e6-874f-1b746e204b07",
    "struct$last_name" : "Gagarin",
    "struct$first_name" : "Yuri",
    "struct$patronymic" : "Alekseyevich",
    "struct$date" : ISODate("1978-07-13T14:00:00.000Z"),
    "id" : "5f41ef00-6dba-11e6-874f-1b746e204b07",
    "_class" : "struct@develop-and-test",
    "_classVer" : ""
}
```



### The next page: [Key attributes](/docs/en/2_system_description/metadata_structure/meta_class/key.md) in Meta class - general part 
--------------------------------------------------------------------------  


 #### [Licence](/LICENCE.md) &ensp;  [Contact us](https://iondv.com) &ensp;  [English](/docs/en/2_system_description/metadata_structure/meta_class/type_isstruct16.md)   &ensp; [FAQs](/faqs.md)          



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.  
All rights reserved. 