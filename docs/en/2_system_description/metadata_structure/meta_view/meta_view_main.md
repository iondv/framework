#### [Content](/docs/en/index.md)

### The previous page: [Attribute types in the meta class](/docs/en/2_system_description/metadata_structure/meta_class/property_types.md)

# Meta view - general part

## Description

**Meta view** - allows to set the desired attribute composition of the class to display on the form according to the view form  (list view - list.json, create view - create.json, edit view - item.json) and to specify the overridden and (or) complemented properties for each individual attribute in the meta class of this attribute.

## Forms of meta views

Meta view can be divided into two forms: 

* List view 
* Create and edit view

## List view

**List view** - allows to display the class objects in the form of a list.

## JSON
```
{
  "columns": [...],
  "styles": {},
  "actions": null,
  "commands": [...],
  "allowSearch": false,
  "pageSize": null,
  "useEditModels": true,
  "version": null,
  "overrideMode": null,
  "filterDepth": 3
}
```
## Field description

| Field              | Name                                | Acceptable values  | Description                                                                                                                               |
|:------------------|:------------------------------------------------------|:---------------------|:---------------------------------------------------------------------------------------------------------------------------------------|
| `"columns"`       | **Columns**                                           | Array of objects      | Columns of class attributes, described [the attribute part of the meta view](/docs/en/2_system_description/metadata_structure/meta_view/meta_view_main.md#the-next-page-meta-view-attribute-part). |
| `"styles"`       | [**Highlight color lines**](/docs/en/2_system_description/metadata_structure/meta_view/styles.md)                                           | Formula      | In accordance with the terms of the formula, the columns in the table are colored in the specified color. |
| `"actions"`       | **Actions**                                         | Integer or Null                     | _not used in current version_                                                                                                                          |
| `"commands"`      | [**Commands**](/docs/en/2_system_description/metadata_structure/meta_view/commands.md)                                          | Array of objects      | The set of object operations.                                                                   |
| `"allowSearch"`   | [**Search is available**](/docs/en/2_system_description/metadata_structure/meta_view/allowsearch.md)                                    | Boolean           | Allows or denies displaying the search form.                                                  |
| `"pageSize"`      | **Number of object per page**                    | Integer positive  | Specifies the number of objects on a single page by default.                                                                           |
| `"useEditModels"` | **Edit form for detalization** | Boolean           | Allows or denies the use of the edit form for data detalization of a class object.                                       |
| `"version"`       | [**Version**](/docs/en/2_system_description/metadata_structure/meta_class/metaversion.md)                                            | String               | Metaversion of data.                                                                                       |
| `"overrideMode"`  | [**Override mode**](/docs/en/2_system_description/metadata_structure/meta_view/overridemode.md)                                   | _0 - Overlap_      | Sets the override mode of the views.                                                              |
|                   |                                                       | _1 - Override_ |                                                                                                                                        |
| `"filterDepth"`       | **Filter query depth in lists**                                        | Integer positive  | Filter query depth in lists of objects. It equals 2, by default.                                                                                     |

## Create and edit view

**Create and edit view** - allows to create and edit the class objects.

## JSON
```
{
  "tabs": [
    {
      "caption": "",
      "fullFields": [...],
      "shortFields": []
    }
  ],
  "actions": null,
  "commands": [...],
  "siblingFixBy": null,
  "siblingNavigateBy": null,
  "historyDisplayMode": 0,
  "collectionFilters": null,
  "version": null,
  "overrideMode": null
}
```
## Field description

| Field                   | Name              | Acceptable values  | Description                                                                                                                                                                                         |
|:-----------------------|:----------------------------------|:---------------------|:-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `"tabs"`               | **Tabs**                       | Object               | Allows you to create many pages of objects on the same view form.                                                                                                                                                                                |
| `"caption"`            | **Tabs name**                   | String               | The name of the `"tabs"` field will be displayed in the tab page.                                                                                                                                                             |
| `"fullFields"`         | **Firld in the full form**            | Array of objects      | The `"tabs "` field, the array contains the attributes that should be displayed in the full form, described according to [the attribute part of the meta view](/docs/en/2_system_description/metadata_structure/meta_view/meta_view_attribute.md).  |
| `"shortFields"`        | **Firld in the short form**           | Array of objects      |The `"tabs "` field, the array contains the attributes that should be displayed in the short form, described according to [the attribute part of the meta view](/docs/en/2_system_description/metadata_structure/meta_view/meta_view_attribute.md). |
| `"actions"`            | **Actions**                     | Integer or Null                     | _not used in current version_                                                                                                                                                                                    |
| `"commands"`           | [**Commands**](/docs/en/2_system_description/metadata_structure/meta_view/commands.md)                      | Array of objects      | The set of object operations.                                                                                                                              |
| `"siblingFixBy"`       | **Selection of sibling objects**     | Array of strings         | Enumeration of the attributes of the collection, that will be used to select sibling objects.                                                                                                                                                                                   |
| `"siblingNavigateBy"`  | **Transition to sibling objects** | Array of strings         | Enumeration of the attributes of the collection, that will be used to transition the sibling objects.                                                                                                                                                                                   |
| `"historyDisplayMode"` | **History display**           | Integer                | Specify the disply format of the history of object modifications.                                                                                                                                                                                   |
| `"collectionFilters"`  | **Collection filters**          | Array of objects      | Select attributes from collections to filter.                                                                                                                                                                                   |
| `"version"`            | [**Version**](/docs/en/2_system_description/metadata_structure/meta_class/metaversion.md)                        | String               | Metaversion of data.                                                                                                                                                |
| `"overrideMode"`       | [**Override mode**](/docs/en/2_system_description/metadata_structure/meta_view/overridemode.md)               | _0 - Overlap_      | Sets the override mode of the views.                                                                                                                        |
|                        |                                   | _1 - Override_ |                                                                                                                                                                                                  |


### The next page: [Meta view - attribute part](/docs/en/2_system_description/metadata_structure/meta_view/meta_view_attribute.md)

--------------------------------------------------------------------------  


 #### [Licence](/LICENCE.md) &ensp;  [Contact us](https://iondv.com) &ensp;  [Russian](/docs/ru/2_system_description/metadata_structure/meta_view/meta_view_main.md)   &ensp; [FAQs](/faqs.md)          



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.   
All rights reserved. 