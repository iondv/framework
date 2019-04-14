#### [Content](/docs/en/index.md)

### Back: [Attribute types](/docs/en/2_system_description/metadata_structure/meta_class/property_types.md)

# Attribute type date/time

## Description

**Attribute type date/time** - is the date in ISODate format. It can be displayed as a date, or as a date-time.

## "Date" and "Time" modes

The modes of date and time types are set in the `mode` of attribute in the meta view:

* 0 - **Actual** (by default). Date is stored without time zone. When displayed, it is converted to the user's time zone. That means 01/01/2017 the preset in Moscow in Paris will be displayed as 12/31/2016.

* 1 - **Date with time zone**. The date is stored with the time zone in which it was set. When displayed, it is brought to the preset time zone. That means the preset date 01/01/2017 in Paris, in Moscow will also be displayed - 01/01/2017. But it is more correct to display it with the indication of the time zone, i.e. 01/01/2017 (+11). When editing, the time zone is overlapped by the time zone of the new date. In this case, the ACTUAL time is stored in the DB, which must be taken into account in the sample conditions specified by the hardcode in the meta.

* 2 - **Universal**. The date is saved as if it was set in UTC. So it isn't converted to the UTC, but saves in the UTC just as it was entered. Those. if we entered Moscow time in Moscow on 01/01/2017, then it will remain as "01/01/2017 00:00 UTC". It is displayed in any time zone just as it was entered. Use for dates in the details (date of birth, date of issue of the document, etc.), i.e. when the formal moment of time is important or when it is not necessary to consider time in general.

### Example

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
  "caption": "Class \"Date/Time [9]\"",
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
      "caption": "Select date [120]",
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
      "caption": "Actual date",
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
      "caption": "Date with time zone",
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
      "caption": "Universal date",
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


 #### [Licence](/LICENCE.md) &ensp;  [Contact us](https://iondv.com) &ensp;  [Russian](/docs/ru/2_system_description/metadata_structure/meta_class/type_datetime9.md)   &ensp; [FAQs](/faqs.md)   <div><img src="https://mc.iondv.com/watch/local/docs/framework" style="position:absolute; left:-9999px;" height=1 width=1 alt="iondv metrics"></div>       



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.  
All rights reserved. 