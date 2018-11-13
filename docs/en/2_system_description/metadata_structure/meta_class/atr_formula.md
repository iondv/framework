### The previous page: [Eager loading](/docs/en/2_system_description/metadata_structure/meta_class/eager_loading.md) 

# Computable attribute (without caching)

## Description

**Computable attributes (formula)** - are used to instantly generate a string expression (as a result) according to a preset algorithm when accessing a class object through the API. For example, when you open the object.

At the class meta level, the computable attributes store the algorithm for generating a string expression in the `formula` property.

For example you can access all unique values from the `name` attribute, which values are stored in the `ownOrg` collection. All the unique values, devided by "," are united in one string expression. 

```
      "formula": {
    "merge": [
      "$ownOrg",
      "name",
      null,
      1,
      ", "
    ]
      }
```

For example, If you have a collection with non-unique values, for example, "ownOrg1", "ownOrg2" and again "ownOrg1". If you need to obtain only the unique values of the collection "ownOrg1 and ownOrg2", then the above described formula for the computable attribute using the `merge` operation will be useful.

Depending on the function, you can refer to the necessary attribute to get the value through the attributes of the "Link", and "Collection" type. 

When saving changes and closing the form of an object, the result is not saved in the attribute if caching is not configured.

If the meta class has a few computable attributes, then the order of the calculation is set in the `orderNumber` property. You can use the results of calculations for a given order `orderNumber` in the following calculated attributes. 

In the semantics of a class or an attribute, you can specify computable attributes.

If you set `Null` in the `formula` property, then the attribute won't be computable and you cannot apply caching to it.

# How to configure?

Each formula begins with a description of the object and the function in the [JSON](https://en.wikipedia.org/wiki/JSON) file format.   
```
      "formula": {
    "function1": [
      {
        "function2": [
        "operand3"
      ]
      },
      "operand1",
      "operand2"
    ]
      }
```
You should specify [a suitable operation](/docs/en/2_system_description/metadata_structure/meta_class/atr_formula.md#available-operations) in the `function1` field with the desired number of operands for the result.

The object contains the full description of the algorithm, that controls the calculations except the functions stored in the depended computable attributes.

An array in a function stores the order of the operands that are passed to the function.

The functions operands could be:

* String values, storing the constant 
```
      "formula": {
    "function1": [
      "string"
    ]
      }
```

* String values, storing the [variables](/docs/en/2_system_description/metadata_structure/meta_variables.md)
```
      "formula": {
    "function1": [
      "$attr1"
    ]
      }
```

* Numerical values 
```
      "formula": {
    "function1": [
      3.14
    ]
      }
```

* Empty values
```
      "formula": {
    "function1": [
      null
    ]
      }
```

* Objects
```
      "formula": {
    "function1": [
      {
        "function2": [
        "operand1"
      ]
      }
    ]
      }
```

### Example of formulas:

```
{
      "orderNumber": 5,
      "name": "addressString",
      "caption": "",
      "type": 0,
      "size": null,
      "decimals": 0,
      "allowedFileTypes": null,
      "maxFileCount": 0,
      "nullable": true,
      "readonly": false,
      "indexed": true,
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
      "formula": {
        "concat": [
          {
            "if": [
              "$zipCode",
              {
                "concat": [
                  "$zipCode"
                ]
              },
              ""
            ]
          },
          " ",
          {
            "if": [
              "$subjectFederation",
              "$subjectFederation",
              ""
            ]
          },
          {
            "if": [
              "$federationBorough",
              {
                "concat": [
                  ", ",
                  "$federationBorough"
                ]
              },
              ""
            ]
          },
          {
            "if": [
              {
                "and": [
                  {
                    "ne": [
                      "$subjectFederation",
                      "St. Petersburg"
                    ]
                  },
                  {
                    "ne": [
                      "$subjectFederation",
                      "Moscow"
                    ]
                  }
                ]
              },
              {
                "concat": [
                  ", ",
                  "$town"
                ]
              },
              ""
            ]
          },
          {
            "if": [
              "$street",
              {
                "concat": [
                  ", ",
                  "$street"
                ]
              },
              ""
            ]
          },
          {
            "if": [
              "$houseNumber",
              {
                "concat": [
                  ", house ",
                  "$houseNumber"
                ]
              },
              ""
            ]
          },
          {
            "if": [
              "$flatNumber",
              {
                "concat": [
                  ", Apartment (office) ",
                  "$flatNumber"
                ]
              },
              ""
            ]
          }
        ]
      }
    },

```
**Result:** _ the output of the address with spaces and commas between the values of the attributes_


### Available operations:

`eq` - equal

`ne` - not equal

`lt` - less

`gt` - greater

`lte` - less or equal

`gte` - greater or equal

`and` - and

`or` - o

`not` - not

`add` -   arithmetic addition

`sub` -   arithmetical subtraction

`mul` - arithmetical multiplication

`div` -   arithmetical division

`nempty` - not empty

`empty` - empty

`pad` - additional symbols to the desired string length

`next` - [derive a new value from a sequence](/docs/en/2_system_description/metadata_structure/meta_class/atr_formula.md#auto-assignment-in-computable-attribute)

`merge` - concatenation of attributes in the collection

`size` - available attribute values - string and collection. For strings - returns the length, for collections - the number of elements

`element` - derive an arbitrary element from an array, indexation is from 0 ([array of values], [element index: 0 is the first element, last is the last element])

`dateAdd` - an addition to the data (in the notation momentjs - [Date], [add interval (number)], [unit (line [d, m, y, h, min, s, ms)]

`dateDiff` - difference between dates (in the notation momentjs - [unitism], [Date1], [Date2])

`now` - current date and time

`concat` - string concatenation
```
substring - deriving the substring ([String], [with which character], [how many characters])
```

`obj` - forming an object: odd arguments - property names, even arguments - values

aggregation:

`max`, `min`, `avg`, `sum`, `count`

All aggregation operations take the following arguments

or

```
[$Attribute name of collection], [Name of aggregated attribute], [Filtering Function of collection elements]
```

or

```
[Class name], [Aggregated attribute name], [The filter object formed by the "obj" operation is the corresponding notation of mongodb filters.]
```

`1` - indicates the uniqueness of the object, so it allows to count only unique objects for aggregation operations

`\n` -   line folding

### Example:

```
"formula": {
        "merge": [
          "$atr1",
          "atr2.name",
          null,
          1,
          "\n"
        ]
      },

``` 

## Auto-assignment in computable attribute

1. Set the `autoassigned: true`, so that calculated expression is not executed when opening the create form. The expressions will be calculated before saving. This is relevant when using the `next` operation in calculations, since it is not always necessary to derive the next value each time opening the creation form.

2. The default values are calculated before the object is written to the DB.

3. The `next($id)` operation (If the `$id` has a value) will always return 1, since for each object a separate sequence will be created, from which only the first value will be selected.

### The next page: [Cached values of computable attribute](/docs/en/2_system_description/metadata_structure/meta_class/atr_cached_true.md)    
--------------------------------------------------------------------------  


 #### [Licence](/LICENCE.md) &ensp;  [Contact us](https://iondv.com) &ensp;  [Russian](/docs/ru/2_system_description/metadata_structure/meta_class/atr_formula.md)   &ensp; [FAQs](/faqs.md)          



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.    
All rights reserved. 