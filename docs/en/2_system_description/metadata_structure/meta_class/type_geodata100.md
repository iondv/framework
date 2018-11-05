### The previous page: [User type](/docs/en/2_system_description/metadata_structure/meta_class/type_user17.md)
# Geodata

The **Geodata** attribute type - stores coordinates with unique views for creating and editing forms. The value of the "type" property for Geodata attribute type is 100.

## Description:

If the attribute has a geodata type and the coordinates are specified on the object creation/editing form, then the Map field with coordinates and the "Change" button are displayed. If the coordinates aren't specified, then only the "Set coordinates" button is displayed.

## Specificity of work 

If the `"autoassigned"` property is set: `true` and the data is not specified when creating a form, then coordinates must be determined automatically from the address data from the attributes specified in the geodata properties.

## Attributes on the form

Use the geo-object view type to display the attribute of the geodata type on the form. 
There are three display mode for geo-object in the meta view:

* **Map (0)** - geo-object is displayed on the map;
* **Search by address (1)** - geo-object is displayed on the map, where you can search by address and move the geo-object. Or you can simply specify the coordinates of the geo-object;
* **Canvas (2)** - geo-object is displayed on the map, you can set an interactive display of the geo-object.

The display mode is set by specifying the corresponding number in the field `"mode"` in **Meta view of the class**: 

"mode": 0, – Map display mode

"mode": 1, – Search by address display mode

"mode": 2, – Canvas display mode

## Storage in the DB
The attribute data of the geodata type is stored in the BD as a comma-separated string with values, a string as a JSON-array or a string as a JSON-object. 

### Example of attribute structure in a Map (0) in JSON: 

In the logic name (`caption`) of the attribute you can set the display mode (`mode`) to distinguish attributes of the same type.

```
{
      "orderNumber": 20,
      "name": "class_geodata",
      "caption": "Geodata [100] mode [0] - Map",
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
### Example of attribute structure in a Search by address (1) in JSON:
```
{
      "orderNumber": 30,
      "name": "class_geodata1",
      "caption": "Геоданные [100] mode [1] - Search by address",
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
### Example of attribute structure in a Canvas (2) in JSON:
```
{
      "orderNumber": 40,
      "name": "class_geodata2",
      "caption": "Geodata [100] mode [2] - Canvas",
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

### The next page: [Schedule](/docs/en/2_system_description/metadata_structure/meta_class/type_schedule210.md) 
--------------------------------------------------------------------------  


 #### [Licence](/LICENCE.md) &ensp;  [Contact us](https://iondv.com) &ensp;  [Russian](/docs/ru/2_system_description/metadata_structure/meta_class/type_geodata100.md)   &ensp; [FAQs](/faqs.md)          



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.   
All rights reserved. 