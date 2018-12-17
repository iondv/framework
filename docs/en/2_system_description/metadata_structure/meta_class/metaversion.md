#### [Content](/docs/en/index.md)

### The previous page: [Criteria of abstraction for class](/docs/en/2_system_description/metadata_structure/meta_class/abstract.md)

# Versioning
 
 **Versioning** - greatly reduces the work required to manage the changes that occurs with an object. Versioning allows you to store multiple versions of metadata. When you change and save the object, it acquires its version, that contains proceeded changes. So, versioning provides the ability to work with different versions of the same objects.
 
 
Versioning is set in the `" version "` field of the general part of the meta class. Add the `version` property (" version ": 2) to the attribute to change the meta version.
 
## How it works
When downloading metadata, if the attribute has a `"version"` property, e.x. ("version": 2), then meta will be downloaded with the version 2, otherwise version 1.

 ```
 {
   "isStruct": false,
   "key": "id",
   "semantic": "caption",
   "name": "ion_filter",
   "caption": "Filters",
   "ancestor": null,
   "container": null,
   "creationTracker": "",
   "changeTracker": "",
   "version" : 2
  
 }
 
 ```
 
 When creating objects, the latest version of the metadata from the current ones in the DB will be added to these objects. You can edit objects based on the saved version.
 
 ### Example of saved objects with different versions in DB:
 
 ```
 {
     "_id" : ObjectId("567cfa1eb869fc2833690ea4"),
     "id" : 24006,
     "class" : "ALL",
     "caption" : "11",
     "html" : "",
     "filter" : "[\"{\\\"property\\\":\\\"contact\\\",\\\"operation\\\":20,\\\"value\\\":\\\"11\\\",\\\"title\\\":\\\"Contact information contains 11\\\",\\\"type\\\":7}\"]",
     "period" : "2015-12-08,2016-02-05",
     "version" : 1,
     "semanticTitle" : "11 "
 }
 
 {
     "_id" : ObjectId("56944e5cb73f51ec182c7369"),
     "class" : "ALL",
     "caption" : "fffffff",
     "filter" : "[\"{\\\"property\\\":\\\"class\\\",\\\"operation\\\":0,\\\"value\\\":\\\"fff\\\",\\\"title\\\":\\\"Filter class equals fff\\\",\\\"type\\\":1}\"]",
     "version" : 2,
     "id" : NaN,
     "semanticTitle" : "fffffff "
 }
 ```
 
 
## Code realization 
 
When processing the meta classes, the data is divided into versions. The names of the versioned classes have the following names structure: “<class_name>_<version_number>”. For example, ion_filter_1, ion_filter_2 - сlass ion_filter of the version  №1 and №2, respectively.

Sample of object data occurs according to the version. The version of the object is passed as the `version` parameter of the request to open the object.


### The next page: [Ancestor](/docs/en/2_system_description/metadata_structure/meta_class/ancestor.md)
--------------------------------------------------------------------------  


 #### [Licence](/LICENCE.md) &ensp;  [Contact us](https://iondv.com) &ensp;  [Russian](/docs/ru/2_system_description/metadata_structure/meta_class/metaversion.md)   &ensp; [FAQs](/faqs.md)          



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.  
All rights reserved. 