#### [Content](/docs/en/index.md)

### The previous page: [Meta class - general part](/docs/en/2_system_description/metadata_structure/meta_class/meta_class_main.md)

# Meta class - attribute part

**Attribute part of the meta class** describes the `properties` field of the meta class. There are usually at least two attributes in a class — a key field and a data field. The attributes are contained in the `" properties "` field of the main part of the meta class.   

Each attribute is an object of the following structure:

## JSON
```
    {
      "orderNumber": 20,
      "name": "integer_integer",
      "caption": "Integer editor [14]",
      "type": 6,
      "size": null,
      "decimals": 0,
      "allowedFileTypes": null,
      "maxFileCount": 0,
      "nullable": true,
      "readonly": false,
      "indexed": false,
      "unique": false,
      "autoassigned": false,
      "hint": null,
      "defaultValue": null,
      "refClass": "",
      "itemsClass": "",
      "backRef": "",
      "backColl": "",
      "binding": "",
      "semantic": null,
      "selConditions": [],
      "selSorting": [],
      "selectionProvider": null,
      "indexSearch": false,
      "eagerLoading": false,
      "formula": null,
      "cached": true
    }
```
## Field description

| Identifier                   | Name                   | Acceptable values                   | Description                                                                                                                                                                                                                                                                 |
|:-----------------------|:-------------------------------------------|:-------------------------------------|:-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `"orderNumber"`       | **Position number**                       | Non-negative integer                | Sets the position of the attribute regarding the other attributes of the same class.                                                                                                                                                               |
| `"name"`               | **System name**                          | String only the latin characters with no spaces | It is the name of the attribute that the system will work with, which means it cannot be empty, it can contain only Latin characters, without spaces (set once when crating the attribute).                                                   |
| `"caption"`            | **Logic name**                         | String                               | Display attribute name in user interface.                                                                                                                                                                                                               |
| `"type"`               |**Type**                                    | Integer - identifier (code) of the type    | Attribute Data Type. For more details see [Attribute types](/docs/ru/2_system_description/metadata_structure/meta_class/meta_class_attribute.md#следующая-страница-типы-атрибутов)                                                                                                                                                                                                                              |
| `"size"`               | **Size**                                 | positive integer                  | The maximum size of the attribute data,  the valid values depend on the type of attribute.                                                                                                                                                                                       |
| `"decimals"`           | **Number of decimal places**             | non-negative integer                | The number of decimal places is specified only for the "Decimal [8]" type.                                                                                                                                                                                                   |
| `"allowedFileTypes"`   | **Valid file extention**                 | Array of strings                        | Allows you to specify the valid file extensions that a user can upload to the "File collection [110]" attribute.                                                                                                                                             |
| `"maxFileCount"`       | **Maximum number of files**         | Number from 1 to 5   | Specifies the maximum number of files that a user can upload to the "File collection [110]" attribute.                                                                                                                                                     |
| `"nullable"`           | **Valid null value**              | Logical                           | Allows or denies an empty attribute value.                                                                                                                                                                                                                       |
| `"readonly"`           | **Read only**                      | Logical                           | Allows or denies changing attribute value.                                                                                                                                                                                                                     |
| `"indexed"`            | [**Index for search**](/docs/en/2_system_description/metadata_structure/meta_class/atr_indexed.md)               | Logical                           | Indicates whether to index the value of this attribute to speed up the search.                                                                                                                                               |
| `"unique"`             | **Unique values**                    | Logical                           | Imposes a unique constraint (you cannot create two class objects with the same values in an Reattribute of the unique type).                                                                                                                                    |
| `"autoassigned"`       | [**Autocompletion**](/docs/en/2_system_description/metadata_structure/meta_class/atr_autoassigned.md)                         | Logical                           | Allows or denies autocompletion of the fields.
| `"hint"`               | **help text**                              | String                               | Specifies the message that will appear in the user interface next to the attribute name.                                                                                                                                                                               |
| `"defaultValue"`      | [**Default value**](/docs/en/2_system_description/metadata_structure/meta_class/atr_default_value.md)                  | Depends on attribute type           | Specifies the value that will be filled in the create form of the attribute (when an object is created)                                                                                                                                |
| `"refClass"`          | [**Reference class**](/docs/en/2_system_description/metadata_structure/meta_class/atr_ref_backref.md)                           | String only the latin characters with no spaces | Contains the value of the `" name "` field (System name) of the class to be used in the "Link [13]" type attribute.                                                                                                                    |
| `"itemsClass"`          | [**Collection class**](/docs/en/2_system_description/metadata_structure/meta_class/atr_itemclass_backcoll.md)                        | String only the latin characters with no spaces | Contains the value of the `" name "` field (System name) of the class, whose objects can bind to an attribute of the "Collection [14]" type.                                                                                                        |
| `"backRef"`          | [**Back reference attribute**](/docs/en/2_system_description/metadata_structure/meta_class/atr_ref_backref.md)                | String only the latin characters with no spaces | Specifies the attribute of the "Link[13]" type from the class specified in the Collection Class property, which refers to the original class. It is necessary to filter and bind objects from the Class class of the collection by the value of the reference attribute.     |
| `"backColl"`          | [**Back collection attribute**](/docs/en/2_system_description/metadata_structure/meta_class/atr_itemclass_backcoll.md)             | String only the latin characters with no spaces | Specifies the attribute of the "Collection [14]" type from the class specified in the Collection Class property, which refers to the original class. It is necessary to filter and bind objects from the Class class of the collection by the value of the reference attribute. |
| `"binding"`            | **Collection base**                    | String only the latin characters with no spaces | Specifies the attribute of the class to which the back link attribute is bound. If not specified, the key attribute is accepted.                                                                           |
| `"semantic"`           | [**Semantics**](/docs/en/2_system_description/metadata_structure/meta_class/semantic.md)                              | String                               | Specified for the reference attributes in order to display and generate correct information for describing the item in the original class object from the reference class.                                                           |
| `"selConditions"`     | [**Conditions of sorting the valid values**](/docs/en/2_system_description/metadata_structure/meta_class/atr_selconditions.md)     | Null or array of objects            | Allows to limit the selection of  the reference objects, valid for binding in this reference attribute.                                                         |
| `"selSorting"`        | [**Sorting a sample of valid values**](/docs/en/2_system_description/metadata_structure/meta_class/atr_selsorting.md) | Null or array of objects          | Allows to sort the selection of reference objects, valid for binding in this reference attribute.                                                                  |
| `"selectionProvider"` | [**Selection list of valid values**](/docs/en/2_system_description/metadata_structure/meta_class/atr_selectionprovider.md)      | Null or object                      | Specifies a list of selectable values for an attribute.                                                                                                                                                                       |
| `"indexSearch"`       | [**Full text search**](/docs/en/2_system_description/metadata_structure/meta_class/atr_indexed.md)                   | Logical                           | Sign of using attribute in full text search. Indicates that the value of this attribute should be indexed by the search engine.                                                                                                                            |
| `"eagerLoading"`      | [**Eager loading**](/docs/en/2_system_description/metadata_structure/meta_class/eager_loading.md)                        | Logical                           | Load an object by reference (for the link and collection attribute types).                                                                                                                                                                                                      |
| `"formula"`            | [**Computable fields**](/docs/en/2_system_description/metadata_structure/meta_class/atr_formula.md)                        | Null or object                     | Indicates a calculation formula.                                                                                                                                                                                                           |
| `"cached"`            | [**Cache value of a computable attribute**](/docs/en/2_system_description/metadata_structure/meta_class/atr_cached_true.md)                        | Logical                     | Applies only to attribute values obtained by formula. Indicates the ability to cache the value of a computable attribute.                                                                                                                                                                                                             |
    

### The next page: [Attribute types](/docs/en/2_system_description/metadata_structure/meta_class/property_types.md)
--------------------------------------------------------------------------  


 #### [Licence](/LICENCE.md)&ensp;  [Contact us](https://iondv.ru/index.html) &ensp;  [Russian](/docs/ru/2_system_description/metadata_structure/meta_class/meta_class_attribute.md) &ensp; [FAQs](/faqs.md)          



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.  
All rights reserved. 