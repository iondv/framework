#### [Content](/docs/en/index.md)

### The previous page: [Selection list of valid values](/docs/en/2_system_description/metadata_structure/meta_class/atr_selectionprovider.md)

# Eager loading

**Eager loading** - means that the related data, in sufficient quantities to correctly display the semantics of the related object, is loaded from the database as part of the initial query.

Eager loading helps in displaying objects of the system in cases where the data is at a high level of nesting, for example, in the attributes of the type "Reference" and "Collection".

It is used only in special cases mainly to save time resources and as an alternative to fine-tuning.

### Example: 
By using `eagerLoading` property with ` true` or `false` values, you can set the eager loading for an attribute. 

```json
"properties": [
    {
      ...
      "eagerLoading": true,
      "formula": null
    }
```


## How to configure?  

We recommend to configure the eager loading using the `deploy.json` file of the project. It is appropriate for the attributes of the meta class and meta navigation. This way of configuration allows you to centrally define pre-selected attributes for many classes.


### Example:

```json
"eagerLoading": {
          "node1": {
             "class1": {
                 "list": ["attr1", "attr2.attr3"],
                 "item": ["attr1", "attr2.attr3"]
              }
          }
        }
```

**NB.** If instead of `" node1 "` you put `" * "`, then when you hit this object from any navigation, you can use the same class setting to export the object.


## How to configure for the export?

The configuration of the eager loading for export in lists and forms coincides with the configuration in the `deploy.json` file, with only one exception. Instead of `list` and` item`, specify `exportList` and` exportItem`.

### Example:

```json
"eagerLoading": {
   "class1@ns": {
     "exportList": ["attr1", "attr2.attr3"]
   },
   "class1@ns": {
      "exportItem": ["attr1", "attr2.attr3.attr4"]
   }
}
```

## Depth of eager loading

You can specify the depth of the eager loading in the `maxEagerDepth: 1` property in the` deploy.json` file of the project.

The maximum depth of the eager loading determines the maximum permissible level of nesting of the object.

### The next page: [Computable fields](/docs/en/2_system_description/metadata_structure/meta_class/atr_formula.md)
--------------------------------------------------------------------------  


 #### [Licence](/LICENCE.md)&ensp;  [Contact us](https://iondv.ru/index.html) &ensp;  [Russian](/docs/ru/2_system_description/metadata_structure/meta_class/eager_loading.md) &ensp; [FAQs](/faqs.md)          



--------------------------------------------------------------------------
