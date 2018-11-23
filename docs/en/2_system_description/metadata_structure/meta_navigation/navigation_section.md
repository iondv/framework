#### [Content](/docs/en/index.md)

### The previous page: [Meta navigation](/docs/en/2_system_description/metadata_structure/meta_navigation/meta_navigation.md)

# Meta section navigation

### JSON
```
{
  "code": "class_boolean",
  "orderNumber": 0,
  "type": 0,
  "title": "",
  "caption": "Class \"Boolean [10]\"",
  "classname": null,
  "container": null,
  "collection": null,
  "url": null,
  "hint": null,
  "conditions": [],
  "sorting": [],
  "pathChains": [],
  "metaVersion": "2.0.7"
}
```
## Field description

| Field        | Name  | Acceptable values                                                                                                                                                                              | Description                                                                                                 |
|:------------|:----------------------|:-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|:---------------------------------------------------------------------------------------------------------|
| `"code"` | **System name**     | String in Latin characters with no spaces                                                                                                                                                                                          | Specifies the first part of the file name of the navigation section meta, the system name.             |
| `"orderNumber"` | **Order number**    | Integer                                                                                                                                                                                          | The order number of the navigation section.                                            |
| `"type"`        | **Type**               | _Group: 0_                          | Sets the logic of the menu item, displayed during the activation of its value. It imposes restrictions on other fields of the meta node navigation.                                                                                                                                            |
|                 |                       | _Class page: 1_                 |                                                                                                                                                                                                                                                                                          |
|                 |                       | _Container page: 2_             |                                                                                                                                                                                                                                                                                          |
|                 |                       | _Hyperlink: 3_                     |                                                                                                                                                                                                                                                                                          |
| `"classname"` | **Class name**    | String or null                                                                                                                                                                                           |Does not specify if the "type": 0.                                                  |
| `"container"` | **Container ID**    | String or null                                                                                                                                                                                          |Does not specify if the "type": 0.                                                  |
| `"collection"` | **Collection attribute**    | String or null                                                                                                                                                                                         |Does not specify if the "type": 0.                                                  |
| `"url"` | **URL**               | Hyperlink (any string is acceptable)                                                                                                                                                                                           |Does not specify if the "type": 0.                                                  |
| `"hint"` | **Hint**         | String                                                                                                                                                                                           |Does not specify if the "type": 0.                                                  |
| `"conditions"` | **Sample conditions**   | Array ob objects                                                                                                                                                                                           |Does not specify if the "type": 0.                                                  |
| `"sorting"` | **Sorting**        | Array ob objects                                                                                                                                                                                           |Does not specify if the "type": 0.                                                  |
| `"pathChains"` | **Bread crumbs**    | Array ob objects                                                                                                                                                                                           |Does not specify if the "type": 0.                                                  |
| `"metaVersion"` | **Metaversion**    | String                                                                                                                                                                                           | Version of metadata.                                              |

## Structure in mongoDB (registry)
```
{
    "_id" : ObjectId("578f07aa0ce0024ce143e71e"),
    "code" : "class_boolean",
    "orderNumber" : 0,
    "type" : 0,
    "caption" : "Class \"Boolean [10]\"",
    "classname" : "",
    "container" : null,
    "collection" : null,
    "url" : null,
    "hint" : null,
    "conditions" : [],
    "sorting" : [],
    "pathChains" : [],
    "itemType" : "node",
    "section" : "",
    "namespace" : ""
}
```

### The next page: [Meta node navigation](/docs/en/2_system_description/metadata_structure/meta_navigation/navigation_nodes.md)

--------------------------------------------------------------------------  


 #### [Licence](/LICENCE.md) &ensp;  [Contact us](https://iondv.com) &ensp;  [Russian](/docs/ru/2_system_description/metadata_structure/meta_navigation/navigation_section.md)   &ensp; [FAQs](/faqs.md)          



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.  
All rights reserved. 