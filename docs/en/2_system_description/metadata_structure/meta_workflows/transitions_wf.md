#### [Content](/docs/en/index.md)

### The previous page: [Workflow statuses](/docs/en/2_system_description/metadata_structure/meta_workflows/status_wf.md)

# Workflow transitions

### JSON
```
"transitions": [
    {
      "name": "basic",
      "caption": "For approval",
      "startState": "create",
      "finishState": "inAgreed",
      "signBefore": false,
      "signAfter": false,
      "roles": [],
      "assignments": [],
      "conditions": []
    }
  ]
```
## Field description 

| Field | Description  |
|:-----|:-----------|
|`"name"`|  Status system name.|
|`"caption"`| Status logical name.|
|`"startState"`| The initial status of the workflow transition. |
|`"finishState"`|  The final status of the workflow transition. |
|`"signBefore"`| Logical value "Sign before the workflow transition begins". |
|`"signAfter"`|  Logical value "Sign at the end of the workflow transition". |
|`"roles"` |  List of roles, with rights to make the transition. |
| `"assignments"`| Assigning values to attributes after the end of the workflow transition. |
| `"conditions"` | Conditions for the workflow transition. Set in the same way as the "Conditions for the selection of valid values". |

## Assigning values to attributes by reference

Use the `"assignments"` property in the workflow transition to set the values. 

### Example

```
...
     "assignments": [
        {
          "key": "resolution.stateRemPet",
          "value": "end"
        }
      ]
...
```

When performing this workflow transition, the command is - assign the value "end" for the attribute [stateRemPet] by the reference
of the "Link" attribute [resolution].

### The next page: [Meta security](/docs/en/2_system_description/metadata_structure/meta_security/meta_security.md)

--------------------------------------------------------------------------  


 #### [Licence](/LICENSE) &ensp;  [Contact us](https://iondv.com) &ensp;  [Russian](/docs/ru/2_system_description/metadata_structure/meta_workflows/transitions_wf.md)   &ensp; [FAQs](/faqs.md) 
 
 --------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.  
All rights reserved. 