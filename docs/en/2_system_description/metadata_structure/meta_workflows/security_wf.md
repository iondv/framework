#### [Content](/docs/en/index.md)

### The previous page: [Meta workflow](/docs/en/2_system_description/metadata_structure/meta_navigation/meta_navigation.md)

# Security of the workflow

### Description

Security in a business process is used to control the rights over a specific object by one user. It is set in the meta class, statuses and transitions of the workflow.

### Implementation

In the meta you need to define the [string attribute](/docs/en/2_system_description/metadata_structure/meta_class/property_types.md), in which the user ID will be stored.

To control the rights during the transitions on the workflow, it is necessary to add in the transition an assignment of the current user to the attribute for which rights will be issued for the next WF status.

Then, in the WF status, set the access level in the `itemPermissions` property:

```
"itemPermissions": [
        {
          "role": ...
          "permissions": ...
        }
      ]
```

- `role` - indicates the attribute that stores the user ID
- `permissions` - the number is set by the bit mask, which is related to the `role` level of access to the object

    - 1 - read
    - 2 - edit
    - 4 - delete
    - 8 - use
    - 31 - full access

You can use rights in any order. For example:

- read + edit = 3
- read + edit + delete = 7
- read + edit + delete + use = 15

**Attention!** In the workflow, dynamic rights can only provide more access. It is impossible to reduce access rights.

### Examples

Assignment in the WF transition to the `person` attribute of the current user working with the object.

```
"assignments": [
    {
        "key": "person",
        "value": "$$uid"
    }
]
```

Add the `itemPermissions` to the WF status

```
"states": [
    {
      "itemPermissions": [
        {
          "role": "person",
          "permissions": 15
        }
      ]
    }
  ]
```

### The next page: [Workflow statuses](/docs/en/2_system_description/metadata_structure/meta_workflows/status_wf.md)

--------------------------------------------------------------------------  


 #### [Licence](/LICENCE.md) &ensp;  [Contact us](https://iondv.com) &ensp;  [Russian](/docs/ru/2_system_description/metadata_structure/meta_workflows/security_wf.md)   &ensp; [FAQs](/faqs.md) 
 
 --------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.  
All rights reserved. 