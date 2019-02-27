#### [Оглавление](/docs/ru/index.md)

### Предыдущая страница: [Маски](/docs/ru/2_system_description/metadata_structure/meta_view/mask.md)

# Поля 

## Описание

**Поля** - содержат в себе атрибуты класса, объединенные, по какому-либо признаку, в группу (более подробное описание см. [Тип "Группа [0]")](/docs/ru/2_system_description/metadata_structure/meta_view/type_group.md).

**Внимание:** данное свойство применяется только для атрибута типа "Группа [0]".

### Пример 

**NB:** На форме представления, заданные атрибуты, отображаются на нижнем уровне иерархии, на верхнем находится наименование группы.

```
{
  "tabs": [
    {
      "caption": "",
      "fullFields": [
        {
          "caption": "nameGroup",
          "type": 0,
          "property": "",
          "size": 2,
          "maskName": null,
          "mask": null,
          "mode": null,
          "fields": [
            {
              "caption": "atr1",
              "type": 1,
              ...
            },
            {
              "caption": "atr2",
              "type": 1,
              ...
            }
      ]
    }
      ],
      "shortFields": []
    }
  ]
}

  
```  


### Следующая страница: [Действия](/docs/ru/2_system_description/metadata_structure/meta_view/commands.md)

--------------------------------------------------------------------------  


 #### [Licence](/LICENCE.md) &ensp;  [Contact us](https://iondv.com) &ensp;  [English](/docs/en/2_system_description/metadata_structure/meta_view/fields.md)   &ensp; [FAQs](/faqs.md)          



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.   
All rights reserved. 
