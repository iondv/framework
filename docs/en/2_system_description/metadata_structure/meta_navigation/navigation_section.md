#### [Content](/docs/en/index.md)

### The previous page: [Meta navigation](/docs/en/2_system_description/metadata_structure/meta_navigation/meta_navigation.md)

# Meta navigation section

### JSON

```
{
  "caption": "Simple types",
  "name": "simpleTypes",
  "mode": 0,
  "tags": null
}

```
## Field description

| Field        | Name  | Acceptable values                                                                                                                                                                              | Description                                                                                                 |
|:------------|:----------------------|:-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|:---------------------------------------------------------------------------------------------------------|
|`"caption"`      | **Logical name**    | String                        | Name of the navigation section displayed in the interface.                    
| `"name"`        | **System name**     | String in Latin characters with no spaces| Specifies the first part of the file name of the navigation section meta, the system name.  
| `"mode"`        | **Display mode**    | _Menu: 0_                     | Sets the display mode of the menu.    
|                 |                     | _Content: 1_               |                                  
|                 |                     | _Drop down list: 2_       |                                  
|                 |                     | _Hierarchy: 3_                 |                                  
| `"tags"`        | **Tags**            | Array of strings or null.       | Tags. It can define additional properties of the section and affect the view of objects. **To be realized**. 

## Structure in mongoDB (registry)
```
{
    "_id" : ObjectId("578f07aa0ce0024ce143e720"),
    "caption" : "Simple types",
    "name" : "simpleTypes",
    "mode" : 0,
    "tags" : null,
    "itemType" : "section",
    "namespace" : ""
}
```

### The next page: [Meta node navigation](/docs/en/2_system_description/metadata_structure/meta_navigation/navigation_nodes.md)

--------------------------------------------------------------------------  


 #### [Licence](/LICENCE.md) &ensp;  [Contact us](https://iondv.com) &ensp;  [Russian](/docs/ru/2_system_description/metadata_structure/meta_navigation/navigation_section.md)   &ensp; [FAQs](/faqs.md)   <div><img src="https://mc.iondv.com/watch/local/docs/framework" style="position:absolute; left:-9999px;" height=1 width=1 alt="iondv metrics"></div>       



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.  
All rights reserved. 