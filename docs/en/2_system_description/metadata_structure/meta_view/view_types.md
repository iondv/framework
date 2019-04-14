#### [Content](/docs/ru/index.md)

### The previous page: [Meta view - attribute part](/docs/en/2_system_description/metadata_structure/meta_view/meta_view_attribute.md)

# View types

**View types** - are the following constants in the platform: 

```

module.exports = {
  GROUP: 0,
  TEXT: 1,
  REFERENCE: 2,
  COLLECTION: 3,
  CHECKBOX: 4,
  COMBO: 5,
  DATE_PICKER: 120,
  DATETIME_PICKER: 6,
  MULTILINE: 7,
  WYSIWYG: 8,
  RADIO: 9,
  MULTISELECT: 10,
  FILE: 11,
  PASSWORD: 12,
  IMAGE: 13,
  NUMBER_PICKER: 14,
  DECIMAL_EDITOR: 15,
  URL: 17,
  PERIOD_PICKER: 60,
  GEO: 100,
  ATTACHMENTS: 110,
  SCHEDULE: 210,
  CALENDAR: 220
};

```
**NB:** for more details see the [correspondance table](\docs\en\2_system_description\metadata_structure\correspondance_table.md).

| Code | Name  | Description                                                                                                                                          | 
|----:|:------------------------------------------------|:----------------------------------------------------------------------------------------------------------------------------------------------|
|   0 | [**Group**](/docs/ru/2_system_description/metadata_structure/meta_view/type_group.md)                                          | Special structure of create and edit views.                                                                                        |                                                                            |
|   1 | String                                       | View for text data. The `trim` feature is set - i.e. removing spaces from the beginning and end of the string.                                                                                                  
|   2 | [**Reference**](/docs/ru/2_system_description/metadata_structure/meta_view/type_coll_ref.md)                                          | For reference fields - the 1кN connection. Allows you to specify possible operations on objects of the class to which we refer.                          
|   3 | [**Collection**](/docs/ru/2_system_description/metadata_structure/meta_view/type_coll_ref.md)                                       | For collection fields, the Nк1 connection. Allows you to specify possible operations on objects of the class to which we refer.                                                        |                                                                            |
|   4 | Flag                                            | Checkbox for logical type.                                                                                                                                            | 
|   5 | [**Drop-down list**](/docs/ru/2_system_description/metadata_structure/meta_class/atr_selectionprovider.md)                               | For attributes with the `selectionProvider` field.                                                                                 |                                                                            |
|   7 | Multiline text                             | The view for a text. The `trim` feature is set - i.e. removing spaces from the beginning and end of the string.                                                                                                                                              
|   8 | Formatted text                           | Editor of a formatted text.                                                                                                                                        | 
|   9 | Alternative selection                            | In an attribute of the type "Multitude [15]" there can be one element of the multitude. **To be realized**                                                                   | 
|  10 | Multiple selection                             | In an attribute of the type "Multitude [15]" there can be several element of the multitude. **To be realized**                                                             | 
|  11 | File selection                                     | The view to select and upload a file.                                                                                                                               | 
|  12 | Password                                          | The idea is to hide the input data, but **to be realized**.                                                                                             | 
|  13 | Image selection                               | The view allows to select and upload the image and to display image preview.                                                          | 
|  14 | Integer editor                            | Editor for integers checks the input for correctness.                                                                                                                  | 
|  15 | Real editor                     | Editor for real numbers checks the input for correctness, requires the use of `.` sign to separate the fractional part.                                                    | 
|  17 | URL                                             | **To be realized**                                                                                                             | 
|  60 | Period selection                                   | The view allows you to keep two dates of the period.                                                                                                              | 
| 100 | [**Geodata**](/docs/ru/2_system_description/metadata_structure/meta_class/type_geodata100.md)                                       | Sets the view for the "Geodata [100]" type.                                                                                           | 
| 110 | Set of files                                    | The view to select and upload multiple files. It checks that files belong to one of the types specified in the attribute, total file size and number. |                                                               |
| 210 | [**Schedule**](/docs/ru/2_system_description/metadata_structure/meta_class/type_schedule210.md)                                      | The view for the Schedule [210] attribute type allows you to set the schedule to be displayed in a tabular form.                                                          |                                                                            |
| 220 | [**Calendar**](/docs/ru/2_system_description/metadata_structure/meta_class/type_schedule210.md)                                       | The view for the Schedule [210] attribute type allows you to set the calendar to be displayed in a calendar form.                                                           |                                                                            |

### The next page: [Meta navigation](/docs/en/2_system_description/metadata_structure/meta_navigation/meta_navigation.md)

--------------------------------------------------------------------------  


 #### [Licence](/LICENSE) &ensp;  [Contact us](https://iondv.com) &ensp;  [English](/docs/en/2_system_description/metadata_structure/meta_view/view_types.md)   &ensp; [FAQs](/faqs.md)   <div><img src="https://mc.iondv.com/watch/local/docs/framework" style="position:absolute; left:-9999px;" height=1 width=1 alt="iondv metrics"></div>       



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.  
All rights reserved. 