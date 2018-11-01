### The previous page: [Semantics](/docs/en/2_system_descriptionmetadata_structure/meta_class/semantic.md)
## Criteria of abstraction 

**Criteria of abstraction for a class** -  is used when it is necessary by the attribute reference to the base class to display the selection list of its heirs. That means, when forming the selection list of classes for creating an object, do not include abstract classes in the list.

Indicate in the meta class:
```
{
   "name": "SomeClassName",
   "abstract": true
}
```
And the class becomes unavailable for initialization at the UI level.

#### Example:
```
{
  "isStruct": false,
  "key": [
    "id"
  ],
  "semantic": "value|[|plannedValue|](|dateStart|-|dateEnd|)",
  "name": "indicatorValueBasic",
  "version": "",
  "caption": "indicator values for the period",
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


### The next page: [Version](/docs/en/2_system_description/metadata_structure/meta_class/metaversion.md)
--------------------------------------------------------------------------  


 #### [Licence](/LICENCE.md) &ensp;  [Contact us](https://iondv.com) &ensp;  [Russian](/docs/ru/2_system_description/metadata_structure/meta_class/abstract.md)   &ensp; [FAQs](/faqs.md)          



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.  
All rights reserved. 