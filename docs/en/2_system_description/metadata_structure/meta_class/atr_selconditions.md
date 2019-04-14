#### [Content](/docs/en/index.md)

### The previous page: [Collection](/docs/en/2_system_description/metadata_structure/meta_class/atr_itemclass_backcoll.md) 

# Conditions of sorting the valid values

## Description 

**Conditions of sorting the valid values** - allows you to limit the selection of objects by reference that are valid for binding in this reference attribute.

Filter of sorting the valid values is used in the meta class for the attributes of the reference and collection types. The filter sets the conditions to limit the sample of objects. Conditions are imposed as a list of consecutive operations.

### Available operations:

```
•  EQUAL: 0, // equal = 
•  NOT_EQUAL: 1, // not equal <> 
•  EMPTY: 2, // empty '' or null 
•  NOT_EMPTY: 3, // not empty !'' or !null 
•  LIKE: 4, // similar 
•  LESS: 5, // less < 
•  MORE: 6, // more >
•  LESS_OR_EQUAL: 7, // less or equal <=
•  MORE_OR_EQUAL: 8, // more or equal >=
•  IN: 9, // item is in collection / array (IN) 
•  CONTAINS: 10 // contains

```
```
module.exports = {
  AND: 0,
  OR: 1,
  NOT: 2,
  MIN: 3,
  MAX: 4,
  AVG: 5,
  SUM: 6,
  COUNT: 7
};
```
## Description of operations:
All operations can be devided into groups according to the properties in the condition:

**The attribute is not set in the condition and the condition is the object**
   * nestedConditions does not contain conditions
     * Aggregation operations `AgregOpers`
       1. MIN
       2. MAX
       3. AVG
       4. SUM
       5. COUNT
   * nestedConditions contains conditions
      * Logical operations of comparison of nested conditions `BoolOpers`  
        2. OR  
        3. NOT

**The attribute is set in the condition and the condition is the object**: operations of comparison the attribute value in the condition with the value in the "value" field 
   1. EMPTY
   2. NOT_EMPTY
   3. CONTAINSточку
   4. EQUAL
   5. NOT_EQUAL
   6. LESS
   7. MORE
   8. LESS_OR_EQUAL
   9. MORE_OR_EQUAL
   10. LIKE
   11. IN

**Condition in an array**
   * Use the logic operation - "AND", to compare the results of conditions (objects in array).
   
The operation of the key-expression type - the key is the attribute name in the reference class or in the collection class. Adjacent conditions are combined by a logical “AND” operation (unless another operation is specified) - filters are added to the "selConditions" property.

## Operations and other particular qualities

Use the "nestedConditions" to perform the attribute inquiry. For each attribute - a separate operation. Do not specify nested reference attributes by a point in the "property" field. 

To inquiry attribute values that are not equal to zero, use the `nempty` operation and specify `null` in the "value" field.

The **CONTAINS** operation is applied to the following attribute types:
- string - the LIKE operation is applied to the data string
- collection
- the IN operation is applied if the compared `value` is an array and contains at least one element
- transition to nested conditions `nestedConditions` occurs if the compared `value` is not an array or does not contain at least one element in the array

## JSON
 ```
{
  "selConditions": [
    {
      "property": "region",
      "operation": 10,
      "value": "Khabarovsk region",
      "nestedConditions": [
        {
          "property": "town",
          "operation": 0,
          "value": "Khabarovsk",
          "nestedConditions": []
        }
      ]
    }
  ]
}
 ```
 ```
{
  "selConditions": [
    {
      
          "property": "town",
          "operation": 3,
          "value": null,
          "nestedConditions": []
        }
      ]
}
 ```
## Field description

| Field                 | Name        | Acceptable values                                                   | Description                                                            |
|:---------------------|:-----------------------------|:----------------------------------------------------------------------|:--------------------------------------------------------------------|
| `"property"`         | **Attribute**                  | String in latin characters with no spaces                                  | Attribute of the reference class, according to which the values are filtered |
| `"operation"`        | **Operation**                 | Operation code (see above)                                               | Operation of object filtration                  |
| `"value"`            | **Value**                 | Depends on the operation type                                              | The second value for binary filtering operations                    |
| `"nestedConditions"` | **Nested sorting conditions** | The object structure is similar to the structure of the object of the selection conditions |                                                                     |

