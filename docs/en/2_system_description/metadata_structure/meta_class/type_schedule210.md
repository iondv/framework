### The previous page: [Geodata](/docs/en/2_system_description/metadata_structure/meta_class/type_geodata100.md)  

# Schedule

**Schedule** - is a data type that stores the time periods or the frequency of regular events.

## Attributes on the form:

There are two types of fields for "Schedule" in the meta view:

`SCHEDULE = 210` – schedule is displayed in a table
`CALENDAR = 220` – schedule is displayed in a calendar

### Example of attribute structure in a table:

```
  {
          "caption": "Schedule [210]",
          "type": 210,
          "property": "schedule",
          "size": 2,
          "maskName": null,
          "mask": null,
          "mode": null,
          "fields": [],
          "hierarchyAttributes": null,
          "columns": [],
          "actions": null,
          "commands": null,
          "orderNumber": 20,
          "required": false,
          "visibility": null,
          "enablement": null,
          "obligation": null,
          "readonly": false,
          "selectionPaginated": true,
          "validators": null,
          "hint": "",
          "historyDisplayMode": 0,
          "tags": null
        },
```

### Example of attribute structure in a calendar: 

```
{
          "caption": "Calendar [220]",
          "type": 220,
          "property": "calendar",
          "size": 2,
          "maskName": null,
          "mask": null,
          "mode": null,
          "fields": [],
          "hierarchyAttributes": null,
          "columns": [],
          "actions": null,
          "commands": null,
          "orderNumber": 30,
          "required": false,
          "visibility": null,
          "enablement": null,
          "obligation": null,
          "readonly": false,
          "selectionPaginated": true,
          "validators": null,
          "hint": "",
          "historyDisplayMode": 0,
          "tags": null
        }
```

### Storage in the DB:

Time periods are specified as periodicity objects in the `occurs` field with the ` duration` property. Gaps in the time period are specified in the `skipped` field.

```
[
  {
    "description": "Working hours",
    "item": "develop-and-test@WorkTime@12345", // Reference to the data object
    "occurs": [ // occurs
        {
          "hour": 9, // at 9 o'clock
          "duration": 14400 // lasts 4 hours (4 * 60 * 60)
        },
        {
          "hour": 14, // at 14 o'clock
          "duration": 14400 // lasts 4 hours (4 * 60 * 60)
        }
     ],
     "skipped": [ // skipped
        {
          "weekday": 6 // on Saterdays
        },
        {
          "weekday": 7 // on Sundays

        }
     ]
  },
// ...
]
```

## Periodicity

In the periodicity object, attributes are set within their normal values, except for the `year` attribute - year. The `year` attribute is set as a frequency, since it is not a periodic characteristic.

### **Example**:

```
{
  "second": 30, // 1 - 60
  "minute": 20, // 1 - 60
  "hour": 9, // 0 - 23
  "day": 5, // 1 - 31
  "weekday": 1 // 1 - 7
  "month": 3 // 1 - 12
  "year": 2,
  "duration": 30 // 
}
```
 *Example description:* 
The example shows the time period of 30 seconds, which is repeated once every two years, on March 5 at 9 hours 20 minutes 30 seconds and only if the day falls on Monday.

### The next page: [Meta view](/docs/en/2_system_description/metadata_structure/meta_view/meta_view_main.md)
--------------------------------------------------------------------------  


 #### [Licence](/LICENCE.md) &ensp;  [Contact us](https://iondv.com) &ensp;  [Russian](/docs/ru/2_system_description/metadata_structure/meta_class/type_schedule210.md)   &ensp; [FAQs](/faqs.md)          



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.   
All rights reserved. 
