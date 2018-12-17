#### [Content](/docs/en/index.md)

### The previous page: [Sorting a sample of valid values](/docs/en/2_system_description/metadata_structure/meta_class/atr_selsorting.md)

# Selection list of valid values

**Selection list of valid values** - sets the selection list of valid values for the propery in the attribute field. It is located in the attribute part of the meta class - ` "selectionProvider"`. The list is formed as an array of objects of the “key-value” type with a list of the value selection for an attribute of the “String”, “Real”, “Integer”, “Decimal”, and “Text” types.   

You have three types of selection list. Set the type in the `"type"` field using one of the following keys:  

* `"SIMPLE"` - is simple type of selection list, 
* `"MATRIX"` - is matrix type of selection list, 
* `"HQL"` - is request type of selection list (**to be realized**).

## Description of fields

### Structure of the selection list object

```
      "selectionProvider": {
        "type": "SIMPLE",
        "list": [...],
        "matrix": [],
        "parameters": [],
        "hq": ""
      },
```

| Field           | Name  | Acceptable values                                                                                                  | Description                                             |
|:---------------|:----------------------|:--------------------------------------------------------------------------------------------------------------------|:-----------------------------------------------------|
| `"type"`       | **Type**               | ` "SIMPLE", "MATRIX", "HQL"`                                                                                        | Selection list type                                    |
| `"list"`       | **Simple type**       | An array of objects of the "key-value" type                                                                               | Selection list of the Simple type is stored here |
| `"matrix"`     | **Matrix**           | An array of vectors. Each of vectors consists of: name, selection conditions and key-values | Selection list of the Matrix type          |
| `"parameters"` | **Parameters of request** | An array of objects of the "key-value" type                                                                               | Parameters of request, **to be realized**                |
| `"hq"`         | **Request**            | String of request in accordance with the handler format                                                                 | String of request - **to be realized**                   |

### The `"list"` field - an array of objects of the following structure: 

```
        "list": [
          {
            "key": "2001-03-23 09:00:00.000Z",
            "value": "Flooding of the Mir orbital station (March 23, 2001, 09:00 Moscow time)"
          },
          {
            "key": "1957-10-04 19:28:00.000Z",
            "value": "Launch of the world's first artificial satellite (October 4, 1957 at 19:28 greenwich)"
          },
          {
            "key": "1970-04-17 12:07:00.000Z",
            "value": "Completion of the flight" Apollo 13 "(April 17, 1970 12:07 Houston)"
          }
        ],
```

| Field      | Name | Acceptable values                                                                     | Description                                                         |
|:----------|:----------------------|:----------------------------------------------------------------------------------------|:-----------------------------------------------------------------|
| `"key"`   | **Key**              | Any value corresponding to the attribute type of the selection list  | When saving an object the key value is written in the DB |
| `"value"` | **Value**          | Any string, but there may be problems with control sequences           | The value of this field is displayed in the user interface      |

### The `"matrix"` field - an array of objects of the following structure:

```
        "matrix": [
          {
            "comment": "Both negative",
            "conditions": [
              {
                "property": "matrix_base_1",
                "operation": 5,
                "value": "0",
                "nestedConditions": []
              },
              {
                "property": "matrix_base_2",
                "operation": 5,
                "value": "0",
                "nestedConditions": []
              }
            ],
            "result": [
              {
                "key": "Both negative",
                "value": "Both negative"
              }
            ]
          },
          {
            "comment": "Both non-negative",
            "conditions": [
              {
                "property": "matrix_base_1",
                "operation": 8,
                "value": "0",
                "nestedConditions": []
              },
              {
                "property": "matrix_base_2",
                "operation": 8,
                "value": "0",
                "nestedConditions": []
              }
            ],
            "result": [
              {
                "key": "Both non-negative",
                "value": "Both non-negative"
              }
            ]
          },
          {
            "comment": "First non-negative second negative",
            "conditions": [
              {
                "property": "matrix_base_1",
                "operation": 8,
                "value": "0",
                "nestedConditions": []
              },
              {
                "property": "matrix_base_2",
                "operation": 5,
                "value": "0",
                "nestedConditions": []
              }
            ],
            "result": [
              {
                "key": "First non-negative second negative",
                "value": "First non-negative second negative"
              }
            ]
          },
          {
            "comment": "First negative second non-negative",
            "conditions": [
              {
                "property": "matrix_base_1",
                "operation": 5,
                "value": "0",
                "nestedConditions": []
              },
              {
                "property": "matrix_base_2",
                "operation": 8,
                "value": "0",
                "nestedConditions": []
              }
            ],
            "result": [
              {
                "key": "First negative second non-negative",
                "value": "First negative second non-negative"
              }
            ]
          }
        ],
        "parameters": [],
        "hq": ""
      },
```

