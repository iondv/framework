#### [Content](/docs/en/index.md)

### Back: [Meta view - general part](/docs/en/2_system_description/metadata_structure/meta_view/meta_view_main.md)

# Override Mode

The **Override Mode** field - `"overrideMode"` allows to set two types of the Override Mode - `"Overlap"` and `"Override"`.

Types of the Override Mode in the meta view:

**Type 1** - `"Override"` - overrides the standard display mode of the corresponding attributes specified in the meta view of the class. Attributes that are not specified in the meta view of the class are displayed in a standard mode on the form according to the specified default order.

**Type 2** - `"Overlap"` - only attributes specified in the meta view are displayed.

### Example

```
  "actions": null,
  "siblingFixBy": null,
  "siblingNavigateBy": null,
  "historyDisplayMode": 0,
  "collectionFilters": null,
  "version": null,
  "overrideMode": 1, 
  "commands": [

```
--------------------------------------------------------------------------  


 #### [Licence](/LICENCE.md) &ensp;  [Contact us](https://iondv.com) &ensp;  [Russian](/docs/ru/2_system_description/metadata_structure/meta_view/overridemode.md)   &ensp; [FAQs](/faqs.md)          



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.  
All rights reserved. 