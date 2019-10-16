#### [Content](/docs/en/index.md)

### The previous page: [Semantics](semantic.md)

## Criteria of abstraction 

**Criteria of abstraction for a class** -  is used when it is necessary to display the selection list of the base class heirs in the attribute reference. When forming the selection list of classes for creating an object, do not include abstract classes in the list. Set the `true` value in the "abstract" field.

### Example:

```
{
   "name": "SomeClassName",
   "abstract": true
}
```
The class becomes unavailable for initialization at the UI level.

### Example:
```
{
  "isStruct": false,
  "key": [
    "id"
  ],
  "semantic": "value|[|plannedValue|](|dateStart|-|dateEnd|)",
  "name": "indicatorValueBasic",
  "version": "",
  "caption": "Indicator values for the period",
  "ancestor": null,
  "container": null,
  "creationTracker": "",
  "changeTracker": "",
  "history": 0,
  "journaling": true,
  "abstract": true,
  "compositeIndexes": [
    {
      "properties": [
        "indicatorBasic",
        "dateStart",
        "dateEnd"
      ],
      "unique": true
    }
  ],
  "properties": [
...
```


### The next page: [Version](metaversion.md)
--------------------------------------------------------------------------  


 #### [Licence](/LICENSE) &ensp;  [Contact us](https://iondv.com/portal/contacts) &ensp;  [Russian](/docs/ru/2_system_description/metadata_structure/meta_class/abstract.md)   &ensp;
<div><img src="https://mc.iondv.com/watch/local/docs/framework" style="position:absolute; left:-9999px;" height=1 width=1 alt="iondv metrics"></div>       



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.  
All rights reserved. 