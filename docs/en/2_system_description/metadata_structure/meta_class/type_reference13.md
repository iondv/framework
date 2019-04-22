#### [Content](/docs/en/index.md)

### The previous page:[Attribute types](/docs/en/2_system_description/metadata_structure/meta_class/property_types.md)

# Reference

## Description

**Reference** - is a data type that stores a simple value and that system interprets as a reference to the key attribute of an object of another class. This object can be an object of any class including the original one.

Values in the attribute of the reference type are displayed in accordance with the semantics, specified in the reference class of this attribute.

The ability to replace an object by a back reference is determined by the `nullable` property of the reference attribute. When replacing an object, you lose the reference and the object by reference will be deleted when you try to change the reference from the collection with a back reference.

See the full description of the `Reference` type in the attribute part of the meta class -[**Reference and Back reference**](/docs/en/2_system_description/metadata_structure/meta_class/atr_ref_backref.md).

## Types of connections of the "reference" type

Reference type in context of the attribute part of the meta class:

1. `one-to-many` - the classic connection of the heir object to the ancestor object. Define a reference and specify the class of the nested object, after connections are created and a reference stored as a separate entities in the DB.
2. `one-to-one` - similar to the one-to-many connection, means the presence of a reference and a nested object with a bonded reference to the source object. In the link, you must specify a bonded reference, and in the bonded reference you must indicate the reference attribute of the nested object by which the connection is formed. Be sure to specify the `"unique ": true` property in the reference attribute. 



### The next page: [Collection](/docs/en/2_system_description/metadata_structure/meta_class/type_collection14.md)
--------------------------------------------------------------------------  


 #### [Licence](/LICENSE) &ensp;  [Contact us](https://iondv.com) &ensp;  [English](/docs/en/2_system_description/metadata_structure/meta_class/type_reference13.md)   &ensp; [FAQs](/faqs.md)   <div><img src="https://mc.iondv.com/watch/local/docs/framework" style="position:absolute; left:-9999px;" height=1 width=1 alt="iondv metrics"></div>       



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.  
All rights reserved. 