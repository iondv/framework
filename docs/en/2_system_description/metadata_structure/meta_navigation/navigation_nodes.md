#### [Content](/docs/en/index.md)

### The previous page: [Meta section navigation](/docs/en/2_system_description/metadata_structure/meta_navigation/navigation_section.md)

# Meta node navigation 

## JSON
```
{
  "code": "classDatetime",
  "orderNumber": 0,
  "type": 1,
  "caption": "Class \"Date/Time [9]\"",
  "classname": "classDatetime",
  "container": null,
  "collection": null,
  "url": null,
  "external": true,
  "hint": null,
  "conditions": [],
  "sorting": [],
  "eagerLoading": {
     "list": { // Here you can set the eager loading for the lists
        "internet": ["okato"],
        "someClass1": ["refAttr1", "refAttr2.refAttr3"],
        "someClass2": ["colAttr4"]
     },
     "item": { // Here you can set the eager loading for the edit form
        "internet": ["okato", "standart"],
        "someClass1": ["refAttr1", "refAttr2.refAttr3", "refAttr5", "colAttr4"],
        "someClass2": ["colAttr4"]
     }
   },
  "pathChains": [],
  "searchOptions": null
  "metaVersion": "2.0.7"
}
```
## Field description

| Field            | Name | Acceptable values                  | Description                                                                                                                                                                                                                                                                                 |
|:----------------|:----------------------|:-------------------------------------:|:-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `"code"`        | **System name**     | String in Latin characters with no spaces       |  If the type is - Group (0), then the nested navigation nodes will have a composite system name = "code" of the Grrop - dot(.) - the part that identifies the navigation node.|
| `"orderNumber"` | **Order number**  | Integer                          | Sets the sorting order of menu items in the navigation section.                                                                                                                                                                                                                       |
| `"type"`        | **Type**               | Integer                          | Sets the logic of the menu item, displayed during the activation of its value. It imposes restrictions on other fields of the meta node navigation.                                                                                                                                            |
|                 |                       |  0                 |_Group._ Сombines other navigation nodes on a common basis, but it is **not** a class page.                                                                                                                                                                                                                                                                                         |
|                 |                       | 1             | _Class page._ Displays the structure and objects of the class specified in the "classname" field.                                                                                                                                                                                                                                                                                         |
|                 |                       | 2                 |_Container page._ Displays a list of objects in the collection. For these navigation nodes, you must specify the class and the ID of the container object, as well as the name of the collection attribute.   
|                 |                       | 3                 |_Hyperlink._ Goes to the link specified in the "url" field.
| `"title"`       | [**Title**](/docs/en/2_system_description/metadata_structure/meta_navigation/title.md)         | String                               | Allows to optionally specify the title of the page.                                                                                                                                                                                                         |
| `"caption"`     | **Boolean**    | String                               | The name of the navigation node displayed in the interface.                                                                                                                                                                                                                                    |
| `"classname"`   | **Class**             | String in Latin characters with no spaces       | If "Type" is - "class Page (1)", the field is obligatory to be filled in.                                                                                                                                                                                 |
| `"container"`   | **Container ID**     | String or null                      | The ID of the object containing the collection  which is displayed on the page.                                                                                                                                                                                                                                                                           |
| `"collection"`  | **Collection attribute** | String or null                      | The name of the collection attribute whose content you want to display on the page.                                                                                                                                                                                                                                                                           |
| `"url"`         | **URL**               | Hyperlink (any string is acceptable) | If "Type" is - "Hyperlink (3)", the field is obligatory to be filled in.                                                                                                                                                                                     |
| `"external"`         | **Sign of external resource**               | Boolean | Opens a page by reference in a new window, if the `true` value is set.                                                                                                                                                                                      |
| `"hint"`        | **Hint**         | String                               | The text specified in this line is displayed when you hover over the navigation node to which the string belongs.                                                                                                                                                                                                                                                                                         |
| `"conditions"`  | [**Sample conditions**](/docs/en/2_system_description/metadata_structure/meta_navigation/conditions.md)   | Array of objects                      | Filter when opening a list of objects. Used for “Page Class” and “Container Page” nodes.                                                                                                                                                                                                              |
| `"sorting"`     | **Sorting**        | Array of objects                      | It is used for nodes of the "Class page" and "Container page" types. Here you can set the sorting options for the objects in the list. The parameters are set in the same way as the settings for the sample and sorting of valid values in attributes.                                                                                                                                                                                                                                                                                         |
| `"eagerLoading"`     |   **Eager Loading**      | Object                      | The configuration of the eager loading in the meta navigation. If you need the eager loading for the class for all navigations, we recommand you to specify it in the `deploy.json` file. Therefore, this option is rarely used.                                                                                                                                                                                                                                                                                          |
| `"pathChains"`  | **Bread crumbs**    | Array of objects                      | Here you can define the logic for "hierarchical" navigation from the page object to the higher-nested object. It can be used in a specific implementation of ION application to optimize navigation.                                                                                                                                                                                                                                                                           |
| `"searchOptions"`  | **Search in the navigation node**    | Array of objects                      | On the class level, it defines the way of searching the class objects from the view list: by the beginning of the word, by the entire word, by the attrbiutes or by the specifyed attributes in the list with the search option "with spaces".                                                                                                                                                                                                                                                                           |
| `"metaVersion"` | **Metaversion**    | String                                                                                                                                                                                           | Version of metadata.                                               |

## Search in the navigation node
```
   "searchOptions": {
    "person": {
      "searchBy": [ // attributes by which we search, by default, which are displayed in the columns
        "surname",
        "name",
        "patronymic"
      ],
      "splitBy": "\\s+", // split the search phrase into the regular expressions and match the parts with the attributes
      "mode": ["starts", "starts", "starts"], // matching modes - in this case "starts with" (like, contains, starts, ends - are available)
      "joinBy": "and" // mode of combining conditions for attributes ("or" by default)
    }
  }

```
## Structure in mongoDB (registry)

```
{
    "_id" : ObjectId("578f07aa0ce0024ce143e71e"),
    "code" : "classDatetime",
    "orderNumber" : 0,
    "type" : 1,
    "caption" : "Class \"Date/time [9]\"",
    "classname" : "classDatetime",
    "container" : null,
    "collection" : null,
    "url" : null,
    "hint" : null,
    "conditions" : [],
    "sorting" : [],
    "pathChains" : [],
    "itemType" : "node",
    "section" : "simpleTypes",
    "namespace" : ""
}
```

### The next page: [Meta work-flows](/docs/en/2_system_description/metadata_structure/meta_workflows/meta_workflows.md)

--------------------------------------------------------------------------  


 #### [Licence](/LICENCE.md) &ensp;  [Contact us](https://iondv.com) &ensp;  [Russian](/docs/ru/2_system_description/metadata_structure/meta_navigation/navigation_nodes.md)   &ensp; [FAQs](/faqs.md)          



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.  
All rights reserved. 