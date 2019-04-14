#### [Content](/docs/en/index.md)

### The previous page: [Meta class - attribute part](/docs/en/2_system_description/metadata_structure/meta_class/meta_class_attribute.md)

# Attribute types

**Attribute type** - indicates the type of data supported by the attribute, such as the size of valid values and others.



| Identifier | Name    | Type in DB | Description                                                                                                                                                                                                                                                                                                     |                                       |
|:----|:-------------------------|:---------|:--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|:---------------------------------------------------------------------------|
| 0   | String                   | String   | A data type whose value is an arbitrary sequence (string) of the alphabet characters. Each variable of this type (string variable) can be represented by a fixed number of characters.                                                                                         
| 1   | Text                    | String   | Stores text data.                                                                                                                                                                                                                                                                                      
| 2   | HTML                     | String   | Formatted text containing hypertext markup with the ability to edit, inclusive of the possible outlines.                                                                                                                                                                                                                            
| 3   | URL                      | String   | Stores the reference, allows to save any string.                                                                                                                                                                                                                                                             |
| 4   | Image              | String   | Image stored in file storage with preview in views.                                                                                                                                                              
| 5   | File                     | String   | File stored in file storage.                                                                                                                                                                                                                                     
| 6   | Integer                    | Int32    | Whole number.                                                                                                                                                                                                                                                                                                  
| 7   | Real number           | Double   | Any positive number, negative number, or zero.       
| 9   | [**Date/time**](/docs/en/2_system_description/metadata_structure/meta_class/type_datetime9.md)       | Date     | Date in ISODate format. It can be displayed as a date, or as a date-time.                                                                                                                                                                                                                                                              |
| 8   |  Decimal               | Double   | Number in the decimal numeric. The alphabet of this number system consists of 10 digits from zero to 9, hence the name is decimal.
| 10  | Logical               | Boolean  | Accepts two possible values - true or false.                                                                                                                                                                                                                                  
| 11  | Password                   | String   | Password hash.                                                                                                                                                                                                                                                                                                         |
| 12  | Global identifier  | String   | A type intended for a class key field. Involves exhibiting unique and autocomplete attributes.
| 13  | [**Reference**](/docs/en/2_system_description/metadata_structure/meta_class/type_reference13.md)                   | String   | A data type that stores a reference to objects of another class.                                                                                                                                                                                                             
| 14  | [**Collection**](/docs/en/2_system_description/metadata_structure/meta_class/type_collection14.md)                | Array    | A collection is a data type that stores references to other objects. Each link contains the value of the object identifier defined in the meta class. Links should be separated by commas. All values of the sequence of links and commas is stored in the database in the form of a string.                                                                          |
| 15  | Multiplicity               | String   | Stores a set of discrete values from a predefined selection list.                                                                                                                                                                                                                   |
| 16  | [**Structure**](/docs/en/2_system_description/metadata_structure/meta_class/type_isstruct16.md)                | String   | A data type that stores a reference to a class-structure object.                                                                                                                                                                                                                |                                                                            
| 17  | [**User type**](/docs/en/2_system_description/metadata_structure/meta_class/type_user17.md)     | String   | Provides the ability to define uset types based on primitive types.                                                                                                                                                                                            |                                                                           
| 18  | User             | String   | Stores the username, for security settings, in the format _name@local_.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 100 | [**Geodata**](/docs/en/2_system_description/metadata_structure/meta_class/type_geodata100.md)                | Object   | A special data type that stores coordinates with unique views for creating and editing.                                                                                                                                                                                      
| 110 | File collection         | String   | Attribute type to store up to 5 files, with overall size limitations and the ability to specify valid file extensions.                                                                                                                                                                               
| 210 | [**Schedule**](/docs/en/2_system_description/metadata_structure/meta_class/type_schedule210.md)               | Array    | Data type for storing data in the form of calendar/schedule.                                                                                                                                                                                                                                           |                                                                            

### Attribute type identifiers:
```
module.exports = {
  STRING: 0,
  TEXT: 1,
  HTML: 2,
  URL: 3,
  IMAGE: 4,
  FILE: 5,
  INT: 6,
  REAL: 7,
  DECIMAL: 8,
  DATETIME: 9,
  BOOLEAN: 10,
  PASSWORD: 11,
  GUID: 12,
  REFERENCE: 13,
  COLLECTION: 14,
  SET: 15,
  STRUCT: 16,
  CUSTOM: 17,
  USER: 18,
  PERIOD: 60,
  GEO: 100,
  FILE_LIST: 110,
  SCHEDULE: 210
};
```
### The next page: [Meta view](/docs/en/2_system_description/metadata_structure/meta_view/meta_view_main.md)
--------------------------------------------------------------------------  


 #### [Licence](/LICENSE) &ensp;  [Contact us](https://iondv.com) &ensp;  [Russian](/docs/ru/2_system_description/metadata_structure/meta_class/property_types.md)   &ensp; [FAQs](/faqs.md)   <div><img src="https://mc.iondv.com/watch/local/docs/framework" style="position:absolute; left:-9999px;" height=1 width=1 alt="iondv metrics"></div>       



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.   
All rights reserved. 
