### The previous page: [Computable attributes](/docs/en/2_system_description/metadata_structure/meta_class/atr_formula.md#how-to-configure)

# Variables 

## Attribute values

`$` - is applied with the system name of the attribute and returns the value of the specified attribute. That means, if you specify `$ name` when forming any condition for the attribute values, then the `name` value of the attribute will be the source for the specified condition.

_Example for a computable attribute_
```
{
  "formula": {
        "count": [
            "$projects"
        ]
      }
   ...
}
```
This class has the attribute - `projects` of the "Collection" type and according to the formula, it is necessary to count the number of values of this attribute.

**The result**: the number of objects of the `projects` attribute.

## Current date/time

`$$now` - returns the current date/time

### Example for filter of sorting the valid values

in meta navigation:

```json
{
      "property": "dateEnd",
      "operation": 5,
      "value": [
        "$$now"
      ],
      "nestedConditions": []
    }
```
"dateEnd" less than current date/time

### Example for default value

in meta class:

```json
...
"defaultValue": "$$now",
...
```

`$$today` - returns the beginning of the day of the current date

_Rule is the same, only the date is without time._

## Date syntax in momentjs format

```
'DD.MM.YYYY'
```

```
NB. In the driver of MongoDB only basic features 
    of the momentjs format are available
 
```

## Current user

`$$uid` - returns the current user

### Example for filter of sorting the valid values in the collection

```json
{
"property": "collectionAttr",
"operation": 10,
"nestedConditions": [
   {
      "property": "user",
      "operation": 0,
      "value": ["$$uid"]
   }
] 
}
```
**The result**: display by the reference of the "Collection" type attribute only those objects, whose value of the "user" attribute matches the value of the current user.
 
--------------------------------------------------------------------------


#### [Licence](/LICENCE.md) &ensp;  [Contact us](https://iondv.ru/index.html) &ensp;  [Russian](/docs/ru/2_system_description/metadata_structure/meta_variables.md) &ensp; [FAQs](/faqs.md)   <div><img src="https://mc.iondv.com/watch/local/docs/framework" style="position:absolute; left:-9999px;" height=1 width=1 alt="iondv metrics"></div>       



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.   
All rights reserved. 