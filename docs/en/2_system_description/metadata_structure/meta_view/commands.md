#### [Content]()

### The previous page: []()

# Commands

**Commands** - are available operations that can be executed on a class object.

## JSON
```
{
      "id": "SAVE",
      "caption": "Save",
      "visibilityCondition": null,
      "enableCondition": null,
      "needSelectedItem": false,
      "signBefore": false,
      "signAfter": false,
      "isBulk": false
    }
```
## Field description

| Field                    | Name                                | Acceptable values                                            | Description                                                                                                                                                     |
|:------------------------|:----------------------------------------------------|:--------------------------------------------------------------|:-------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `"id"`                  | **Code**                                             | _"CREATE" - crate object/object of reference field_            | Internal code for the object operations.                                                                                                                          |
|                         |                                                     |_"EDIT" - edit object/reference object of the reference field_ |                                                                                                                                                              |
|                         |                                                     | _"DELETE" - delete object_                                   |                                                                                                                                                              |
|                         |                                                     |_"CREATE-INLINE" - create object (not in the create mode)_                 | Create object without opening the create form
|                         |                                                 | _"SAVEANDCLOSE" - save changes and close_         |                                                                                                                                                              |
|                         |                                                     | _"SAVE" - save changes_                                |                                                                                                                                                              |
|                         |                                                     | _"REMOVE" - delete the reference to the reference object_             |                                                                                                                                                              |
|                         |                                                     |_"ADD" - add the reference to the reference object_               |                                                                                                                                                              |
| `"caption"`             | **Name**                                             | String                                                        | Visible name - the signature on the action button (if available).                                                                                             |
| `"visibilityCondition"` | **View conditions**                               | String or null                                               | The condition under which the action button will be available.                                                                                                       |
| `"enableCondition"`     | **Action condition**                              | String or null                                               | The condition under which the action button will be not available.                                                                                                          |
| `"needSelectedItem"`    | **Visibility condition - need selected item** | Boolean                                                        | The field is se to `true` for commands that require the selected item to activate it.                                                        |
| `"signBefore"`          | **Digital signature of incoming data**                              | Boolean                                                       |                                                                                                                                                              |
| `"signAfter"`           | **Digital signature of outgoing data**                             | Boolean                                                       |                                                                                                                                                              |
| `"isBulk"`              | **Batch**                                       | Boolean                                                       | Sign of a batch operation, for the commands of reference fields. It is set to `true` for commands that are executed with all reference objects at the same time. |

## How it works with reference objects?

The `"Select"` operation - sets the connection between objects, regardless of the type of connection, it should be possible to set (and break) it at the level of business logic.

1. If this is a one-to-many reference connection, that is, a reference to a key — then taking the "one" side for A, the "many" side for B, we implement:
   * on the side of the B object  (reference to A): the `" SELECT "` operation - find the object (A), set the value of the reference attribute of the B object to the key of the A object (reset the attribute to break the connection);
   * on the side of the A object (collection or back reference): the `" ADD "` operation - find the object (B), set the value of the reference attribute of this object (B) to the key of the object A, the `" REMOVE "` operation - select the object (B) in the collection, reset the reference to A.
   
2. If this is a many-to-many reference connection, that is, a link to a non-key attribute, then for both ends of the collection we implement:
   * The `"ADD"` operation - find an object, set the value of its reference to the corresponding attribute of the container. The object will be in the collections of all containers with the corresponding attribute value, this is the specificity of this type of connections)
   * The `"REMOVE"` operation - select an object in the collection, reset the link, and the object is also removed from the collections of all containers with the corresponding attribute value.
   
3. If this is a many-to-many connection without a reference (communication through a system intermediate entity, this includes both "direct" and "back" collections, as different ends of connection), then for both collections we implement:
   * The `"ADD"` operation - find an object and create the the connection with a container - the object is displayed only in the collection of this container  
   * The `"REMOVE"` operation - select an object in the collection, delete the connection with a container - the object disappears only from the collection of this container  

From the viewpoint of UI there are no differences between the types of connections at all - everywhere we deal with collections, and the `ADD` and` REMOVE` operations are available everywhere. And it is possible to customize the certain buttons at the collection field at the level of the view mode. In business logic, standard handlers for the `ADD` and` REMOVE` buttons should be implemented in accordance with the logic described above.

## How it works with class objects?

The `"commands"` field, specified in the general part of the meta view, set the list of commands, acceptable on objects of that class.
In the general part of the meta view of the class there can be listed the commands of the following `"id"`: 

1. `"CREATE"` - create object
2. `"EDIT"` - edit object 
3. `"DELETE"` - delete object
4. `"SAVEANDCLOSE"` - save changes and close  
5. `"SAVE"` - save changes

#### Use the following commands for the attribute with `"type":2`: 

1. `"SELECT"` - add
2. `"EDIT"` - edit
3. `"REMOVE"` - delete

## MongoDB (registry)
```
        {
            "id" : "SAVE",
            "caption" : "Save",
            "visibilityCondition" : null,
            "enableCondition" : null,
            "needSelectedItem" : false,
            "signBefore" : false,
            "signAfter" : false,
            "isBulk" : false
        }
```

### The next page: []()

--------------------------------------------------------------------------  


 #### [Licence](/LICENCE.md) &ensp;  [Contact us](https://iondv.com) &ensp;  [Russian](/docs/ru/2_system_description/metadata_structure/meta_view/commands.md)   &ensp; [FAQs](/faqs.md)          



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.  
All rights reserved. 
