#### [Content]()

### The previous page: []()

# Fields 

## Description

**Fields** - is a special structure of the create and edit view mode, which allows, within one class, to display data from other related classes in a horizontal and/or vertical form.

## Group types 

* GROUP_VERTICAL `"mode": 0` - group fields are placed under each other 
* GROUP_HORIZONTAL `"mode": 1` - group fields are placed horizontally in a string (i.e. columns if there is enough space) 

### How to configure in the meta view for the "Group" type:

```json
{
   "type": 0, // group field
   "mode": 1, // displayed horizontally 
   "fields": [
       // different fields
    ]
}
```

### How to configure the columns size:

```json
{
   "type": 0, // top level group
   "mode": 1, // columns
   "fields": [
      {
         "type": 0, // group-column 1
         "mode": 0,
         "size": 0, // small-scale column
         "fields": [
            {
               "property": "attr1",
               "type": 1,
               "caption": "Text field 1"
            },
            {
               "property": "attr2",
               "type": 1,
               "caption": "Text field 2"
            }
         ]
     },
      {
         "type": 0, // group-column 2
         "mode": 0,
         "size": 0,  // small-scale column
         "fields": [
            {
               "property": "attr3",
               "type": 1,
               "caption": "Text field 3"
            },
            {
               "property": "attr4",
               "type": 1,
               "caption": "Text field 4"
            }
         ]
     },
     {
        "type": 0, // group-column 3
        "mode": 0,
        "size": 3,  // large-scale column
        "fields": [
            {
               "property": "attr5",
               "type": 1,
               "caption": "Text field 5"
            },
            {
               "property": "attr6",
               "type": 1,
               "caption": "Text field 6"
            }
         ]
     }
   ]
}
```


### The next page: []()

--------------------------------------------------------------------------  


 #### [Licence](/LICENCE.md) &ensp;  [Contact us](https://iondv.com) &ensp;  [Russian](/docs/ru/2_system_description/metadata_structure/meta_view/fields.md)   &ensp; [FAQs](/faqs.md)          



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.   
All rights reserved. 
