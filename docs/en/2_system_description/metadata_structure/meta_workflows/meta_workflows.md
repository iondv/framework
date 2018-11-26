#### [Content](/docs/en/index.md)

### The previous page: [Meta navigation - Sample conditions](/docs/en/2_system_description/metadata_structure/meta_navigation/conditions.md) 

# Meta workflow

## Description

**Workflow** - is a clear sequence of actions to obtain a prescribed result. Generally, the workflow is repeated many times. The workflow allows you to display the stages of the process and set the conditions for its execution.

### JSON

```
{
  "name": "basic",
  "caption": "Mandate",
  "wfClass": "basic",
  "startState": "new",
  "states": [],
  "transitions": [],
  "metaVersion": "2.0.61"
}
```

## Field description

| Field | Name |Description  |
|:-----|:-------|:-----------|
|`"name"`| System name  | Workflow system name.|
|`"caption"`| Logical name   | Workflow logical name.|
|`"wfClass"`| Workflow class | Class to apply the workflow.|
|`"startState"`| Status   | Status assigned to the beginning of the workflow.|
|`"states"`|  [List of statuses](/docs/en/2_system_description/metadata_structure/meta_workflows/status_wf.md) | List of workflow statuses. |
|`"transitions"`|  [Transitions](/docs/en/2_system_description/metadata_structure/meta_workflows/transitions_wf.md)  | Transitions between  business process statuses. |
|`"metaVersion"`|  Versioning | Metadata versions.

## "Сontains" condition

To use the "contains" field, you should configure the eager loading in the collection. Otherwise, the collection will be empty, and the result will always be false. Conditions apply to the object retrieved from the database, no additional requests.

### Example

```
          {
              "property": "charge",
              "operation": 10,
              "value": null,
              "nestedConditions": [
                {
                  "property": "state",
                  "operation": 1,
                  "value": [
                    "close"
                  ],
                  "nestedConditions": []
                }
              ]
            }
```

## Configuration of hints

Configuration of hints when navigating by workflow status is the output of instructions in a separate modal window with buttons - “continue” or “cancel”. When you hover over the button, a pop-up hint appears, for more convenient use of workflows.

### Example

```json
"transitions": [
    {
      ...
      "confirm": true,
      "confirmMessage": null
    }
```

* `"confirm"` - confirmation of the action on the transition (+ standard text - "you really want to perform the `name` action").

* `"confirmMessage"` - unique text to display in confirmation instead of standard text.

### The next page: [Workflow statuses](/docs/en/2_system_description/metadata_structure/meta_workflows/status_wf.md)

--------------------------------------------------------------------------  


 #### [Licence](/LICENCE.md) &ensp;  [Contact us](https://iondv.com) &ensp;  [Russian](/docs/ru/2_system_description/metadata_structure/meta_workflows/meta_workflows.md)   &ensp; [FAQs](/faqs.md)          



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.  
All rights reserved. 