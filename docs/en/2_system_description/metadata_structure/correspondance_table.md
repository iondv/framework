#### [Content](/docs/en/index.md)

# Correspondence table: attribute types to view types

| Code of attribute type | Name of attribute type  | Code of the main view type | Name of the main view type  | Desired display mode type for main view type | Acceptable view type (selectively)          |
|:------------------|:------------------------------------|:---------------------------------|:------------------------------------------|:----------------------------------------------------------------|:---------------------------------------------------|
| 0                 | String                              | 1                                | Textual                                 | -                                                               | 7 - Multiline text, 8 - Formatted text |
| 1                 | Text                                | 7                                | Multiline text                       | -                                                               | 1 - Textual, 8 - Formatted text           |
| 2                 | HTML                                | 8                                | Formatted text                     | -                                                               | 1 - Textual, 7 - Multiline text              |
| 3                 | URL                                 | 17                               | URL                                       | -                                                               | -                                                  |
| 4                 | Image                               | 13                               | Image choice                         | -                                                               | -                                                  |
| 5                 | File                                | 11                               | File choice                               | -                                                               | -                                                  |
| 6                 | Integer                               | 14                               | Integer editor                      | -                                                               | -                                                  |
| 7                 | Real                      | 15                               | Real Number Editor               | -                                                               | -                                                  |
| 8                 | Decimal                           | 15                               | Real Number Editor               | -                                                               | -                                                  |
| 9                 | Date/Time                          | 120                              | Date choice                                | -                                                               | 6 - Date-time choice                             |
| 10                | Logical                          | 4                                | Flag                                      | -                                                               | -                                                  |
| 11                | Password                              | 12                               | Password                                    | -                                                               | -                                                  |
| 12                | Global identifier            | 1                                | Textual                                 | -                                                               | -                                                  |
| 13                | Reference                              | 2                                | Reference                                    | 1 - Reference                                                      | -                                                  |
| 14                | Collection                           | 3                                | Collection                                 | 3 - Table                                                     | -                                                  |
| 15                | Multiplicity                           | 9                                | Alternative choice                      | -                                                               | 10 - Multiple choice                           |
| 16                | Structure                           | 0                                | Group                                    | -                                                               | -                                                  |
| 17                | User type                | -                                | _not fully determined, depends on the main type_ | -                                                               | -                                                  |
| 18                | User                        | 1                                | Textual                                 | -                                                               | -                                                  |
| 60                | Period                              | 60                               | Period choice                           | -                                                               | -                                                  |
| 100               | Geodata                           | 100                              | Geo object                                 | 0 - Map                                                       | -                                                  |
| 110               | File collection                    | 110                              | File set                              | -                                                               | -                                                  |

--------------------------------------------------------------------------  


 #### [Licence](/LICENSE) &ensp;  [Contact us](https://iondv.ru/index.html) &ensp;  [Russian](/docs/ru/2_system_description/metadata_structure/correspondance_table.md)   &ensp; [FAQs](/faqs.md)   <div><img src="https://mc.iondv.com/watch/local/docs/framework" style="position:absolute; left:-9999px;" height=1 width=1 alt="iondv metrics"></div>       



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.  
All rights reserved. 