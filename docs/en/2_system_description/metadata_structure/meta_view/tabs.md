#### [Content](/docs/en/index.md)

### Back: [Meta View - general part](meta_view_main.md)

# Tabs

**Tabs** - is set in the create and edit view to divide class attributes into separate tabs on the form.

## Code realization:

```json
{
  "tabs": [
    {
       "caption": "1",
          "fullFields": [],
          "shortFields": []
    },
    {
       "caption": "2",
          "fullFields": [],
          "shortFields": []
    }
  ]
}
```

where, `caption` - is the tab name and `fullFields` - attributes on the tab

### Example
```
{
  "tabs": [
    {
      "caption": "First tab,
      "fullFields": [
        {
          "caption": "First attribute on the first tab",
          "type": 1,
          "property": "tab_1_1",
          "size": 2,
          "maskName": null,
          "mask": null,
          "mode": null,
          "fields": [],
          "hierarchyAttributes": null,
          "columns": [],
          "actions": null,
          "commands": [],
          "orderNumber": 10,
          "required": false,
          "visibility": null,
          "enablement": null,
          "obligation": null,
          "readonly": false,
          "selectionPaginated": true,
          "validators": null,
          "hint": null,
          "historyDisplayMode": 0,
          "tags": ["css:background-color:#AFFFAF"]
        },
        {
          "caption": "Second attribute on the first tab",
          "type": 1,
          "property": "tab_1_2",
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
        }
      ],

```
--------------------------------------------------------------------------  


 #### [Licence](/LICENSE) &ensp;  [Contact us](https://iondv.com/portal/contacts) &ensp;  [Russian](/docs/ru/2_system_description/metadata_structure/meta_view/tabs.md)   &ensp;
<div><img src="https://mc.iondv.com/watch/local/docs/framework" style="position:absolute; left:-9999px;" height=1 width=1 alt="iondv metrics"></div>       



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.   
All rights reserved. 