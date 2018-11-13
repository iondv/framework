# Schema of the main types of metadata

**Metadata (Meta)** - a complex of JSON files that describe the set of structures, which the app operates, ways of displaying the data structures in the user interface and navigation on them, as well as displaying the application configuration files.

## Types of meta files

1. Meta class
2. Meta view
3. Meta navigation: meta string navigation, meta section navigation
4. Meta report
5. Meta admin
6. Meta work-flows 
7. Geometa 
8. Meta security 

## Structure of the meta main types

![shema_eng](https://i.imgur.com/TaIF23F.png)  

The structure of the main types of meta can be described as follows:

**Meta class** is the main source of data generation in the application.  A meta class is composed of the attributes (attribute part) and of the class parameters (general part). Attributes are the objects of the "properties" field of the general part, which contains fields relevant to the structure of the meta class and to the data processing in this structure.  

Meta class is the basis for meta views, meta navigation, meta reports, meta business processes, etc.  

**Meta view** allows to specify the desired set of attributes for the class to be displayed on the form according to the type of the view form (the form of the list view - `list.json`, of create view -` create.json`, of change view - `item.json `). Also it allows to indicate redefined and (or) complemented properties specified in the meta class of this attribute. 

>Meta class + Class attributes = Display attributes on the form (the user interface)

 
**Meta navigation** adjusts the position of elements in the navigation block. The meta navigation is divided into the meta node navigation and the meta section navigation.

## Name of meta files: 


| **Meta class**                | **Meta view**          | **Meta navigation**                           |                                                                                                                                                              
|:------------------------------|:-----------------------|:------------------------------------------|
| Composed of the field `"name"` of the general part of the meta class + `.class.json` and located in the `meta` directory. Ex. `adress.class.json`.   |The name of the meta view directory shows its meta class. The meta view is located in the `views` directory. It contains directories whose names match the first part of the name of the meta class file. Ex. `adress@project_name`, where `adress` defines the meta class.     | The meta navigation is located in the `navigation` directory. It composed of the `"name"` + `.section.json` and located in the `navigation` directory. Ex. `workflow.section.json`. 
### The next page: [Meta class - general part](/docs/en/2_system_description/metadata_structure/meta_class/meta_class_main.md)

--------------------------------------------------------------------------  


#### [Licence](/LICENCE.md) &ensp;  [Contact us](https://iondv.ru/index.html) &ensp;  [Russian](/docs/ru/2_system_description/metadata_structure/meta_scheme.md) &ensp; [FAQs](/faqs.md)          



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.  
All rights reserved. 