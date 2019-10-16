#### [Content](/docs/en/index.md)

### The previous page: [Computable fields](atr_formula.md)

# Cached values of computable attribute

## Description

When you're applying the cached values, the attribute values are calculated during creating and editing an object. Previously calculated values are used for the samples.

### Example 

You have two computable attributes `A` and `B` refering to the collection `C`. The `A` has the cached value and `B` hasn't, then when editing the object, the collection `C` will be pulled twice. First for the attribute `B` at the `securedDataRepo` level to verify the access. Second for the attribute `A` when calcullated into the `dataRepo`. In this case, when reading an object from the database, the cache of the attribute `A` simply does not make sense, since in any case the collection will be selected for the attribute `B`.

## Cached semantics

Set the following property to cache semantics of the objects in meta class:

```
semanticCached: true
```
We recommand you not to use the eager loading for the attributes used in the cached semantics. Also, we recommand you not to use the dates, because they cannot be converted to the user's time zone, since they are cached when editing an object at the `DBAL` level.

## How to configure?

Set the following property in the meta class to cache the value of the computable attribute:

```
cached: true
```
Besides, you can update caches of objects by reference when editing the main object.

Set the following property in the meta class:

```
cacheDependencies: ["refAttr1", "refAttr2.refAttr3", "refAttr2.collAttr4"]
``` 
When configuring the meta class, specify the reference and collections, the caches of the objects in which you need to update when editing an object of this class. Updates are done recursively. If the `refAttr1` attribute is set to update caches in the class object, then the update will start. This setting is inherited in the heir classes.

### Example

```json
{
      "orderNumber": 40,
      "name": "kolStatOps",
      "caption": "Number of stationary security and fire alarms",
      "type": 6,
      "size": null,
      "decimals": 0,
      "allowedFileTypes": null,
      "maxFileCount": 0,
      "nullable": true,
      "readonly": false,
      "indexed": true,
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
      "formula": "count($raionObslu.oktmo_nasPunkta.svyaz.ops,&eq($gops, b), 1)",
      "cached": true
    },
```

The value of this attribute, derived from the formula, is cached. Plus, to update the value when editing an object, firstly update caches of the object by reference: set the `cacheDependencies: `in the meta class of each reference object.

### Example:

```json
{
  "isStruct": false,
  "key": [
    "okato"
  ],
  "semantic": "name",
  "name": "locality",
  "version": "",
  "caption": "Locality",
  "ancestor": null,
  "container": "",
  "creationTracker": "",
  "changeTracker": "",
  "history": 0,
  "journaling": true,
  "compositeIndexes": null,
  "cacheDependencies": ["supOktmo"],
  "properties": [
...
```


### The next page: [Attribute types](property_types.md)
--------------------------------------------------------------------------  


 #### [Licence](/LICENSE) &ensp;  [Contact us](https://iondv.com/portal/contacts) &ensp;  [Russian](/docs/ru/2_system_description/metadata_structure/meta_class/atr_cached_true.md)     &ensp;
<div><img src="https://mc.iondv.com/watch/local/docs/framework" style="position:absolute; left:-9999px;" height=1 width=1 alt="iondv metrics"></div>       



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.  
All rights reserved. 