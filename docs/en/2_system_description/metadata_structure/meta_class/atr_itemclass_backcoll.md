#### [Content](/docs/en/index.md)

### The previous page: [Attribute "Reference"](/docs/en/2_system_description/metadata_structure/meta_class/atr_ref_backref.md)

# Collection

## Description 

**Collection** - data type that allows to display the list of other objects in one. The data of the object can be the object of any class including the initial.

All references in the collection are divided with commas. All values of the consequence of the references and commas are stored in the DB.

### Types of connections of the Collection type:
1. `one-to-many` - is the classic connection of the heir object to the ancestor object. Define the container and nested object with the reference to the container. In the container, specify the collection and in the collection specify the reference attribute of the nested object. __See Back reference__ 
2. `many-to-many` - is determined through a collection without references and a class of nested elements — connections are created in the collection and stored as separate entities in the DB. __See Collection__
3. `back collection` - is similar to the `one-to-many` connection but in the opposite direction - connection from the reference object. Set the connection using the *backColl* property.__See Back collection__


## Collection JSON 

### Example

```
{
      "orderNumber": 50,
      "name": "table",
      "caption": "Table",
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
      "itemsClass": "collRefCatalog@develop-and-test",
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
**NB.** If a collection refers to a class with many heirs, then when filling the collection you can create objects of both the parent and child classes.

Collections together with the object are loaded according to the semantics specified in the meta class of a collection or reference attribute.

## Back reference in the context of collection

The back reference in the context of collection if formed as follows:

- create a regular collection specifying the reference attribute
- in the reference class create the reference attribute, that refers to the initial class and has the `"unique": false` property. The values in the reference attribute is assigned immediately when creating a connection with the collection, without saving the form
- specify the `"backRef"` property in the initial class of the collection. In this property, write down the code of the reference attribute from the reference class


## Back reference in JSON 

### Example

```
{
      "orderNumber": 30,
      "name": "coll",
      "caption": "Collection with back reference",
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
      "refClass": null,
      "itemsClass": "ref_backcoll_ref@develop-and-test",
      "backRef": "ref_backcoll_ref",
      "backColl": "",
      "binding": "",
      "semantic": "backcoll_data",
      "selConditions": [],
      "selSorting": [],
      "selectionProvider": null,
      "indexSearch": false,
      "eagerLoading": true,
      "formula": null
    }
```  

## Display mode of the "Collection" attribute on the form:

You can set the display mode in the meta view. Set the mode using the `"mode"` property or the `"options"` property to set it as a template.

* **mode: 4** - "Tag Cloud" stores the values of one or several objects by reference in the form of tags, the name of which is determined by the semantics of the object by reference. 
* **mode: 3** - "Table" stores the values of one or several objects by reference in a table, the columns of which are predefined for the view form.

### Example:

```
{
    "caption": "Table",
    "type": 3,
    "property": "table",
    "size": 2,
    "maskName": null,
    "mask": null,
    "mode": 3,
    "fields": [],
    "columns": [],
    ...
},
...
```

* **"Comment"** - is set in the same way as the “Table” display mode, but with the template specified in the `"options"` property. It is a field that contains data that was predefined in the `"columns"` property for an object by reference. It is intended to discuss information on an object at a certain stage of a workflow. 

### Example:

```
       {
          "caption": "Comment",
          "type": 3,
          "property": "coment",
          "size": 2,
          "maskName": null,
          "mask": null,
          "mode": 3,
          "fields": [],
          "columns": [
            {
              "sorted": true,
              "caption": "Date",
              "type": 120,
              "property": "date",
              ...
            },
            {
              "sorted": true,
              "caption": "Confirmation (Rationale)",
              "type": 7,
              "property": "descript",
              ...
            },
            {
              "caption": "Lead",
              "type": 2,
              "property": "owner",
              ...
            }
          ],
          "actions": null,
          "commands": [
            {
              "id": "CREATE",
              "caption": "Create",
              "visibilityCondition": null,
              "enableCondition": null,
              "needSelectedItem": false,
              "signBefore": false,
              "signAfter": false,
              "isBulk": false
            },
            {
              "id": "EDIT",
              "caption": "Edit",
              "visibilityCondition": null,
              "enableCondition": null,
              "needSelectedItem": true,
              "signBefore": false,
              "signAfter": false,
              "isBulk": false
            }
          ],
          "orderNumber": 80,
          ...
          "tags": null,
          "options": {
            "template": "comments",
            "comments": {
              "textProperty": "descript",
              "userProperty": "owner",
              "parentProperty": "answlink",
              "photoProperty": "owner_ref.foto.link",
              "dateProperty": "date"
            }
          }
        }
```

# Back collection

The previous example is converted into the back collection as follows:

```
{
      "orderNumber": 30,
      "name": "backcoll",
      "caption": "Back collection",
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
      "itemsClass": "coll_backcoll_coll",
      "backRef": "",
      "backColl": "coll",
      "binding": "",
      "semantic": "backcoll_data",
      "selConditions": [],
      "selSorting": [],
      "selectionProvider": null,
      "indexSearch": false,
      "eagerLoading": true,
      "formula": null
    }
```

Pay attention to the `"backColl"` property, which comtains an additional value — the name of an attribute from a class in the collection (from the example above - coll).

Thus, a many-to-many connection is realized without an intermediate class. Not only the "backcoll"   attribute with the "Collection" type can contain several references, but objects by reference can also contain several references to objects of the original class in their "coll" collection.

### *Attention*

- `"type": 14` - the attribute type "Collection"
- `"backColl"` - the name of the reference attribute of the collection type, that refers to the initial collection class.
- `"itemsClass"` - the name of the class whose objects can store their identifiers in the collection and, thus, form a reference to the object by identifier.
- `"backRef"` - the attribute reference from the reference class specified in `" itemsClass "`
- When specifying a parent class, it is possible to create objects of the parent and child classes
- Collection with object are loaded according to the semantics specified in the collection class or collection attribute

## Collection processing and storage format
To save the collection, transfer the array of actions (the example below) in the corresponding attribute of the object:

```
"collection": [
  {"action": "put", "id": "1234"},
  {"action": "put", "id": "1235"},
  {"action": "put", "id": "1236"},
  {"action": "eject", "id": "1230"}
]
```
The order of the objects must correspond to the order of relevant actions. Available operations: `put` - add to the collection,` eject` - extract from the collection. The algorithm for creating and editing is the same. Actions on collections are performed after the container is created or saved.

The working principle of collections on the form of creation and editing is fundamentally different:

* On the creation form, interconnection with the server is required only to receive and display in the table the selected/created object of the collection
* On the editing form, it is possible to get a server response if necessary, and to change the select parameters upon request, depending on the actions performed in the collection.


### The next page: [Conditions of sorting the valid values](/docs/en/2_system_description/metadata_structure/meta_class/atr_selconditions.md)  
--------------------------------------------------------------------------  


 #### [Licence](/LICENCE.md) &ensp;  [Contact us](https://iondv.com) &ensp;  [Russian](/docs/ru/2_system_description/metadata_structure/meta_class/type_collection14.md)   &ensp; [FAQs](/faqs.md)          



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.  
All rights reserved. 