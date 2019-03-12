#### [Content](/docs/en/index.md)

### The previous page: [Meta node navigation](docs/en/2_system_description/metadata_structure/meta_navigation/navigation_nodes.md) 

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

To use the "contains" field, you should configure the eager loading in the collection. Otherwise, the collection will be empty, and the result will always be false. Conditions apply to the object retrieved from the database, without additional requests.

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

The "hints" feature represents the instructions in a separate modal window with buttons - “continue” or “cancel”. When you hover over the button, a pop-up hint appears, for more convenient use of workflows.

### Example

```json
"transitions": [
    {
      ...
      "confirm": true,
      "confirmMessage": null
    }
```

* `"confirm"` - confirmation of the action on the workflow transition (+ standard text - "you really want to perform the `name` action").

* `"confirmMessage"` - unique text to display in confirmation instead of standard text.

## Utility to form an array of objects

The utility allows you to create an object in the collection when the main object moves in the specified status. The fields of the created object are automatically filled in accordance with the settings specified for the `"values"` property.

In the `di`, in the `options` property write the following option to attach the indicator value creation utility to the WF status. 

```
state - name of the WF status
```
When the object moves in this status, the objects in the collection should be created. 

It is possible to use the utility as an "action". When remaking, just remove the command from the meta view.

Configure the utility in the deploy.json of the project. Syntax settings:

```
"map": {
    "workflow@namespace.stage": {
       "className@namespace": { // for what class object we create the object to the collection
           "collection": { // the name of the collection attribute in which the object is created
               "elementClass": "className2@namespace", // class whose objects are created by the utility
               "patterns": [
                  {
                      "values": {
                          "attr1": "string", // string
                          "attr2": 123, // number
                          "attr3": true,
                          "attr4": "$containerProperty1", // container property
                          "attr5": {"add": ["$containerProperty2", 300]} // formula
                      },
                      "push": [
                         "workflow2@namespace.stage1", // assignement of status to the WF of the created objects
                      ]
                  },
                  ...
               ]
           },
           ...
       },
       ...
    },
    ....
}
```

### The next page: [Workflow statuses](/docs/en/2_system_description/metadata_structure/meta_workflows/status_wf.md)

--------------------------------------------------------------------------  


 #### [Licence](/LICENCE.md) &ensp;  [Contact us](https://iondv.com) &ensp;  [Russian](/docs/ru/2_system_description/metadata_structure/meta_workflows/meta_workflows.md)   &ensp; [FAQs](/faqs.md)          



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.  
All rights reserved. 