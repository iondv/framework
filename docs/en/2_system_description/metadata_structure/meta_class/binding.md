#### [Content](/docs/en/index.md)

### The previous page: [The key attributes](/docs/en/2_system_description/metadata_structure/meta_class/key.md)

# Collection base

**Collection base** - an attribute in the object, by the value of which the search of objects in the collection is performed. The search is based on the comparison of collection base with the back reference attribute.
## Purpose of use

The base of the collection can be used to create dynamic collections. It means that the objects in the collection can be loaded depending on the entered data or calculated values by the formula, unlike regular back reference with search only by key attributes.

## Example

For example in the develop-and-test project there are two classes:

In the `searchRefs` class we add a new `code_binding` string attribute as back reference for `binding`.

```
    {
      "orderNumber": 30,
      "name": "code_binding",
      "caption": "Code for binding",
      "type": 0,
      "size": null,
      "decimals": 0,
      "allowedFileTypes": null,
      "maxFileCount": 0,
      "nullable": true,
      "readonly": false,
      "indexed": true,
      "unique": false,
      "autoassigned": false,
      "hint": null,
      "defaultValue": null,
      "refClass": "",
      "itemsClass": null,
      "backRef": null,
      "backColl": "",
      "binding": "",
      "semantic": "",
    "selConditions": null,
      "selSorting": [],
      "selectionProvider": null,
      "indexSearch": false,
      "eagerLoading": false,
      "formula": null
    }
```


In the `backref_searchRefs` class we have the `backref_searchRefs_binding` and `backref_searchRefs_text` attributes. `backref_searchRefs_binding` is a dynamic collection, and the `backref_searchRefs_text` is used ass a filter for the `backref_searchRefs_binding` collection. In the `backref_searchRefs_binding` collection the selection is occured by the  equality of `backref_searchRefs_text` values from the `backref_searchRefs` class and `code_binding` values from the `searchRefs` class. When adding objects to the collection manually, the `code_binding` attribute is automatically filled.

```
    {
      "orderNumber": 25,
      "name": "backref_searchRefs_binding",
      "caption": "Back reference (with binding) to the searchRefs class",
      "type": 14,
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
      "itemsClass": "searchRefs",
      "backRef": "code_binding",
      "backColl": "",
      "binding": "backref_searchRefs_text",
      "semantic": null,
    "selConditions": null,
      "selSorting": [],
      "selectionProvider": null,
      "indexSearch": false,
      "eagerLoading": false,
      "formula": null
    },
    {
      "orderNumber": 30,
      "name": "backref_searchRefs_text",
      "caption": "Value",
      "type": 0,
      "size": null,
      "decimals": 0,
      "allowedFileTypes": null,
      "maxFileCount": 0,
      "nullable": true,
      "readonly": false,
      "indexed": true,
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
    "selConditions": null,
      "selSorting": [],
      "selectionProvider": null,
      "indexSearch": false,
      "eagerLoading": false,
      "formula": null
    }
```


### The next page: [Criteria of abstraction](/docs/en/2_system_description/metadata_structure/meta_class/abstract.md)
--------------------------------------------------------------------------  


 #### [Licence](/LICENCE.md) &ensp;  [Contact us](https://iondv.ru/index.html) &ensp;  [Russian](/docs/ru/2_system_descriptionmetadata_structure/meta_class/semantic.md) &ensp; [FAQs](/faqs.md)          



--------------------------------------------------------------------------  


Copyright (c) 2018 **LLC "ION DV"**.  
All rights reserved.  