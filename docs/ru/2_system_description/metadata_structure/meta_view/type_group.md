#### [Оглавление](/docs/ru/index.md)

### Назад: [Типы представлений](view_types.md)

# Тип Группа [0] 

## Описание

**Группа [0]** - структура представлений создания и изменения, которая позволяет в рамках одного класса группировать аттрибуты из других классов в представлении создания/изменения в горизонтальном и/или вертикальном виде. 

## Виды отображения типа Группа [0] 

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

--------------------------------------------------------------------------  


 #### [Licence](/LICENSE) &ensp;  [Contact us](https://iondv.com/portal/contacts) &ensp;  [English](/docs/en/2_system_description/metadata_structure/meta_view/type_group.md)   &ensp;
<div><img src="https://mc.iondv.com/watch/local/docs/framework" style="position:absolute; left:-9999px;" height=1 width=1 alt="iondv metrics"></div>         



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.   
All rights reserved. 
