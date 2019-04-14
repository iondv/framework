#### [Content](/docs/en/index.md)

### The previous page: [Structure](/docs/en/2_system_description/metadata_structure/meta_class/type_isstruct16.md)

# User types

**User type** - `"type": 17`, sets a user type value based on the base type. It is located in the `meta` directory, `types` directory + `[type name].type.json`.  

Use it when you need to apply a mask on the values of a particular attribute in different classes. 

## Acceptable base types 
There are five base types to create the user type:

* String [0]
* Integer [6]
* Real [7]
* Date/Time [9]
* Decimal [8]

## Example of the user type - userPassport.type.json
```
{
  "name": "userPassport",
  "caption": "Passport ID",
  "type": 0,
  "mask": "99 99 999999",
  "mask_name": "passport",
  "size": 12,
  "decimals": null
}
```

## How to use?

Custom types are connected by specifying the attribute type - "User type [17]" - __`" type ": 17`__ and specifying the name of the user type in the "refClass" field.

## User type [17] in JSON

```
 {
      "orderNumber": 20,
      "name": "passport",
      "caption": "Passport ID (User type [17])",
      "type": 17,
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
      "refClass": "userPassport",
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
    }
```

Therefore, when you enter a value for the `"Passport Number (User Type [17])"` attribute, the mask specified for the `"userPassport"`  type will be applied by the reference of the `"refClass"` property.

### The next page: [Geodata](/docs/en/2_system_description/metadata_structure/meta_class/type_geodata100.md)
--------------------------------------------------------------------------  


 #### [Licence](/LICENCE.md) &ensp;  [Contact us](https://iondv.com) &ensp;  [Russian](/docs/ru/2_system_description/metadata_structure/meta_class/type_user17.md)   &ensp; [FAQs](/faqs.md)   <div><img src="https://mc.iondv.com/watch/local/docs/framework" style="position:absolute; left:-9999px;" height=1 width=1 alt="iondv metrics"></div>       



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.   
All rights reserved. 