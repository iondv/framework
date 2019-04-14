#### [Content](/docs/en/index.md)

### The previous page: [Reference](/docs/en/2_system_description/metadata_structure/meta_class/type_reference13.md)

# Collection

## Description 

**Collection** - data type that allows to display the list of other objects in one. The data of the object can be the object of any class including the initial.

All references in the collection are divided with commas. All values of the consequence of the references and commas are stored in the DB.

### Types of connections of the Collection type:
1. `one-to-many` - is the classic connection of the heir object to the ancestor object. Define the container and nested object with the reference to the container. In the container, specify the collection and in the collection specify the reference attribute of the nested object. __See Back refernce__ 
2. `many-to-many` - is determined through a collection without references and a class of nested elements — connections are created in the collection and stored as separate entities in the DB. __See Collection__
3. `back collection` - is similar to the `one-to-many` connection but in the opposite direction - connection from the reference object. Set the connection using the *backColl* property.__See Back collection__

See full description of `Collection` type in the attribute part of the meta class - [**Collection and Back collection**](/docs/en/2_system_description/metadata_structure/meta_class/atr_itemclass_backcoll.md).



### The next page: [Structure](/docs/en/2_system_description/metadata_structure/meta_class/type_isstruct16.md)
--------------------------------------------------------------------------  


 #### [Licence](/LICENSE) &ensp;  [Contact us](https://iondv.com) &ensp;  [Russian](/docs/ru/2_system_description/metadata_structure/meta_class/type_collection14.md)   &ensp; [FAQs](/faqs.md)   <div><img src="https://mc.iondv.com/watch/local/docs/framework" style="position:absolute; left:-9999px;" height=1 width=1 alt="iondv metrics"></div>       



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.
All rights reserved. 