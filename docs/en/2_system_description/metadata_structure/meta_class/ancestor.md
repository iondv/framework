### The previous page: [Metadata versions](/docs/ru/2_system_description/metadata_structure/meta_class/metaversion.md)
# Inheritance

**Inheritance** - allows you to create a new meta class based on a parent one with all its attributes. A parent class may have several heirs with different attribute structures. Each heir can have its own (individual) composition of attributes, plus attributes of the parent class.

## Set of attributes


In the meta of the parent class the set of attributes is formed in such a way that each attribute can be used in any heir classes. Whereas the set of attributes in a heir class is individual for each heir class and has no influence on other classes.

### Example:

*Parent class* :

```
{
  "isStruct": false,
  "key": [
    "id"
  ],
  "semantic": "name",
  "name": "organization",
  "version": "",
  "caption": "Organization",
  "ancestor": null,
  "container": null,
  "creationTracker": "",
  "changeTracker": "",
  "history": 0,
  "journaling": true,
  "compositeIndexes": [],
  "properties": [
```
*Heir class* :
```
{
  "isStruct": false,
  "key": [
    "id"
  ],
  "semantic": "",
  "name": "medicalOrg",
  "version": "",
  "caption": "Medical organization",
  "ancestor": "organization",
  "container": null,
  "creationTracker": "",
  "changeTracker": "",
  "history": 0,
  "journaling": true,
  "compositeIndexes": [],
  "properties": [

```

`"id"` - is a unique identifier for all heirs. It is stored in the parent class.
`"name"` - the class has the "Name" attribute, which can be displayed in all the heirs, or in one of them. If the `" name "` attribute is set in the parent class, then it can be displayed in any of the heirs. But if `" name "` is set in the class of the heir, it is displayed only in the class in which it was set.

*Сlass view* :

If the [criteria of abstraction](/docs/en/2_system_description/metadata_structure/meta_class/abstract.md) is set in the parent class, then there is no need to set the view for this class.

The class view is set for each heir separately with the desired set of attributes (attributes of the new class plus of the parent class, if needed).


## Setting the list of the heir classes to create objects by reference 

It is set in the meta class for the attribute of the "Reference"/"Collection" types after specifying the reference/collection class.

Example:

```
"itemsClass": "event",
"allowedSubclasses": [
        "Subclasses1",
        "Subclasses2"
      ],

```

`itemsClass` - collection for the parent class - `[event]`;

`Subclasses1` - is a heir class of the parent class - `[event]`, which will be displayed in the list when creating an object by reference (hereinafter you can list all the heir classes that need to be displayed in the list).

> NB. If this setting is not specified - when created, all heir classes will be listed.

### Conditions for applying this setting: 

* Attribute types - "Reference" or "Collection".
* For the "Reference", "Collection" types of attributes the reference/collection class for the parent class should be specified (when creating an object of a reference class, a window for selecting several classes is displayed). 
* In addition to [hiding the parent class](/docs/en/2_system_description/metadata_structure/meta_class/abstract.md), when creating an object, you do not need to display all the heir classes in the class selection list to create an object by reference.

### Example

The parent class [Events] has several classes of heirs ([Event1], [Event3], [Event2]).

In the [Project] class, there is an attribute of the "Collection" type that refers to the parent class [Event]:

```
{
    "namespace": "ns",
    "isStruct": false,
    "key": [],
    "semantic": "",
    "name": "project",
    "version": "",
    "caption": "Project",
    "ancestor": "",
    "container": null,
    "creationTracker": "",
    "changeTracker": "",
    "creatorTracker": "",
    "editorTracker": "",
    "history": 0,
    "journaling": true,
    "compositeIndexes": [],
    "properties": [
      {
        "orderNumber": 80,
        "name": "event",
        "caption": "Event",
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
        "itemsClass": "event@ns",
        "allowedSubclasses": [
            "event1",
            "event2"
        ],
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
   ...


```
If the [criteria of abstraction](/docs/en/2_system_description/metadata_structure/meta_class/abstract.md) is set in the class, then when creating an object of the [Event] class in the collection, only the heirs specified in the `"allowedSubclasses"` propery will be desplayed. 

Based on the example, only the objects of the "Event 1" and "Event 2" classes can be created in the "Events" collection.


## Multi-tiered hierarchy

The heir classes can inherit the set of attributes not only from their direct parent classes, but also from
those that are higher in the inheritance hierarchy.

### Example:
`[basicObj]` - parent class ->> `[eventBasic]` - heir class of the [basicObj] class ->> `[eventBlock]` - heir class of the `[eventBasic]` class.

```
{
  "isStruct": false,
  "key": [
    "guid"
  ],
  "semantic": "name",
  "name": "basicObj",
  "abstract": true,
  "version": "31",
  "caption": "Basic object",
  "ancestor": null,
  "container": null,
  "creationTracker": "createDatet",
  "changeTracker": "modifeDate",
  "creatorTracker": "creator",
  "editorTracker": "editor",
  "history": 0,
  "journaling": true,
  "compositeIndexes": null,
  "properties": [

```

```
{
  "isStruct": false,
  "key": [
    "guid"
  ],
  "semantic": "name| ( |code| )",
  "name": "eventBasic",
  "version": "31",
  "caption": "Basic event",
  "ancestor": "basicObj",
  "container": null,
  "creationTracker": "",
  "changeTracker": "",
  "history": 0,
  "journaling": true,
  "compositeIndexes": null,
  "abstract": true,
  "properties": [

```

```
{
  "isStruct": false,
  "key": [
    "guid"
  ],
  "semantic": "name| ( |code| )",
  "name": "eventBlock",
  "version": "31",
  "caption": "Block of events",
  "ancestor": "eventBasic",
  "container": null,
  "creationTracker": "",
  "changeTracker": "",
  "history": 0,
  "journaling": true,
  "compositeIndexes": null,
  "properties": [

```
The `[eventBlock]` heir will inherit the set of attribute of the `[basicObj]` parent class, as well as th `[eventBasic]`heir class.
 
### The next page: [Time tag of created objects](/docs/en/2_system_description/metadata_structure/meta_class/time_user_tracker.md)
--------------------------------------------------------------------------  


 #### [Licence](/LICENCE.md) &ensp;  [Contact us](https://iondv.com) &ensp;  [Russian](/docs/ru/2_system_description/metadata_structure/meta_class/ancestor.md)   &ensp; [FAQs](/faqs.md)          



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.  
All rights reserved. 