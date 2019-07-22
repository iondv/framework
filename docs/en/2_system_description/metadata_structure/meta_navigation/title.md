#### [Content](/docs/en/index.md)

### Back: [Meta node navigation](/docs/en/2_system_description/metadata_structure/meta_navigation/navigation_nodes.md)

# Page title - `"title"`

The **"title"** field is used to set the page title, different from the `"caption"` field in the navigation menu. 

## Description

When the page title is formed, firstly the system will use the value of the `"title"` field of the corresponding node navigation. If the `"title"` field is empty (not specified), the `caption` field of the meta navigation node is used to form the page title. When the page title is formed on the selection list pages, the system will use the `"caption"` field for the general part of the meta class.

## JSON

```
{
  "code": "administrations.municipals",
  "orderNumber": 0,
  "type": 1,
  "title": "Administrations of the municipal districts", \\ name should be different from the navigation node of the `"caption"` field 
  "caption": "Municipal districts",
  "classname": "Organisation",
  "container": null,
  "collection": null,
  "url": null,
  "hint": "Administrations list of the municipal districts",
  "conditions": [],
  "sorting": [],
}

```
--------------------------------------------------------------------------  


 #### [Licence](/LICENSE) &ensp;  [Contact us](https://iondv.com) &ensp;  [Russian](/docs/ru/2_system_description/metadata_structure/meta_navigation/title.md)   &ensp; [FAQs](/faqs.md)   <div><img src="https://mc.iondv.com/watch/local/docs/framework" style="position:absolute; left:-9999px;" height=1 width=1 alt="iondv metrics"></div>       



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.  
All rights reserved. 