Each object of the `"MATRIX"` array containns the  mandotary fields:

| Field           | Name  | Acceptable values                                 | Description                                                                                                       |
|:---------------|:----------------------|:----------------------------------------------------|:---------------------------------------------------------------------------------------------------------------|
| `"comment"`    | **Comment**       | Any string                                       | Comment to the vector                                                          |
| `"conditions"` | **Conditions**           | Array of objects                                     | Defines the conditions under which the list of objects described in `" result "` of this vector is displayed             |
| `"result"`     | **Results**        | Array of objects, similar to the structure of the `"list"` field | Sets the selection list that is displayed when the conditions are set correctly in the `"conditions"` field |


#### The `"conditions"` field of the `"MATRIX"` array

| Field                 | Name        | Acceptable values                                                   | Description                                                                                           |
|:---------------------|:-----------------------------|:----------------------------------------------------------------------|:---------------------------------------------------------------------------------------------------|
| `"property"`         | **Attribute**                  | String, only Latin alphabet, without spaces                                  | Class attribute is checked for the correspondence of  the field value to this condition of this vector  |
| `"operation"`        | **Operation**                 | Operation code                                                          | The definition is made according to the operation                                                |
|                      |                              | _0 - equal (AND)_                                                       |                                                                                                    |
|                      |                              | _1 - not equal (OR)_                                                  |                                                                                                    |
|                      |                              | _2 - empty (NOT)_                                                      |                                                                                                    |
|                      |                              | _3 - not empty (MINIMUM OF)_                                               |                                                                                                    |
|                      |                              | _4 - (MAXIMUM OF)_                                                       |                                                                                                    |
|                      |                              | _5 - < ()_                                                            |                                                                                                    |
|                      |                              | _6 - >_                                                               |                                                                                                    |
|                      |                              | _7 - <=_                                                              |                                                                                                    |
|                      |                              | _8 - >=_                                                              |                                                                                                    |
|                      |                              | _9 - IN /Similar/_                                                                   |                                                                                                    |
|                      |                              | _10 - contains_                                                       |                                                                                                    |
| `"value"`            | **Value**                 | Depends on the operation type                                              |The second value for binary operations                                                              |
| `"nestedConditions"` | **Nested selection conditions** | The object, the structure is similar to the structure of the object of the selection conditions |                                                                                                    |

_**NB**: The operation code corresponds to the different values of operations, depending on whether the attribute is selected or not. If the  `"property"` field is equal to `null`, then a logical condition (by which the nested selection conditions are combined) is coded. (Indicated in brackets in the table above)_

## Description

### Selection list of the "SIMPLE" type

This selection list allows to create the hard-coded preset value fields, limiting the choice of the user in the application.  
Be sure to set the “Drop-down list [5]” view type, it's mandatory. It saves the data in the DB in a type other than the type of data displayed to the user.   
 
_Example_: If in the `key` fiels you set the elements of the selection list of the data-time type in the ISODate, and in the `value` field - the event description, the result will be: the user can choose the event, but will work with ISODate data inside the app. 

_**NB**: If the attribute with a selection list has an empty value as `"nullable": true` - the empty value is added automatically in the selection list!_

```
    {
      "orderNumber": 50,
      "name": "sp_date",
      "caption": "Save the data-time key",
      "type": 9,
      "size": null,
      "decimals": 0,
      "allowedFileTypes": null,
      "maxFileCount": 0,
      "nullable": true,
      "readonly": false,
      "indexed": false,
      "unique": false,
      "autoassigned": false,
      "hint": null,
      "defaultValue": null,
      "refClass": "",
      "itemsClass": "",
      "backRef": "",
      "backColl": "",
      "binding": "",
      "semantic": null,
      "selConditions": [],
      "selSorting": [],
      "selectionProvider": {
        "type": "SIMPLE",
        "list": [
          {
            "key": "2001-03-23T09:00:00.000Z",
            "value": "Flooding of the Mir orbital station (March 23, 2001, 09:00 Moscow time)"
          },
          {
            "key": "1957-10-04T19:28:00.000Z",
            "value": "Launch of the world's first artificial satellite (October 4, 1957 at 19:28 greenwich)"
          },
          {
            "key": "1970-04-17T12:07:00.000Z",
            "value": "Completion of the flight" Apollo 13 "(April 17, 1970 12:07 Houston)"
          }
        ],
        "matrix": [],
        "parameters": [],
        "hq": ""
      },
      "indexSearch": false,
      "eagerLoading": false,
      "formula": null
    }
```

