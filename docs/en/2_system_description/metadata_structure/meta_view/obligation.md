#### [Content](/docs/en/index.md)

### The previous page: [Activity conditions](/docs/en/2_system_description/metadata_structure/meta_view/enablement.md)

# Obligation conditions

## Description

**Obligation conditions** - set the condition to make the field mandatory in the view.
The syntax is the same as in the [visibility conditions](/docs/en/2_system_description/metadata_structure/meta_view/visibility.md).

Under this condition, the attribute becomes mandatory, otherwise the attribute remains the same as it was specified in the view before the obligation condition was applied.

### Example in JSON:
 ```
 {
          "caption": "Obligation conditions base",
          "type": 1,
          "property": "obligation_condition_base",
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
          "caption": "Field is mandatory if the base is filled",
          "type": 1,
          "property": "obligation_condition_use",
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
          "visibility": null,
          "enablement": null,
          "obligation": ".obligation_condition_base !\u003d \u0027\u0027",
          "readonly": false,
          "selectionPaginated": true,
          "validators": null,
          "hint": null,
          "historyDisplayMode": 0,
          "tags": null
        },
        {
          "caption": "Field is mandatory if the base has \u00271\u0027",
          "type": 1,
          "property": "obligation_condition_1",
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
          "visibility": null,
          "enablement": null,
          "obligation": ".obligation_condition_base \u003d\u003d \u00271\u0027",
          "readonly": false,
          "selectionPaginated": true,
          "validators": null,
          "hint": null,
          "historyDisplayMode": 0,
          "tags": null
        }

```
### The next page: [Tags](/docs/en/2_system_description/metadata_structure/meta_view/tags.md)

--------------------------------------------------------------------------  


 #### [Licence](/LICENCE.md) &ensp;  [Contact us](https://iondv.com) &ensp;  [Russian](/docs/ru/2_system_description/metadata_structure/meta_view/obligation.md)   &ensp; [FAQs](/faqs.md)   <div><img src="https://mc.iondv.com/watch/local/docs/framework" style="position:absolute; left:-9999px;" height=1 width=1 alt="iondv metrics"></div>       



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.  
All rights reserved. 