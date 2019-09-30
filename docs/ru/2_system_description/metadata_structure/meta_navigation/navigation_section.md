#### [Оглавление](/docs/ru/index.md)

### Предыдущая страница: [Мета навигации](meta_navigation.md)

# Мета секций навигации

### JSON
```
{
  "caption": "Простые типы",
  "name": "simpleTypes",
  "mode": 0,
  "tags": null
}

```
## Описание полей

## Описание полей

| Поле            | Наименование  | Допустимые значения           | Описание 
|:----------------|:----------------------|:------------------------------|:-----------
|`"caption"`      | **Логическое имя**    | Строка                        | Наименование секции навигации отображаемое в интерфейсе.                    
| `"name"`        | **Системное имя**     | Строка латиницей, без пробелов| Задает в том числе первую часть имени файла меты секции навигации, служебное имя.  
| `"mode"`        | **Режим отображения** | _Меню: 0_                     | Задает режим отображения меню.   
|                 |                       | _Содержание: 1_               |                                  
|                 |                       | _Ниспадающий список: 2_       |                                  
|                 |                       | _Иерархия: 3_                 |                                  
| `"tags"`        | **Теги**              | Массив строк либо null.       | Теги. Могут определять дополнительные свойства секции, влиять на отображение. Не реализовано.   

## Структура в mongoDB (registry)

```
{
    "_id" : ObjectId("578f07aa0ce0024ce143e720"),
    "caption" : "Простые типы",
    "name" : "simpleTypes",
    "mode" : 0,
    "tags" : null,
    "itemType" : "section",
    "namespace" : ""
}
```

### Следующая страница: [Мета узлов навигации](navigation_nodes.md)

--------------------------------------------------------------------------  


 #### [Licence](/LICENSE) &ensp;  [Contact us](https://iondv.com/portal/contacts) &ensp;  [English](/docs/en/2_system_description/metadata_structure/meta_navigation/navigation_section.md)   &ensp;
<div><img src="https://mc.iondv.com/watch/local/docs/framework" style="position:absolute; left:-9999px;" height=1 width=1 alt="iondv metrics"></div>         



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.  
All rights reserved. 