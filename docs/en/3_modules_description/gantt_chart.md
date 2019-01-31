#### [Content](/docs/en/index.md)

### Back: [Modules](/docs/en/3_modules_description/modules.md)

# The "gantt-chart" module 

**The "gantt-chart" module** – is a central module designed specifically for working with data based on metadata structures - including project management, programs, events, etc.

## Configuration in deploy.json

### Setting the length of the search results

```
 "searchCount": 25,
```
### Adding filters to the columns

```json
"gantt-chart": {
      "globals": {
        "config": {
          "columns": [
            {
              "name": "text",
              "caption": "Name"
            },
            {
              "name": "owner",
              "caption": "Owner",
              "align": "center",
              "filter": true
            },
            {
              "name": "priority",
              "caption": "Priority",
              "align": "center",
              "filter": true
            },
```

### Specifying diffrent "createUrl" for different classes

```
 "createUrl": {
            "project@project-management": "registry/project-management@eventBasic/new/eventBasic",
            "event@project-management": "registry/project-management@eventBasic/new/eventBasic",
            "eventObject@project-management": "registry/project-management@eventOnly/new/eventOnly",
            "eventOnly@project-management": "registry/project-management@eventOnly/new/eventOnly",
            "projectKNA704@project-management": "registry/project-management@eventKNA704/new/eventKNA704",
            "eventKNA704@project-management": "registry/project-management@eventOnlyKNA704/new/eventOnlyKNA704",
            "eventObjectKNA704@project-management": "registry/project-management@eventOnlyKNA704/new/eventOnlyKNA704",
            "eventOnlyKNA704@project-management": "registry/project-management@eventOnlyKNA704/new/eventOnlyKNA704"
          },
```

## Configuration of view types

```
 "preConfigurations": {
            "config1": {
              "caption": "Main",
              "showPlan": true,
              "units": "month",
              "step": 3,
              "days_mode": "full",
              "hours_mode": "full",
              "default": true
            },
            "config2": {
              "caption": "Extended",
              "showPlan": false,
              "units": "year",
              "days_mode": "full",
              "hours_mode": "work",
              "columnDisplay": {
                "text": true,
                "owner": true
              },
              "filters": {
                "priority": "High"
              }
            },
            "config3": {
              "caption": "Review",
              "showPlan": true,
              "units": "year",
              "step": 5,
              "days_mode": "full",
              "hours_mode": "full",
              "columnDisplay": {
                "text": true,
                "owner": true,
                "priority": true
              },
              "filters": {
                "priority": "Regular"
              }
            }
          },
```

Set the property and values for the filter in the `filters` field.

### Adjustable filter when selecting subnodes

In formulas in the general syntax of expressions, you can now access the context data. Currently it works only for lists in register and gant. As we move to a common syntax, we implement support throughout the core.

The adjustable filter is not applied to the root object explicitly specified via the URL parameter, or selected in the drop-down list. The filter is applied only at the SELECTION of the subnodes.

### Sorting when displaying

When displaying the project, the events are sorting by the numEvent attribute at all levels of hierarchy

```
"sortBy": "numEvent"

// or
"sortBy": {"numEvent": -1, "anyOtherAttr": 1}
```

### Setting an object selection list to display information

It is used if the filter is configured for a column and allows you not to display all objects at once, but choose from the list. If the `"rootParamNeeded"` value is true, then a blank screen and a window for selecting a project are displayed.

```json
"gantt-chart": {
      "globals": {
        "rootParamNeeded": true
      }
    }
```

--------------------------------------------------------------------------  


 #### [Licence](/LICENCE.md)&ensp;  [Contact us](https://iondv.ru/index.html) &ensp;  
[Russian](/docs/ru/3_modules_description/gantt_chart.md) &ensp; [FAQs](/faqs.md)          



--------------------------------------------------------------------------  

Copyright (c) 2018 LLC "ION DV".
All rights reserved.
