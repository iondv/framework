### The previous page: [Key attribute](/docs/en/2_system_description/metadata_structure/meta_class/key.md)
# Semantics
 
**Semantics** - used to output a class object as one string of the class title.

The `"semantics"` field is used twice in the meta class:

1. in the general part of the meta class, where it forms a string view for this class;
2. in the attribute part of the meta class, where it forms a string view of the objects of the class to which the attribute refers, i.e. used for reference attributes.

## Purpose of use

"Semantics" is used to adjust the display of attributes and attribute properties in the list. In attributes that display tabular data, semantics are used to limit the output of columns.

## Examples in reference attributes

For example, there is a class `class`, which has attributes:` id`, `name`,` link`, `date`. There is a second class `classTable`, which has a reference attribute` table` on the class `class`.
Without using the semantics in objects of the `classTable` class, in the `table` attribute only the values of identifiers of objects of the `class` class will be desplayed. 

Attributes used as identifiers are listed in the `class` meta class.

To display the values of the `name` and` link` attributes in the `table` attribute, and not the values of identifiers, you need to write `"semantic": "name|link"`. Depending on the type of attribute, the result will be different:

* if the `table` attribute is a reference, then the values of the `name` and `link` attributes separated by spaces will be filled in.
Here you can use additional words and expressions using the `|` sign, for example `" semantic ":" name|, |link"` or `"semantic":"The object has 2 attributes:|name|, |link"`;
* If the `table` attribute is a collection of objects of the `class` class, then it will display the `name` and` link` columns.

## How to configure? 

* You can limit the output using: `[]`. 
```
 "name[0,50]|..."
```
   We specify the position and the number of output letters from the semantics of the attribute. From the name attribute we derive 50 characters of semantics (attribute value), starting with the first one.
   
* Available dereferencing through `.`, that is access to the nested object.
```
"semantic": "digitalTV|kachestvoCTB|analogTV.name|kachestvoAnal|period"
```
   where `analogTV` is the reference attribute of the class for which the semantics is specified, and` name` is the class reference attribute.
* The expression for the semantics can be set by the formula, as calculated default values, and there call the data formatting functions.  
    
```
  concat(datetime(created),' ',name,'_file_') //  - as a result "12.03.16 00:55 Yuri_file_"
  concat(date(created),' ',name,'_file_') //  - as a result "12.03.16 Yuri_file_"
  concat(time(created),' ',name,'_file_') //  - as a result "00:55 Yuri_file_"
```

* Setting semantics with wrapping objects to a new line: available by adding the `<br>` tag at the end of semantics.

## Display semantics on form

1. In the lists of the first level (opened directly by the navigation node), only the value from the "caption" field of the navigation string is displayed as a title.

2. In the selection lists we display only the value from the "caption" field of th class of the list objects as a title.

3. In the edit form we display only the semantics of the object as a title.

4. In the creation form we display only the value from the "caption" field of the class as a title.

5. In the selection lists we display the line in fine print "Selecting the value of the attribute <...> of the object <...>" above the title.

6. In the creation form, if an object is created in a collection or a reference, we display the line in fine print "Creating an object in the collection/by reference <...> object <...>" above the title. 

### The next page: [Criteria of abstraction for class](/docs/en/2_system_description/metadata_structure/meta_class/abstract.md)
--------------------------------------------------------------------------  


 #### [Licence](/LICENCE.md) &ensp;  [Contact us](https://iondv.ru/index.html) &ensp;  [Russian](/docs/ru/2_system_descriptionmetadata_structure/meta_class/semantic.md) &ensp; [FAQs](/faqs.md)          



--------------------------------------------------------------------------  


Copyright (c) 2018 **LLC "ION DV"**.  
All rights reserved.    