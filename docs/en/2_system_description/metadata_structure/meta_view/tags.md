#### [Content](/docs/en/index.md)

### The previous page: [Obligation conditions](/docs/en/2_system_description/metadata_structure/meta_view/obligation.md)

## CSS fields

**CSS fields** - set styles for attribute values using the `tags` attribute. The analog setting is set in `"options"` using templates. For more details see ["Options"](/docs/en/2_system_description/metadata_structure/meta_view/options.md).

### Syntax:

```
{
...
  tags: [
    "css-class:myCustomCssClass", // add css-class
    "css:background-color:green", // ass css-style
    "css:color:white" // add css-style
  ]
}
```

### Example:

```json
      {
          "caption": "The first attribute on the first tab",
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
          "tags": ["css:background-color:##AFFFAF"]
        }
```

## How to configure the starting position on the map?

### Example for the attribute of the "Geodata" type:

```
{
              "caption": "Coordinates",
              "type": 100,
              "property": "geo",
              "size": 2,
              "maskName": null,
              "mask": null,
              "mode": 0,
              "fields": [],
              "columns": [],
              "actions": null,
              "commands": null,
              "orderNumber": 34,
              "required": false,
              "visibility": null,
              "enablement": null,
              "obligation": null,
              "readonly": false,
              "selectionPaginated": true,
              "validators": null,
              "hint": "",
              "historyDisplayMode": 0,
              "tags": [
                "tryfind:Khabarovsk region",
                "tryfind:$address"
              ],
              "selConditions": [],
              "selSorting": []
            },

```
*Result:* when you open the coordinate creation form, the coordinates are automatically determined according to the value of the `" tags "` property. Where `$ address` is the value of the *address* attribute from the current class.

### The next page: [Options](/docs/en/2_system_description/metadata_structure/meta_view/options.md)

--------------------------------------------------------------------------  


 #### [Licence](/LICENSE) &ensp;  [Contact us](https://iondv.com) &ensp;  [Russian](/docs/ru/2_system_description/metadata_structure/meta_view/tags.md)   &ensp; [FAQs](/faqs.md)   <div><img src="https://mc.iondv.com/watch/local/docs/framework" style="position:absolute; left:-9999px;" height=1 width=1 alt="iondv metrics"></div>       



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.  
All rights reserved.