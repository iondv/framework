#### [Content](/docs/en/index.md)

### The previous page: [Conditions of sorting the valid values](/docs/en/2_system_description/metadata_structure/meta_class/atr_selconditions.md)

# Sorting a sample of valid values

## Description

**Sorting a sample of valid values** - is a filter that specifies how to sort objects. It is used for attributes of the reference type. Set it in the `"selSorting"` field when creating the meta class. 

### Available types of sorting:

•  Sorting in ascending order

•  Sorting in descending order

### Example 
```
{
      "orderNumber": 20,
      "name": "ref",
      "caption": "Reference",
      "type": 13,
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
      "refClass": "selSortingCatalog@develop-and-test",
      "itemsClass": "",
      "backRef": "",
      "backColl": "",
      "binding": "",
      "semantic": null,
      "selConditions": [],
      "selSorting": [
        {
          "property": "string",
          "mode": 1
        }
      ],

```
## Field description

| Field         | Name   | Available values                  | Description                                            |
|:-------------|:-----------------------|:-------------------------------------|:----------------------------------------------------|
| `"property"` | **Attribute**            | String, only the Latin alphabet, with no spaces | Sorting by this attribute |
| `"mode"`     | **Sorting order** | _0 - in ascending order_                 | Sorting order                                  |
|              |                        | _1 - in descending order_                    |                                                     |

### The next page: [Selection list of valid values](/docs/en/2_system_description/metadata_structure/meta_class/atr_selectionprovider.md)
--------------------------------------------------------------------------  


 #### [Licence](/LICENCE.md) &ensp;  [Contact us](https://iondv.com) &ensp;  [Russian](/docs/ru/2_system_description/metadata_structure/meta_class/atr_selconditions.md)   &ensp; [FAQs](/faqs.md)          



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.   
All rights reserved. 