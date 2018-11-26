#### [Content](/docs/en/index.md)

### The previous page: [Meta view - view types](/docs/en/2_system_description/metadata_structure/meta_view/view_types.md)

# Meta navigation 

**Meta navigation** - adjusts the position of elements in the navigation block. Meta navigation is divided into meta nodes navigation and meta section navigation.

## Meta section navigation

[**Meta section navigation**](/docs/en/2_system_description/metadata_structure/meta_navigation/navigation_section.md) consists of `"name" + .section.json` in the `navigation` directory. For example: `workflow.section.json`. 

## Meta node navigation

[**Meta node navigation**](/docs/en/2_system_description/metadata_structure/meta_navigation/navigation_nodes.md) consists of:

* For the first-order navigation nodes - those nodes that are directly in the navigation section: `"code"`+ `.json` in a directory whose name is the same as the file name of the navigation section to which the navigation node belongs. 

_Exapmle_: In the `navigation` directory there is a file of a navigation section - `simpleTypes.section.json`. And there is a navigation node - `classString.json` in the `simpleTypes` directory. The navigation node file will have a path: `navigation\simpleTypes\classString.json`.
     
* For second order navigation nodes - those nodes that are of the group type (a special type of navigation nodes, the `type` field in which contains the value `0`).

The difference is that the `"code"` field of such nodes is composite and consists of the `"code"` field of the group and personal name. 

_Example_: `navigation\relations\classReference.refBase.json`. This is the file of the navigation node `refBase`,which is located in the `classReferense` of the `relations` navigation section.

### The next page: [Meta section navigation](/docs/en/2_system_description/metadata_structure/meta_navigation/navigation_section.md)

--------------------------------------------------------------------------  


 #### [Licence](/LICENCE.md) &ensp;  [Contact us](https://iondv.com) &ensp;  [Russian](/docs/ru/2_system_description/metadata_structure/meta_navigation/meta_navigation.md)   &ensp; [FAQs](/faqs.md)          



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.  
All rights reserved. 