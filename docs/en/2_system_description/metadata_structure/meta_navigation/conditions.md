#### [Content](/docs/en/index.md)

### Back: [Meta node navigation](navigation_nodes.md)

# Sample conditions - `"conditions"`

**Sample conditions** `"conditions"` - are filters when opening the list of objects.

## Saved filters

Before opening any page, in the registries, the system will read filters to find suitable ones for this window. Suitable filters consist of two parts:
1. General filters for all classes.
2. Filters for a specific class.

### General filters for all classes

**General filters for all classes** - are filters that are displayed for all opened classes. The difference in the code is that in the class attribute the general filter has the keyword `ALL`, and the personal filters (filters for specific classes) in this attribute have the name of the class for which it is applicable.

When saving, click "For all classes" to make this filter available for all classes.

### Filters for specific classes

To create a **filter for a specific class**, open the objects of the specific class, generate a filter, save it and make sure that the "For all classes" field is empty.

### Code realization

For now, we have a unified specification of expressions for both computed expressions and for the sample conditions and calculations in aggregation.

We mainly work with the `_list-filter-ui` file - it starts the search for the necessary filters, and also parses the current data to create new filters.
The `_list-filter-ui` file describes which attributes can participate in the creation of filters and how exactly they should look and be saved (for example, the date and checkbox look differently).

The `cond` property contains the filter data that is subsequently substituted in the search condition (in the _metaCRUD.js file)

### Example

```
        if (cond !== undefined && cond !== '' && cond !== 'undefined') {
          var condObj = JSON.parse(cond);
          if (Array.isArray(condObj) && condObj.length > 0) {
            for (var k = 0; k < condObj.length; k++) {
              if (condObj[k].type === 6) {
                condObj[k].value = new Date(condObj[k].value);
              }
              where[condObj[k].property] = getwherebyOperation(condObj[k]);
            }
          }
        }
```

**NB:** New available filters - `min` and `max` expand the possibilities of creating filters and conditions in the menu.

### Necessary meta
The necessary meta is the meta class of filters - `ion_filter`. It is located in the `calc` directory, which by default is a folder with classes and a meta for the system. Except for one class, nothing more is needed. **To be revised**

## Search by the reference objects

If the search proceeds according to the "equal" or "contains" operations, then it proceeds in the semantics of this object. If the search proceeds according to the "maximum" or "minimum" operations, then it searches the value of the field. Thus, it is possible to search in the reference attributes, without unnecessary queries to the DB, which improves performance.

```
[{property:okatoNasPunkta_title,operation:20,value:Forest,title:Locality contains Forest,type:2}]
```

# Filters in the menu

It is possible not only to produce sorted data in the list of menu conditions, but also to limit the samples, that is, to apply filters.

## Meta for the filter operations

### Example of menu with filter

```
{
  "code": "passportObject.population",
  "type": 1,
  "orderNumber": 10,
  "caption": "Population",
  "classname": "population",
  "container": null,
  "collection": null,
  "conditions": [
  {"property": "god"
  ,"operation": 10}
  ],
  "sorting": [],
  "pathChains": []
}
```

The `conditions` attribute contains two objects:

1. `property` - filtering property
2. `operation` - filtering operation

In this case, this filter has the following meaning - *show all objects of the `population` class with a minimum year*.

If you need to specify a value, the third attribute will be `value` and the value to search, for example:

```
{"property": "god"
  ,"operation": 0
, "value": 2015}
```

## Configuration of filter to display objects of the heir class

The class page for the navigation node is the parent class. When navigating through this navigation, it is necessary to display objects of the class of an inheritor of this class, then use a filter of the following type:

```
{
   property: "atr1.__class",
   operation: 0,
   value: ["childClass@ns"]
}
```

where, `atr1 .__ class` is an attribute of the parent class by which objects are selected, `childClass` - is a heir, whose objects are displayed in the navigation. This filter has the following meaning - *show on the list form only those objects that have the  `attr1` attribute that is an object of `childClass` class*.

## Table of operations

| Field                 | Name         | Acceptable values                                                   | Description                                                                                            |
|:---------------------|:-----------------------------|:----------------------------------------------------------------------|:---------------------------------------------------------------------------------------------------|
| `"property"`         | **Attribute**                  | String in Latin characters with no spaces                                  |Class attribute whose field value is checked for compliance with this condition of this vector. |
| `"operation"`        | **Operation**                 | Operation code                                                          | The operation under which the identification is made.                                                |
|                      |                              | _0 - equal (AND)_                                                       |                                                                                                    |
|                      |                              | _1 - not equal (OR)_                                                  |                                                                                                    |
|                      |                              | _2 - empty (NOT)_                                                      |                                                                                                    |
|                      |                              | _3 - not empty (MIN FROM)_                                               |                                                                                                    |
|                      |                              | _4 - (MAX FROM)_                                                       |                                                                                                    |
|                      |                              | _5 - < ()_                                                            |                                                                                                    |
|                      |                              | _6 - >_                                                               |                                                                                                    |
|                      |                              | _7 - <=_                                                              |                                                                                                    |
|                      |                              | _8 - >=_                                                              |                                                                                                    |
|                      |                              | _9 - IN /Similar/_                                                                   |                                                                                                    |
|                      |                              | _10 - contains_                                                       |                                                                                                    |
| `"value"`            | **Value**                 | Depends on the operation type                                              | The second value for binary operations                                                           |
| `"nestedConditions"` | **Nested conditions** | The object, its structure is similar to the structure of the object of the selection conditions. |                                                                                                    |

