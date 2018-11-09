#### [Оглавление]()

### Предыдущая страница: []()

# Поля - особая структура представлений создания и изменения

Предполагаю, что позволяет в рамках одного класса выводит в представлении создания/изменения данные из прочих связанных классов.
Найти подробное описание в джире не удалось, потому пара ссылок:

Представление измения JSON: https://git.iondv.ru/ION-METADATA/khv-svyaz-info/blob/master/views/naselenniyPunkt/item.json  
Мета класса отображаемого в данном представлении: https://git.iondv.ru/ION-METADATA/khv-svyaz-info/blob/master/meta/naselenniyPunkt.class.json  
Отображение данного представления в приложении: https://svyaz.iondv.ru/reestr/khv-svyaz-info_naselenniyPunkt/update?id=08401000000&_version=1&imodal=1

## Тип группы - горизонтальные колонки

* GROUP_VERTICAL `"mode": 0` - поля группы располагаются друг под другом 
* GROUP_HORIZONTAL `"mode": 1` - поля группы располагаются горизонтально в строку (т. е. колонками, если хватает места) 

Формат настройки в мете представления для атрибута типа "Группа":

```json
{
   "type": 0, // группа полей
   "mode": 1, // отображаемых горизонтально
   "fields": [
       // поля
    ]
}
```

**Настройка параметров размера колонок**:

```json
{
   "type": 0, // группа верхнего уровня
   "mode": 1, // делаем колонки
   "fields": [
      {
         "type": 0, // группа-колонка рас
         "mode": 0,
         "size": 0, // ооочень узкая
         "fields": [
            {
               "property": "attr1",
               "type": 1,
               "caption": "Текстовое полюшко 1"
            },
            {
               "property": "attr2",
               "type": 1,
               "caption": "Текстовое полюшко 2"
            }
         ]
     },
      {
         "type": 0, // группа-колонка дфа
         "mode": 0,
         "size": 0,  // ооочень узкая
         "fields": [
            {
               "property": "attr3",
               "type": 1,
               "caption": "Текстовое полюшко 3"
            },
            {
               "property": "attr4",
               "type": 1,
               "caption": "Текстовое полюшко 4"
            }
         ]
     },
     {
        "type": 0, // группа-колонка три
        "mode": 0,
        "size": 3,  // широкая
        "fields": [
            {
               "property": "attr5",
               "type": 1,
               "caption": "Текстовое полюшко 5"
            },
            {
               "property": "attr6",
               "type": 1,
               "caption": "Текстовое полюшко 6"
            }
         ]
     }
   ]
}
```

[пример из ДнТ] (https://git.iondv.ru/ION-APP/develop-and-test/blob/v1.8/views/columns@develop-and-test/item.json)

### Следующая страница: []()

--------------------------------------------------------------------------  


 #### [Licence](/LICENCE.md) &ensp;  [Contact us](https://iondv.com) &ensp;  [English](/docs/en/2_system_description/metadata_structure/meta_view/mask.md)   &ensp; [FAQs](/faqs.md)          



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.  
All rights reserved. 
