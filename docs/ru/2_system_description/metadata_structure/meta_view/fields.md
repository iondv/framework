#### [Оглавление](/docs/ru/index.md)

### Предыдущая страница: [Маски](/docs/ru/2_system_description/metadata_structure/meta_view/mask.md)

# Поля 

## Описание

**Поля** - особая структура представлений создания и изменения, которая позволяет в рамках одного класса выводить в представлении создания/изменения данные из других связанных классов в горизонтальном и/или вертикальном виде. 

## Тип группы 

* GROUP_VERTICAL `"mode": 0` - поля группы располагаются друг под другом 
* GROUP_HORIZONTAL `"mode": 1` - поля группы располагаются горизонтально в строку (т. е. колонками, если хватает места) 

### Формат настройки в мете представления для типа "Группа"

```json
{
   "type": 0, // группа полей
   "mode": 1, // отображается горизонтально
   "fields": [
       // поля
    ]
}
```

### Настройка параметров размера колонок:

```json
{
   "type": 0, // группа верхнего уровня
   "mode": 1, // колонки
   "fields": [
      {
         "type": 0, // группа-колонка 1
         "mode": 0,
         "size": 0, // очень узкая
         "fields": [
            {
               "property": "attr1",
               "type": 1,
               "caption": "Текстовое поле 1"
            },
            {
               "property": "attr2",
               "type": 1,
               "caption": "Текстовое поле 2"
            }
         ]
     },
      {
         "type": 0, // группа-колонка 2
         "mode": 0,
         "size": 0,  // очень узкая
         "fields": [
            {
               "property": "attr3",
               "type": 1,
               "caption": "Текстовое поле 3"
            },
            {
               "property": "attr4",
               "type": 1,
               "caption": "Текстовое поле 4"
            }
         ]
     },
     {
        "type": 0, // группа-колонка 3
        "mode": 0,
        "size": 3,  // широкая
        "fields": [
            {
               "property": "attr5",
               "type": 1,
               "caption": "Текстовое поле 5"
            },
            {
               "property": "attr6",
               "type": 1,
               "caption": "Текстовое поле 6"
            }
         ]
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
