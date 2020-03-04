#### [Content](/docs/en/index.md)

### The previous page: [Schema of the main types of metadata](/docs/en/2_system_description/metadata_structure/meta_scheme.md)

# Meta class - general part

## JSON
```
{
  "isStruct": false,
  "key": [
    "id"
  ],
  "semantic": "",
  "name": "class_integer",
  "abstract": true,
  "version": "",
  "caption": "Class \"Integer [6]\"",
  "ancestor": null,
  "container": null,
  "creationTracker": "",
  "changeTracker": "",
  "creatorTracker": "",
  "editorTracker": "",
  "history": 0,
  "journaling": false,  
  "compositeIndexes": null,
  "properties": [...]
}
```
### Field description

| Identifier                | Name           | Acceptable values                    |  Description                                                                                                                                                                                                 |
|:--------------------:|:-------------------------------:|:--------------------------------------:|:---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `"isStruct"`        | [**Structure**](isstruct.md)         | Logical.                            | If the value is "true" - this class is a structure and can be used in other classes in atributes of a special kind - "Structure [16]".  |
| `"key"`              | [**Key attributes**](docs/en/2_system_description/metadata_structure/meta_class/key.md)           | Array of strings, at least one value.   | Specify a key field that uniquely identifies the object in the collection.                                             |
| `"semantic"`         | [**Semantic attributes**](/docs/en/2_system_descriptionmetadata_structure/meta_class/semantic.md)       | String.                                | Sets the semantics - the rule of forming the row view for this class.                                                                                      |
| `"name"`             | **System name**               | String only the latin characters with no spaces. | Sets the first part of the name of the meta class file, the system name.                                                                                                                        |
| `"abstract"`             | [**Criteria of abstraction for class**](abstract.md)               | Logical | Used only for parent (base) classes.                                                                                                                                 |
| `"version"`          | [**Version**](metaverion.md)                      | String.                       | Allows to set the versioning of the meta to operate the data created in different meta versions in the same collection.                                   |
| `"caption"`          | **Logical name**              | String                                | The class name displayed in the UI.                                                                                                                                                    |
| `"ancestor"`         | [**Inheritance**](ancestor.md)          | Null or string.                      |  A set of attributes, created in the class is inherited by successor classes. It is a way to reduce the number of entities when it is possible to use the same set of attributes. All classes-heirs will inherit the attribute set of the parent + you can make attributes belonging individually to this class-heir (if necessary).                                                                                                                                                                                       |
| `"container"`        | **Container attribute** | Null or row.                      |Select the reference attribute that will be used to automatically build hierarchical navigation. The object to which the selected attribute will refer will be perceived by the environment as a container of the domain class instance, and automatically builds a hierarchy of objects.                                                                                                                                                                                         |
| `"creationTracker"`  | [**Time tag of created objects**](time_user_tracker.md)      | String.                                 | Allows to save data/time of the object creation, requires the presence of the corresponding class attribute, the `name` of which is entered into this field.              |
| `"changeTracker"`    | [**Time tag of committed changes**](time_user_tracker.md)     | String.                                 | Allows to save data/time of the object change, requires the presence of the corresponding class attribute, the `name` of which is entered into this field.               |
| `"creatorTracker"`  | [**Tag of the user who created the object**](time_user_tracker.md)      | String.                                 | Allows to save the name of the user who created the object, requires the presence of the corresponding class attribute, the `name` of which is entered into this field.                 |
| `"editorTracker"`    | [**Tag of the user who changed the object**](time_user_tracker.md)     | String.                                 | Allows to save the name of the user who changed the object, requires the presence of the corresponding class attribute, the `name` of which is entered into this field.              |
| `"history"`          | **Data image**               | _0 - none_                              | Stores the images of data                                                                                                                                                                               |
|                      |                                 | _1 - arbitrarily_                      |                                                                                                                                                                                                          |
|                      |                                 | _2 - up to an hour_              |                                                                                                                                                                                                          |
|                      |                                 | _3 - up to a day_             |                                                                                                                                                                                                          |
|                      |                                 | _4 - up to a week_            |                                                                                                                                                                                                          |
|                      |                                 | _5 - up to a month_            |                                                                                                                                                                                                          |
|                      |                                 | _6 - up to a year_              |                                                                                                                                                                                                          |
| `"journaling"`       | [**Journaling the changes**](journaling.md)    | Logical.                            | Enable / Disable journaling changes of the class objects.                                                                                                         |
| `"compositeIndexes"` | [**Indexation**](composite_indexes.md)                   | Null or array of objects.             | Allows you to specify the requirements for the unique combination of fields.                                                                                                       |
| `"properties"`       | [**Attributes**](meta_class_attribute.md)                    | Array of objects.                       | Array of attribute properties. Each object is described in accordance with the attribute part of the meta class.                                                                  |

### The next page: [Meta class - the attribute part](meta_class_attribute.md)
--------------------------------------------------------------------------  


 #### [Licence](/LICENSE) &ensp;  [Contact us](https://iondv.com/portal/contacts) &ensp;  [Russian](/docs/ru/2_system_description/metadata_structure/meta_class/meta_class_main.md) &ensp;
<div><img src="https://mc.iondv.com/watch/local/docs/framework" style="position:absolute; left:-9999px;" height=1 width=1 alt="iondv metrics"></div>       



--------------------------------------------------------------------------  
Copyright (c) 2018 **LLC "ION DV"**.  
All rights reserved.