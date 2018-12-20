#### [Content](/docs/en/index.md)

### The previous page: [Autocompletion](/docs/en/2_system_description/metadata_structure/meta_class/atr_autoassigned.md)

# Default value

**Default value** - is set to display the value in the attribute field automatically when opening the form for creating an object. The default value is set by assigning the value `default` to the ` "defaultValue" ` property. It is mainly used for selection list of valid values.

### Example

```
{
      "orderNumber": 20,
      "name": "defaultValue",
      "caption": "Field value",
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
      "defaultValue": "default",
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
            "key": "default",
            "value": "The value that is displayed by default when creating an object"
          },
          {
            "key": "other",
            "value": "Other value"
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

Use the `max` operation to implement **automatic calculation of the default value**:

```
"defaultValue": {max: ["className@namespace", "attr", {"filterAttr": "filterValue"}]}
```


Use the `get` operation to implement **default value for the "Link" attribute type**  in the following ways:

```
get(className) // return the id of a randomly selected class object
get(className, id) // check the presence of the object in the DB, if the object exists, return it id
get(className, attr1, val1, attr2, val2, ...) // return the id of the first object that matches the search: attr1=val1 and attr2=val2 and etc.
```

### The next page: [Attribute "Reference"](/docs/en/2_system_description/metadata_structure/meta_class/atr_ref_backref.md)
--------------------------------------------------------------------------  


 #### [Licence](/LICENCE.md)&ensp;  [Contact us](https://iondv.ru/index.html) &ensp;  [Russian](/docs/ru/2_system_description/metadata_structure/meta_class/atr_default_value.md) &ensp; [FAQs](/faqs.md)          



-------------------------------------------------------------------------- 