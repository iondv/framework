#### [Content](/docs/en/index.md)

### The previous page: [Time and user tag of created objects and committed changes](/docs/en/2_system_description/metadata_structure/meta_class/time_user_tracker.md)

# Journaling the changes 

**Journaling the changes** - indicates the need to log all actions performed on the object. Located in the `journaling` field of the main part of the meta class with two available values - `true` and `false`. A value of `true` indicates that you should log the changes. If the field is set to `false` or absent, then no object change logging is required.


## Example:

```
{
  "isStruct": false,
  "key": "okato",
  "semantic": "name",
  "name": "populatedArea",
  "caption": "Populated area",
  "journaling": true,
  "ancestor": null,
  "container": "",
  "creationTracker": "",
  "changeTracker": "",
  "properties": []
}
```  


### The next page: [Composite indexation](/docs/en/2_system_description/metadata_structure/meta_class/composite_indexes.md)
--------------------------------------------------------------------------  


 #### [Licence](/LICENCE.md) &ensp;  [Contact us](https://iondv.com) &ensp;  [Russian](/docs/ru/2_system_description/metadata_structure/meta_class/journaling.md)   &ensp; [FAQs](/faqs.md)   <div><img src="https://mc.iondv.com/watch/local/docs/framework" style="position:absolute; left:-9999px;" height=1 width=1 alt="iondv metrics"></div>       



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.  
All rights reserved. 