#### How to configure?
You need to:
1. choose the most appropriate attribute type,
2. choose the identifiers of the type (`"key"`) to operate with values in the DB as efficiently as possible where necessary automated processing,
3. set the phrase to each key, that will be displayed in the `"value"` field,
4. imperatively set the “Drop-down list [5]” view type.

### Selection list of the "MATRIX" type  

All that falls under the conditions is the resulting selection list in matrix. If there is no conditions - the system will always apply the selection list.  

For the predictability of the application, respect two conditions:

1. Vectors should not overlap each other.
2. Array of values of the initial attribute, as the matrix base (an array of combinations of the initial (reference) attributes values) must be completely closed by the described vectors.

The system takes the value of the reference field (s) and consistently applies the conditions of the vectors to this field. Each vector is the set of conditions and its own selection list. As soon as the system reaches the vector with satisfied conditions, it takes its selection list and defines the output in the UI. It is assumed that the system will find the corresponding vector for any value of the reference field.

#### Example 1: Matrix of two integer values

**JSON of the class**:

```
{
  "isStruct": false,
  "key": [
    "id"
  ],
  "semantic": "",
  "name": "selection_provider_matrix_dc",
  "version": "",
  "caption": "\"MATRIX\" of two bases",
  "ancestor": null,
  "container": null,
  "creationTracker": "",
  "changeTracker": "",
  "history": 0,
  "journaling": false,
  "compositeIndexes": [],
  "properties": [
    {
      "orderNumber": 10,
      "name": "id",
      "caption": "Identifier",
      "type": 12,
      "size": null,
      "decimals": 0,
      "allowedFileTypes": null,
      "maxFileCount": 0,
      "nullable": false,
      "readonly": false,
      "indexed": false,
      "unique": true,
      "autoassigned": true,
      "hint": null,
      "defaultValue": null,
      "refClass": "",
      "itemsClass": "",
      "backRef": "",
      "backColl": "",
      "binding": "",
      "semantic": null,
      "selConditions": [],
      "selSorting": [],
      "selectionProvider": null,
      "indexSearch": false,
      "eagerLoading": false,
      "formula": null
    },
    {
      "orderNumber": 20,
      "name": "matrix_base_1",
      "caption": "First integer matrix base",
      "type": 6,
      "size": null,
      "decimals": 0,
      "allowedFileTypes": null,
      "maxFileCount": 0,
      "nullable": true,
      "readonly": false,
      "indexed": false,
      "unique": false,
      "autoassigned": false,
      "hint": null,
      "defaultValue": null,
      "refClass": "",
      "itemsClass": "",
      "backRef": "",
      "backColl": "",
      "binding": "",
      "semantic": null,
      "selConditions": [],
      "selSorting": [],
      "selectionProvider": null,
      "indexSearch": false,
      "eagerLoading": false,
      "formula": null
    },
    {
      "orderNumber": 30,
      "name": "matrix_base_2",
      "caption": "Second integer matrix base",
      "type": 6,
      "size": null,
      "decimals": 0,
      "allowedFileTypes": null,
      "maxFileCount": 0,
      "nullable": true,
      "readonly": false,
      "indexed": false,
      "unique": false,
      "autoassigned": false,
      "hint": null,
      "defaultValue": null,
      "refClass": "",
      "itemsClass": "",
      "backRef": "",
      "backColl": "",
      "binding": "",
      "semantic": null,
      "selConditions": [],
      "selSorting": [],
      "selectionProvider": null,
      "indexSearch": false,
      "eagerLoading": false,
      "formula": null
    },
    {
      "orderNumber": 40,
      "name": "selection_provider_matrix",
      "caption": "Selection list of the \"MATRIX\" type",
      "type": 0,
      "size": null,
      "decimals": 0,
      "allowedFileTypes": null,
      "maxFileCount": 0,
      "nullable": true,
      "readonly": false,
      "indexed": false,
      "unique": false,
      "autoassigned": false,
      "hint": null,
      "defaultValue": null,
      "refClass": "",
      "itemsClass": "",
      "backRef": "",
      "backColl": "",
      "binding": "",
      "semantic": null,
      "selConditions": [],
      "selSorting": [],
      "selectionProvider": {
        "type": "MATRIX",
        "list": [],
        "matrix": [
          {
            "comment": "Both negative",
            "conditions": [
              {
                "property": "matrix_base_1",
                "operation": 5,
                "value": "0",
                "nestedConditions": []
              },
              {
                "property": "matrix_base_2",
                "operation": 5,
                "value": "0",
                "nestedConditions": []
              }
            ],
            "result": [
              {
                "key": "Both negative",
                "value": "Both negative"
              }
            ]
          },
          {
            "comment": "Both non-negative",
            "conditions": [
              {
                "property": "matrix_base_1",
                "operation": 8,
                "value": "0",
                "nestedConditions": []
              },
              {
                "property": "matrix_base_2",
                "operation": 8,
                "value": "0",
                "nestedConditions": []
              }
            ],
            "result": [
              {
                "key": "Both non-negative",
                "value": "Both non-negative"
              }
            ]
          },
          {
            "comment": "First non-negative second negative",
            "conditions": [
              {
                "property": "matrix_base_1",
                "operation": 8,
                "value": "0",
                "nestedConditions": []
              },
              {
                "property": "matrix_base_2",
                "operation": 5,
                "value": "0",
                "nestedConditions": []
              }
            ],
            "result": [
              {
                "key": "First non-negative second negative",
                "value": "First non-negative second negative"
              }
            ]
          },
          {
            "comment": "First negative second non-negative",
            "conditions": [
              {
                "property": "matrix_base_1",
                "operation": 5,
                "value": "0",
                "nestedConditions": []
              },
              {
                "property": "matrix_base_2",
                "operation": 8,
                "value": "0",
                "nestedConditions": []
              }
            ],
            "result": [
              {
                "key": "First negative second non-negative",
                "value": "First negative second non-negative"
              }
            ]
          }
        ],
        "parameters": [],
        "hq": ""
      },
      "indexSearch": false,
      "eagerLoading": false,
      "formula": null
    }
  ]
}
```

