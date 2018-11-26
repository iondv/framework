### The previous page: [Default value](/docs/en/2_system_description/metadata_structure/meta_class/atr_default_value.md)  
# Reference
## Description

**Reference** - is a data type that stores a simple value and that system interprets as a reference to the key attribute of an object of another class. This object can be an object of any class including the original one.

Values in the attribute of the reference type are displayed in accordance with the semantics, specified in the reference class of this attribute.

The ability to replace an object by a back reference is determined by the `nullable` property of the reference attribute. When replacing an object, you lose the reference and the object by reference will be deleted when you try to change the reference from the collection with a back reference.

## Types of connections of the "reference" type
Reference type in context of the attribute part of the meta class:

1. `one-to-many` - the classic connection of the heir object to the ancestor object. Define a reference and specify the class of the nested object, after connections are created and a reference stored as a separate entities in the DB.
2. `one-to-one` - similar to the one-to-many connection, means the presence of a reference and a nested object with a bonded reference to the source object. In the link, you must specify a bonded reference, and in the bonded reference you must indicate the reference attribute of the nested object by which the connection is formed. Be sure to specify the `"unique ": true` property in the reference attribute. 

## Reference in JSON 

### Example:

```
{
      "orderNumber": 20,
      "name": "ref",
      "caption": "Reference",
      "type": 13,
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
      "refClass": "collRefCatalog@develop-and-test",
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
      "formula": null
    }
```  

## Display mode of the "Reference" attribute on the form:

You can set the display mode in the meta view. Set the mode using the `"mode"` property or the `"options"` property to set it as a template.

* **"mode": 0** - display only semantics of the object by reference
* **"mode": 1** - display only the reference to the form of the object by reference
* **"mode": 3** - hierarchical object search
* **"mode": 4** - refining object search

# Back reference 

Configure the back reference in the context of reference as follows:
- create the attribute with the `13` type, specifying the “refClass” reference class and specifying the “backRef” property - where you should write the attribute from the reference class;
- the reference class should have the reference attribute, which refers to the original class and has the `"unique": true` property. 

## Back reference in JSON file

### Example:

```
{
      "orderNumber": 30,
      "name": "backref",
      "caption": "Back reference",
      "type": 13,
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
      "refClass": "otorbrRef@develop-and-test",
      "itemsClass": "",
      "backRef": "ref",
      "backColl": "",
      "binding": "",
      "semantic": "data",
      "selConditions": [],
      "selSorting": [],
      "selectionProvider": null,
      "indexSearch": false,
      "eagerLoading": true,
      "formula": null
    }
```  

### *Attention* 
- `"type": 13` - attribute type "Reference"
- `"refClass"` - the name of the class whose objects can store their identifiers in the reference and, thus, form a reference to the object by its identifier.
- `"backRef"` - is the name of the attribute that belongs to the class specified in the "refClass" property. The attribute must be of the "Link" type and the attribute should have the reference to the original class.

### Example:
```
Employee: {
    property: {
        aaa: {
            refClass: Job position,
            backRef: bbb,
            ...
        },
        ...
    }
}
    
        
Post: {
    property: {
        bbb: {
            refClass: Employee,
            ...
        },    
        ...
    }
}
```


### The next page: [Attribute "Collection"](/docs/en/2_system_description/metadata_structure/meta_class/atr_itemclass_backcoll.md)
--------------------------------------------------------------------------  


 #### [Licence](/LICENCE.md) &ensp;  [Contact us](https://iondv.com) &ensp;  [Russian](/docs/ru/2_system_description/metadata_structure/meta_class/atr_ref_backref.md)   &ensp; [FAQs](/faqs.md)          



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.      
All rights reserved. 