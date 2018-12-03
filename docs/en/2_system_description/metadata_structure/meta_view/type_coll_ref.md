#### [Content](/docs/en/index.md)

### Back: [Meta view - genral part](/docs/en/2_system_description/metadata_structure/meta_view/meta_view_main.md)

# "Collection" and "Reference" display mode

The display modes of the "Collection" and "Reference" view types - are the following constant in the platform:

```
module.exports = {
  TEXT_SIMPLE: 0,
  TEXT_AUTOCOMPLETE: 1,

  COLLECTION_LIST: 0,
  COLLECTION_LINK: 1,
  COLLECTION_LINKS: 2,
  COLLECTION_TABLE: 3,
  COLLECTION_HASHTAGS: 4,

  REF_STRING: 0,
  REF_LINK: 1,
  REF_INFO: 2,
  REF_HIERARCHY: 3,
  REF_SPECIFY: 4,

  GEO_MAP: 0,
  GEO_LOCATOR: 1,
  GEO_CANVAS: 2,

  GROUP_VERTICAL: 0,
  GROUP_HORIZONTAL: 1
};

```
## Modes for attributes of "Collection" type:

* `"mode": 0` - List
* `"mode": 1` - Reference
* `"mode": 2` - List of references
* `"mode": 3` - Table
* `"mode": 4` - Tags

## Modes for attributes of "Reference" type::

* `"mode": 0` - String
* `"mode": 1` - Reference
* `"mode": 2` - Form
* `"mode": 3` - Hierarchical reference 
* `"mode": 4` - Refining Search 

### "Hierarchical reference" - in more details

The **hierarchical reference** mode, based on the specified nested fields, displays the filter parameters at the hierarchy levels. When the field is initialized, an *ajax-request* is sent to the controller to receive the first selection list (no filter is specified). When a response is received from the server, the first filter field is displayed with a selection list. Further, when selecting a value in each of the filter fields, the values of the following fields are reset and a new selection list is requested for the next field. Fields that do not have a selection list are hidden. If one variant is in the selection list, it is automatically assigned to the filter and the selection list is determined for the next level in the hierarchy. When the special value - "transit" is received, the value of the current filter is assigned to the next one and the procedure for obtaining the selection list for the next hierarchy level is performed, and the field corresponding to the filter is hidden. When the values of all filter fields are specified, the controller returns a selection list of object by reference, which is automatically displayed in a separate field located after the filtering fields.

 ### "Refining Search" - in more detail
 
The **refining search** fields are used to facilitate the search of the objects by reference. The meta developer, taking into account the subject area, can define a part of the attribute set of the sought object as “refining” and thus facilitate the task for both the database and the user. Ex. We first select the value of the "manufacturer" field, then the value of the "product type" field whose variants are already limited by the previous filter, so we reduce the sample with only those products that correspond to the refining attributes. It is possible to specify the fields that will refer to the class attributes by reference and will be considered as "refining".
  
--------------------------------------------------------------------------  


 #### [Licence](/LICENCE.md) &ensp;  [Contact us](https://iondv.com) &ensp;  [Russian](/docs/ru/2_system_description/metadata_structure/meta_view/type_coll_ref.md)   &ensp; [FAQs](/faqs.md)          



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.  
All rights reserved. 