**Attention:** the "selection_provider" field. For more detail see [**Selection list of valid values**](/docs/en/2_system_description/metadata_structure/meta_class/atr_selectionprovider.md).

### Example

* "type": "SIMPLE" - simple type,   
* "list": [ ] - an array of acceptable values.


 ```
     {
       "orderNumber": 80,
       "name": "type",
       "caption": "Organisation type",
       "type": 0,
       "size": null,
       "decimals": 0,
       "nullable": true,
       "readonly": false,
       "indexed": false,
       "unique": false,
       "autoassigned": false,
       "defaultValue": null,
       "refClass": "",
       "itemsClass": "",
       "backRef": "",
       "backColl": "",
       "binding": "",
       "selConditions": [],
       "selSorting": [],
       "selectionProvider": {
         "type": "SIMPLE",
         "list": [
           {
             "key": "customer",
             "value": "Customer"
           },
           {
             "key": "contractor",
             "value": "Contractor"
           }
         ],
         "matrix": [],
         "parameters": [],
         "hq": ""
       },
       "indexSearch": false,
       "eagerLoading": false
     }
 ```
 ### Example 
 
 In the reference attribute, show those objects that have specified "selConditions" property in the reference class. In the `property` field of this attribute, specified in the reference class, the value in the "value" field corresponds to the "operation" condition. 
 
 The aim is to show in the attribute "Organization" only those organizations ("refClass": "organization") in which the type field ("property": "type") is equal ("operation": 0) to the customer value ("value": "customer" ).

 All conditons in the `"selConditions"` are united by "and".

 ```
     {
       "orderNumber": 120,
       "name": "customer",
       "caption": "Customer",
       "type": 13,
       "size": null,
       "decimals": 0,
       "nullable": true,
       "readonly": false,
       "indexed": false,
       "unique": false,
       "autoassigned": false,
       "defaultValue": null,
       "refClass": "organization",
       "itemsClass": "",
       "backRef": "",
       "backColl": "",
       "binding": "",
       "selConditions": [
         {
           "property": "type",
           "operation": 0,
           "value": "customer",
           "nestedConditions": []
         }
       ],
       "selSorting": [],
       "selectionProvider": null,
       "indexSearch": false,
       "eagerLoading": false
     },
     {
       "orderNumber": 130,
       "name": "contractor",
       "caption": "Contractor",
       "type": 13,
       "size": null,
       "decimals": 0,
       "nullable": true,
       "readonly": false,
       "indexed": false,
       "unique": false,
       "autoassigned": false,
       "defaultValue": null,
       "refClass": "organization",
       "itemsClass": "",
       "backRef": "",
       "backColl": "",
       "binding": "",
       "selConditions": [
         {
           "property": "type",
           "operation": 0,
           "value": "ispolnitel",
           "nestedConditions": []
         }
       ],
       "selSorting": [],
       "selectionProvider": null,
       "indexSearch": false,
       "eagerLoading": false
     }
 ```
 
### Conditions of sorting the valid values for "Data" attribute type

The core has the context attribute - `$$ now`, which returns the current date.
`$$ now` is available everywhere if you specify the conditions.

For more details see the [variables](/docs/en/2_system_description/metadata_structure/meta_variables.md).

### Example:

**Condition:** display the objects with the attribute value [dataStart] less than the current data: 

```
{
      "property": "dateStart",
      "operation": 5,
      "value": [
        "$$now"
      ],
      "nestedConditions": []
    }
```


### The next page: [Sorting a sample of valid values](/docs/en/2_system_description/metadata_structure/meta_class/atr_selsorting.md)
--------------------------------------------------------------------------  


 #### [Licence](/LICENCE.md) &ensp;  [Contact us](https://iondv.com) &ensp;  [Russian](/docs/ru/2_system_description/metadata_structure/meta_class/atr_selconditions.md)   &ensp; [FAQs](/faqs.md)   <div><img src="https://mc.iondv.com/watch/local/docs/framework" style="position:absolute; left:-9999px;" height=1 width=1 alt="iondv metrics"></div>       



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.  
All rights reserved.