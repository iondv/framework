#### [Content](/docs/en/index.md)

### Back: [View types](view_types.md)

# Group type [0] 

## Description

**Group [0]** - the structure of the create and edit view allows to group attributes from other classes in the create/edit view in a horizontal and/or vertical form within one class. 

## Display modes of the Group [0] type

* GROUP_VERTICAL `"mode": 0` - group fields are located under each other 
* GROUP_HORIZONTAL `"mode": 1` - group fields are arranged horizontally in a row (i.e., in columns, if there is enough space) 

### How to configure the Group [0] type in the meta view:

```json
{
   "type": 0, // groupe of fields
   "mode": 1, // displayed horizontally
   "fields": [
       // fields
    ]
}
```

### How to configure the columns size:

```json
{
   "type": 0, // top hierarchy group
   "mode": 1, // columns
   "fields": [
      {
         "type": 0, // group-column1
         "mode": 0,
         "size": 0, // narrow
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
         "type": 0, // group-column2
         "mode": 0,
         "size": 0,  // narrow
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
        "type": 0, // group-column3
        "mode": 0,
        "size": 3,  // wide
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

--------------------------------------------------------------------------  


 #### [Licence](/LICENSE) &ensp;  [Contact us](https://iondv.com/portal/contacts) &ensp;  [English](type_group.md)   &ensp;
<div><img src="https://mc.iondv.com/watch/local/docs/framework" style="position:absolute; left:-9999px;" height=1 width=1 alt="iondv metrics"></div>       



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.   
All rights reserved. 