### The order of development  

Devide all possible combinations of attribute pairs - `"matrix_base_1"` and `"matrix_base_2"` into 4 vectors. Each field can be either negative or non-negative. 

Choose vectors and their conditions:

1. Both negative: (matrix_base_1 < 0) && (matrix_base_2 < 0)
2. Both non-negative: (matrix_base_1 >= 0) && (matrix_base_2 >= 0)
3. First non-negative second negative: (matrix_base_1 >= 0) && (matrix_base_2 < 0)
4. First negative second non-negative: (matrix_base_1 < 0) && (matrix_base_2 >= 0)

If in the 3 and 4 conditions the equality to zero is not correctly set, as a result - drop-down elements and overlapping of vectors.  

In the example above, for each vector the selection list is limited to one item, but there may be more.

#### Example 2: matrix of free real value with compound conditions
```
{
  "isStruct": false,
  "metaVersion": "2.0.7",
  "key": [
    "id"
  ],
  "semantic": "",
  "name": "selection_provider_matrix_real",
  "version": "",
  "caption": "\"MATRIX\" с векторами \u003c, \u003e, \u003c\u003d, \u003e\u003d, \u003d от действительного",
  "ancestor": null,
  "container": null,
  "creationTracker": "",
  "changeTracker": "",
  "history": 0,
  "journaling": false,
  "compositeIndexes": null,
  "properties": [
    {
      "orderNumber": 10,
      "name": "id",
      "caption": "Identifier",
      "type": 12,
      "size": null,
      "decimals": 0,
      "allowedFileTypes": null,
      "maxFileCount": 0,
      "nullable": false,
      "readonly": false,
      "indexed": false,
      "unique": true,
      "autoassigned": true,
      "hint": null,
      "defaultValue": null,
      "refClass": "",
      "itemsClass": "",
      "backRef": "",
      "backColl": "",
      "binding": "",
      "semantic": null,
      "selConditions": [],
      "selSorting": [],
      "selectionProvider": null,
      "indexSearch": false,
      "eagerLoading": false,
      "formula": null
    },
    {
      "orderNumber": 20,
      "name": "matrix_base",
      "caption": "The real base for the matrix type selection list",
      "type": 7,
      "size": null,
      "decimals": 0,
      "allowedFileTypes": null,
      "maxFileCount": 0,
      "nullable": true,
      "readonly": false,
      "indexed": false,
      "unique": false,
      "autoassigned": false,
      "hint": null,
      "defaultValue": null,
      "refClass": "",
      "itemsClass": "",
      "backRef": "",
      "backColl": "",
      "binding": "",
      "semantic": null,
      "selConditions": [],
      "selSorting": [],
      "selectionProvider": null,
      "indexSearch": false,
      "eagerLoading": false,
      "formula": null
    },
    {
      "orderNumber": 30,
      "name": "selection_provider_matrix",
      "caption": "Selection list with compound conditions",
      "type": 6,
      "size": null,
      "decimals": 0,
      "allowedFileTypes": null,
      "maxFileCount": 0,
      "nullable": false,
      "readonly": false,
      "indexed": false,
      "unique": false,
      "autoassigned": false,
      "hint": null,
      "defaultValue": null,
      "refClass": "",
      "itemsClass": "",
      "backRef": "",
      "backColl": "",
      "binding": "",
      "semantic": null,
      "selConditions": [],
      "selSorting": [],
      "selectionProvider": {
        "type": "MATRIX",
        "list": [],
        "matrix": [
          {
            "comment": "matrix_base \u003c 3",
            "conditions": [
              {
                "property": "matrix_base",
                "operation": 5,
                "value": [
                  "3"
                ],
                "nestedConditions": []
              }
            ],
            "result": [
              {
                "key": "1",
                "value": "Save 1 if the base is less then  3"
              },
              {
                "key": "2",
                "value": "Save 2 if the base is less then 3"
              }
            ]
          },
          {
            "comment": "matrix_base \u003d 3",
            "conditions": [
              {
                "property": "matrix_base",
                "operation": 0,
                "value": [
                  "3"
                ],
                "nestedConditions": []
              }
            ],
            "result": [
              {
                "key": "3",
                "value": "Save 3 if the base is 3"
              }
            ]
          },
          {
            "comment": "matrix_base \u003e 3 и matrix_base \u003c\u003d 15",
            "conditions": [
              {
                "property": "matrix_base",
                "operation": 6,
                "value": [
                  "3"
                ],
                "nestedConditions": []
              },
              {
                "property": "matrix_base",
                "operation": 7,
                "value": [
                  "15"
                ],
                "nestedConditions": []
              }
            ],
            "result": [
              {
                "key": "5",
                "value": "Save 5 if the base is \u003e 3 и \u003c\u003d 15"
              },
              {
                "key": "10",
                "value": "Save 10 if the base is \u003e 3 и \u003c\u003d 15"
              },
              {
                "key": "15",
                "value": "Save 15 if the base is \u003e 3 и \u003c\u003d 15"
              }
            ]
          },
          {
            "comment": "matrix_base \u003e\u003d16",
            "conditions": [
              {
                "property": "matrix_base",
                "operation": 8,
                "value": [
                  "16"
                ],
                "nestedConditions": []
              }
            ],
            "result": [
              {
                "key": "50",
                "value": "Save 50 if the base is \u003e\u003d 16"
              },
              {
                "key": "100",
                "value": "Save 100 if the base is \u003e\u003d16"
              },
              {
                "key": "1000",
                "value": "Save 1000 if the base is \u003e\u003d16"
              },
              {
                "key": "5000",
                "value": "Save 5000 if the base is \u003e\u003d16"
              }
            ]
          },
          {
            "comment": "matrix_base \u003e 15 и matrix_base \u003c 16",
            "conditions": [
              {
                "property": "matrix_base",
                "operation": 6,
                "value": [
                  "15"
                ],
                "nestedConditions": []
              },
              {
                "property": "matrix_base",
                "operation": 5,
                "value": [
                  "16"
                ],
                "nestedConditions": []
              }
            ],
            "result": [
              {
                "key": "0",
                "value": "Save 0, if the base is between 15 and 16"
              }
            ]
          }
        ],
        "parameters": [],
        "hq": ""
      },
      "indexSearch": false,
      "eagerLoading": false,
      "formula": null
    }
  ]
}
```

**Vectors and their conditions**:

1. matrix_base < 3 
2. matrix_base = 3
3. (matrix_base > 3) && (matrix_base <= 15)
4. matrix_base >= 16  
5. (matrix_base > 15) && (matrix_base < 16)




### The next page: [Eager loading](/docs/en/2_system_description/metadata_structure/meta_class/eager_loading.md)
--------------------------------------------------------------------------  


 #### [Licence](/LICENCE.md) &ensp;  [Contact us](https://iondv.com) &ensp;  [Russian](/docs/ru/2_system_description/metadata_structure/meta_class/atr_selectionprovider.md)   &ensp; [FAQs](/faqs.md)          



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.   
All rights reserved. 