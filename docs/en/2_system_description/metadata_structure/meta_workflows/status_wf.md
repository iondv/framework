#### [Content](/docs/en/index.md)

### The previous page: [Meta workflows](/docs/en/2_system_description/metadata_structure/meta_workflows/meta_workflows.md)

# Workflow statuses

### JSON

```
"states": [
    {
      "name": "new",
      "caption": "New",
      "maxPeriod": null,
      "conditions": [],
      "itemPermissions": [],
      "propertyPermissions": [],
      "selectionProviders": []
    }
  ]
  
```
## Field description 

| Field | Description  |
|:-----|:-----------|
|`"name"`|  Status system name.|
|`"caption"`| Status logical name.|
|`"maxPeriod"`|  _no data_ |
|`"conditions"`|  Conditions for workflow status. Set in the same way as the "Conditions for the selection of valid values".|
|`"itemPermissions"`| Permissions for an object. |
|`"propertyPermissions"`|   Permissions for properties. |
|`"selectionProviders"`|   Selection list of valid values. |


### The next page: [Workflow transitions](/docs/en/2_system_description/metadata_structure/meta_workflows/transitions_wf.md)

--------------------------------------------------------------------------  


 #### [Licence](/LICENCE.md) &ensp;  [Contact us](https://iondv.com) &ensp;  [Russian](/docs/ru/2_system_description/metadata_structure/meta_workflows/status_wf.md)   &ensp; [FAQs](/faqs.md) 
 
 --------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.  
All rights reserved. 