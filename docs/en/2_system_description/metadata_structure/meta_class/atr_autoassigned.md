### The previous page: [Indexation](/docs/en/2_system_description/metadata_structure/meta_class/atr_indexed.md)

# Attributes with autocomplete

## Description
Type **autocompletion** - `" autoassigned ": true` - indicates that the value of this attribute should be filled automatically when creating a class. It is used mainly for attributes of the “Unique values” type ("unique": true) for integers and string attributes, as well as for attributes of the "Date-time" type.

## How to configure?  

1. For the attributes of the "Date-time" type, an attribute should have the value of the current time. It is used in the time tag of created objects and committed changes. 
2. For integer attributes, if the "Unique value" is specified ("unique": true) when creating a form, then it is filled with a random set of characters.
3. For strings, if the "Unique value" is specified ("unique": true), then a random `hex` value should be generated - the size of the string length - in the example below 20 characters.
```
var crypto = require('crypto');
ID = crypto.randomBytes(20).toString('hex');
```
4. For the `guid` "global identifier", the configuration is similarly to the strings. 

NB. Make sure that you made a check when saving. The field should be generated automatically for empty values or a date. For all others (integer, string), previously created values should be generated.

### Example:
```
    {
      "orderNumber": 50,
      "name": "auto",
      "caption": "auto",
      "type": 6,
      "size": null,
      "decimals": 0,
      "nullable": true,
      "readonly": false,
      "indexed": false,
      "unique": true,
      "autoassigned": true
    }
```

### The next page: [Default values](/docs/en/2_system_description/metadata_structure/meta_class/atr_default_value.md)
--------------------------------------------------------------------------  


 #### [Licence](/LICENCE.md) &ensp;  [Contact us](https://iondv.com) &ensp;  [Russian](/docs/ru/2_system_description/metadata_structure/meta_class/atr_autoassigned.md)   &ensp; [FAQs](/faqs.md)          



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.  
All rights reserved. 