### The previous page: [Attribute types](/docs/en/2_system_description/metadata_structure/meta_class/property_types.md)  

# Attribute indexation

**Attribute indexation** is required to accelerate the search. Indexing is set manually by assigning the value `true` for the` "indexed" `property, that is:

```
"indexed": true
```

Except for the following attribute types:

1. Indexation is set automatically (regardless of what is specified in the indexation field):

* for key field

* for objects with the `"compositeIndexes": True` field in the general part of the meta class

2. When importing a meta, all attribute objects of the "Reference" type are indexed.

3. Objects of attributes of the "Collection" type are not indexed, because collections are bound to objects in an object, so indexing is not necessary. 

```
NB. The indexation of the attributes of the type "Text" [1] and "HTML" [2] is prohibited. Because the MongoDB has a limit on the size of the indexed value, and the size of the attribute values of these types may exceed the allowable size.
```
### The next page: [Autocompletion](/docs/en/2_system_description/metadata_structure/meta_class/atr_autoassigned.md)
--------------------------------------------------------------------------  


 #### [Licence](/LICENCE.md) &ensp;  [Contact us](https://iondv.com) &ensp;  [Russian](/docs/ru/2_system_description/metadata_structure/meta_class/atr_indexed.md)   &ensp; [FAQs](/faqs.md)          



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.   
All rights reserved. 