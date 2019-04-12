#### [Content](/docs/en/index.md)

### The previous page: [Commands](/docs/en/2_system_description/metadata_structure/meta_view/commands.md)

# Visibility conditions

## Description

**Visibility conditions** - sets the conditions for fields in a class view. It makes the field visible or not. 

You should set not only the logical fields, as in the example, but also the string, string enumeration (the value is compared by the code of the enumerable). 

 ## Syntax
 
 * The `\u003d` symbol means the `=` operation.
 
 * The `\u0027` symbol means the  `'` operation.
```
 "visibility": ".visibility_condition_base !\u003d \u0027\u0027",
```
These symbols are used to correctly disply the conditions in the .json format.

### Condition types

* Complex conditions:
```
".state == 'work' || .state == 'result' || .state == 'fin'"
```
where there is a check on three conditions with "and".  
The syntax is similar to the conditions in JS.  


* Logical:

```
".archive == true"
```
where there is a check on the value of the logical attribute.

* Simple condition:

```
".state == 'work'"
```
where there is a check on the attribute value with a selection list.

* Numeric condition:

```
".magistral == 1"
```
where is the check for the numeric value of the attribute.

* Empty/not empty:

```
"!! .meeting"
```
where there is a check on the value in the specified attribute (!! - not empty, without "!!" - empty).

### Example in JSON:
```
{
          "caption": "Visibility condition base",
          "type": 1,
          "property": "visibility_condition_base",
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
          "hint": null,
          "historyDisplayMode": 0,
          "tags": null
        },
   {
          "caption": "Field is visible if the base is filled",
          "type": 1,
          "property": "visiility_condition_use",
          "size": 2,
          "maskName": null,
          "mask": null,
          "mode": null,
          "fields": [],
          "hierarchyAttributes": null,
          "columns": [],
          "actions": null,
          "commands": [],
          "orderNumber": 30,
          "required": false,
          "visibility": ".visibility_condition_base !\u003d \u0027\u0027",
          "enablement": null,
          "obligation": null,
          "readonly": false,
          "selectionPaginated": true,
          "validators": null,
          "hint": null,
          "historyDisplayMode": 0,
          "tags": null
        },
        {
          "caption": "Field is visible if the base has \u00271\u0027",
          "type": 1,
          "property": "visiility_condition_1",
          "size": 2,
          "maskName": null,
          "mask": null,
          "mode": null,
          "fields": [],
          "hierarchyAttributes": null,
          "columns": [],
          "actions": null,
          "commands": [],
          "orderNumber": 40,
          "required": false,
          "visibility": ".visibility_condition_base \u003d\u003d \u00271\u0027",
          "enablement": null,
          "obligation": null,
          "readonly": false,
          "selectionPaginated": true,
          "validators": null,
          "hint": null,
          "historyDisplayMode": 0,
          "tags": null
        }
```

### The next page: [Activity conditions](/docs/en/2_system_description/metadata_structure/meta_view/enablement.md)

--------------------------------------------------------------------------  


 #### [Licence](/LICENCE.md) &ensp;  [Contact us](https://iondv.com) &ensp;  [Russian](/docs/ru/2_system_description/metadata_structure/meta_view/visibility.md)   &ensp; [FAQs](/faqs.md)   <div><img src="https://mc.iondv.com/watch/local/docs/framework" style="position:absolute; left:-9999px;" height=1 width=1 alt="iondv metrics"></div>       



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.  
All rights reserved. 