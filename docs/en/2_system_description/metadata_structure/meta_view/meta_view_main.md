#### [Content](/docs/en/index.md)

### The previous page: [Attribute types of the meta class](/docs/en/2_system_description/metadata_structure/meta_class/property_types.md)

# Meta view - attribute part

## Description

**Meta view - attribute part** describes the attribute view fields of the class. The attribute views represent an array in the corresponding fields in the general part of the meta view. The view of each attribute is an object of the following structure:

## JSON
### Meta view - create and edit mode
```
    {
      "caption": "Integer editor[14]",
      "type": 14,
      "property": "integer_integer",
      "size": 2,
      "maskName": null,
      "mask": null,
      "mode": null,
      "fields": [],
      "hierarchyAttributes": null,
      "columns": [],
      "actions": null,
      "commands": [],
      "orderNumber": 20,
      "required": false,
      "visibility": null,
      "enablement": null,
      "obligation": null,
      "readonly": false,
      "selectionPaginated": true,
      "validators": null,
      "hint": "",
      "historyDisplayMode": 0,
      "tags": null
    }
```
### Meta view - list mode
```
    {
      `"sorted": true,`
      "caption": "Integer editor [14]",
      "type": 14,
      "property": "integer_integer",
      "size": 2,
      "maskName": null,
      "mask": null,
      "mode": null,
      "fields": [],
      "hierarchyAttributes": null,
      "columns": [],
      "actions": null,
      "commands": [],
      "orderNumber": 20,
      "required": false,
      "visibility": null,
      "enablement": null,
      "obligation": null,
      "readonly": false,
      "selectionPaginated": true,
      "validators": null,
      "hint": "",
      "historyDisplayMode": 0,
      "tags": null
    }
```
## Field description

| Field                    | Name           | Acceptable values                          | Description                                                                                                                                                                              |
|:------------------------|:-------------------------------|:---------------------------------------------|:--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `"sorted"`              | **Sorting allowed**       | Logical                                   | A field for list views. It is not used in create and modify views. Enables or disables sorting by this column.                                          |
| `"caption"`             | **Title**                  | String                                       | The title of the input field / attribute column displayed in the views.                                                                                                                  |
| `"type"`                | **Type**                        | Integer - type identifier (code)             | Attribute view type. [In more details](/docs/en/2_system_description/metadata_structure/meta_view/view_types.md).                                                                                                                        |
| `"property"`            | **Attribute**                    | String, only latin without spaces        | Indicate the attribute name for systeme to work with. There fore can not be blank. (Exept for the Groupe [0] view type).                                                      |
| `"size"`                | **Size**                     | Integer - size code of the input field, depends on type | Allows to specify the code size for different types of attributes/views. Constants in the platform [FieldSizes](/docs/en/2_system_description/metadata_structure/meta_view/field_sizes.md)                                           |
| `"maskName"`            | **Mask name**                  | String                                       | If there are any preset masks in the platform, you can set a mask by internal name, specifying it in this field.                                       |
| `"mask"`                | **Mask**                      | String                                       | Allows you to limit the valid attribute values. [In more details](/docs/en/2_system_description/metadata_structure/meta_view/mask.md).                                                                                                        |
| `"mode"`                | **View mode**          | Integer - code of the view mode               | Sometimes it is necessasry to disply the attribute in different ways, select the disply mode in this field. [Example of using](/docs/en/2_system_description/metadata_structure/meta_class/type_geodata100.md).                     |
| `"fields"`              | **Fields**                       | Array of objects                             | Allows to form the create/edit view in a particular way. [In more details](/docs/en/2_system_description/metadata_structure/meta_view/fields.md).                                                                                 |
| `"hierarchyAttributes"` | **Hierarchy according to**                | object or Null                                             | _not used in current version_                                                                                                                                                                        |
| `"columns"`             | **Colunms**                    | Array of objects                                            | Used for attributes of the "Collection [3]" type. Allows you to select attributes to be displayed on the form of presentation in the form of table columns (attributes are taken from a class by reference)                                                                                                                                                                    |
| `"actions"`             | **Actions**                  | Integer or Null                                             | _not used in current version_                                                                                                                                                                        |
| `"commands"`            | **Commands**                   | Array of objects or Null                    | Describes the acceptable ways for an object of a reference field. Null for the default set of actions. [In more details](/docs/en/2_system_description/metadata_structure/meta_view/commands.md).                                |
| `"orderNumber"`        | **Order number**           | Integer non-negative                        | The order number of the attribute sets the position of the attribute relative to other attributes of the same class in the user interface.                                                  |
| `"required"`            | **Mandatory**               | Logical                                   | Determines whether the filling of this attribute is mandatory when creating / editing an object.                                                                                                 |
| `"visibility"`          | **View conditions**        | String                                       | Sets the condition of displying the field in the view. [In more details](metadata/visibility).                                                                                                    |
| `"enablement"`          | **Edit condition**         | String                                       | Sets the edit condition(accessibility for editing) of the field in the view with the format similar to [View conditions](metadata/visibility) |
| `"obligation"`          | **obligation condition**     | String                                       | Sets the condition which oblige you to fil in the fields in the view. The format is similar to [View conditions](metadata/visibility)                    |
| `"readonly"`            | **Read only**              | Logical                                   | Allows or denies changing the attribute value in this view.                                                                                                          |
| `"selectionPaginated"` | **Page-oriented selection** | Logical                                   | Allows or denies page selection list.                                                                                                                                  |
| `"validators"`          | **Validators**                 | String                                       | The name of the validator that checks the values entered in the attribute field. [In more details](metadata/validators).                                                                           |
| `"hint"`                | **Hint**                  | String                                       | Sets (or redefine the `"hint"` value of the attribute) message, which will be displayed in the user interface next to the attribute name.                                |
| `"historyDisplayMode"`  | **History display**        | Integer                                        | Specifies the format for displaying the history of object changes                                                                                                                                                                      |
| `"tags"`                | **Tags**                       | Array of strings                                 | Store display modifiers and other service information. [In more details] (metadata/tags).                                                                     |

  
## Meta view - the list mode in mongoDB (registry) 

```
       {
            "sorted" : true,
            "caption" : "Integer editor [14]",
            "type" : 14,
            "property" : "integer_integer",
            "size" : 2,
            "maskName" : null,
            "mask" : null,
            "mode" : null,
            "fields" : [],
            "hierarchyAttributes" : null,
            "columns" : [],
            "actions" : null,
            "commands" : [],
            "orderNumber" : 20,
            "required" : false,
            "visibility" : null,
            "enablement" : null,
            "obligation" : null,
            "readonly" : false,
            "selectionPaginated" : true,
            "validators" : null,
            "hint" : "",
            "historyDisplayMode" : 0,
            "tags" : null
        }
```
The attribute structure for create and edit views is different only by the `" sorted "` field, which is absent in the create and edit mode.

### The next page: [List view](/docs/en/2_system_description/metadata_structure/meta_view/list_view.md)

--------------------------------------------------------------------------  


 #### [Licence](/LICENCE.md) &ensp;  [Contact us](https://iondv.com) &ensp;  [Russian](/docs/ru/2_system_description/metadata_structure/meta_view/meta_view_main.md)   &ensp; [FAQs](/faqs.md)          



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.  
All rights reserved. 