**NB:** the operation code corresponds to different values of operations, depending on whether the attribute is selected or not. If the `" property"` field is `null`, then a logical condition is coded by which the nested selection conditions are combined (indicated in parentheses in the table above).

### Operations for dates

| code | value | system name |
| -------- | -------- | -------- |
|8| Create date |  DATE | 
|9| Add the time frame to the date | DATEADD |
|10|  Find the time frame between dates | DATEDIFF |
|12|  Subtraction |  |
|24|  Day of the month | |

The `DATEADD` arguments: _data, time frame, unit for measuring time [ms, s, min, h, d, m, y] (by default - day (d))_

The `DATEDIFF` arguments: _end date, start date, unit for measuring the result [ms, s, min, h, d, m, y] (by default - day (d)), the logical flag of casting to an integer_

#### Comparing the current date with the month

Setting the selection of objects in the list with the ability to compare the date value with any month of the year.
For example, setting the filter in such a way that only objects where the "End Date" attribute value is the current month would be shown in the navigation.

For this, the beginning of the current month is calculated. After that, you can add or subtract an arbitrary number of months to it and compare the result with the required date.

_Calculate the end of the current month_:

```
{
  "property": null,
  "operation": 9,
  "value": null,
  "nestedConditions": [
    {
      "property": null,
      "operation": 9,
      "value": null,
      "nestedConditions": [
        {
          "property": null,
          "operation": 8,
          "value": ["today"],
          "nestedConditions": []
        },
        {
          "property": null,
          "operation": 12,
          "value": null,
          "nestedConditions": [
            {
              "property": null,
              "operation": null,
              "value": [0],
              "nestedConditions": []
            },
            {
              "property": null,
              "operation": 24,
              "value": null,
              "nestedConditions": [
                {
                  "property": null,
                  "operation": 8,
                  "value": ["today"],
                  "nestedConditions": []
                }
              ]
            }
          ]
        },
        {
          "property": null,
          "operation": null,
          "value": ["d"],
          "nestedConditions": []
        }
      ]
    },
    {
      "property": null,
      "operation": null,
      "value": [1],
      "nestedConditions": []
    },
    {
      "property": null,
      "operation": null,
      "value": ["m"],
      "nestedConditions": []
    }
  ]
}
```

1. Firstly the day of the month is calculated for the current date::

```
{
  "property": null,
  "operation": 24,
  "value": null,
  "nestedConditions": [
    {
      "property": null,
      "operation": 8,
      "value": ["today"],
      "nestedConditions": []
    }
  ]
}
```

2. Received conditional value "d". Next, you need to subtract the resulting value from 0 (0-d):

```
{
  "property": null,
  "operation": 12,
  "value": null,
  "nestedConditions": [
    {
      "property": null,
      "operation": null,
      "value": [0],
      "nestedConditions": []
    },
    {
      "property": null,
      "operation": 24,
      "value": null,
      "nestedConditions": [
        {
          "property": null,
          "operation": 8,
          "value": ["today"],
          "nestedConditions": []
        }
      ]
    }
  ]
}
```

3. The conditional value "-d" is obtained. Next to the current date is added the value of "-d" days:

```
{
  "property": null,
  "operation": 9,
  "value": null,
  "nestedConditions": [
    {
      "property": null,
      "operation": 8,
      "value": ["today"],
      "nestedConditions": []
    },
    {
      "property": null,
      "operation": 12,
      "value": null,
      "nestedConditions": [
        {
          "property": null,
          "operation": null,
          "value": [0],
          "nestedConditions": []
        },
        {
          "property": null,
          "operation": 24,
          "value": null,
          "nestedConditions": [
            {
              "property": null,
              "operation": 8,
              "value": ["today"],
              "nestedConditions": []
            }
          ]
        }
      ]
    },
    {
      "property": null,
      "operation": null,
      "value": ["d"],
      "nestedConditions": []
    }
  ]
}
```
4. Received the beginning of the current month. 
5. To calculate the end of the current month, add 1 month to the received value of the beginning of the month:

```
{
  "property": "date",
  "operation": 5,
  "value": null,
  "nestedConditions": [
    {
      "property": null,
      "operation": 9,
      "value": null,
      "nestedConditions": [
        {
          "property": null,
          "operation": 9,
          "value": null,
          "nestedConditions": [
            {
              "property": null,
              "operation": 8,
              "value": ["today"],
              "nestedConditions": []
            },
            {
              "property": null,
              "operation": 12,
              "value": null,
              "nestedConditions": [
                {
                  "property": null,
                  "operation": null,
                  "value": [0],
                  "nestedConditions": []
                },
                {
                  "property": null,
                  "operation": 24,
                  "value": null,
                  "nestedConditions": [
                    {
                      "property": null,
                      "operation": 8,
                      "value": ["today"],
                      "nestedConditions": []
                    }
                  ]
                }
              ]
            },
            {
              "property": null,
              "operation": null,
              "value": ["d"],
              "nestedConditions": []
            }
          ]
        },
        {
          "property": null,
          "operation": null,
          "value": [1],
          "nestedConditions": []
        },
        {
          "property": null,
          "operation": null,
          "value": ["m"],
          "nestedConditions": []
        }
      ]
    }
  ]
}
```
--------------------------------------------------------------------------  


 #### [Licence](/LICENSE) &ensp;  [Contact us](https://iondv.com/portal/contacts) &ensp;  [Russian](/docs/ru/2_system_description/metadata_structure/meta_navigation/conditions.md)   &ensp;
<div><img src="https://mc.iondv.com/watch/local/docs/framework" style="position:absolute; left:-9999px;" height=1 width=1 alt="iondv metrics"></div>       



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.  
All rights reserved. 