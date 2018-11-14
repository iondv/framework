#### [Оглавление](/docs/ru/index.md)

### Предыдущая страница: [Валидаторы](/docs/ru/2_system_description/metadata_structure/meta_view/validators.md)

## Настройка css полей

Настройка css полей выполняется посредством атрибута tags.

Синтаксис:

```
{
...
  tags: [
    "css-class:myCustomCssClass", // добавляем css-класс
    "css:background-color:green", // добавляем css-стиль
    "css:color:white" // добавляем css-стиль
  ]
}
```

Стили применяются к контейнеру поля - т.е. элементу содержащему label поля и контрол ввода.

### Пример:

```json
      {
          "caption": "Первый атрибут на первой вкладке",
          "type": 1,
          "property": "tab_1_1",
          "size": 2,
          "maskName": null,
          "mask": null,
          "mode": null,
          "fields": [],
          "hierarchyAttributes": null,
          "columns": [],
          "actions": null,
          "commands": [],
          "orderNumber": 10,
          "required": false,
          "visibility": null,
          "enablement": null,
          "obligation": null,
          "readonly": false,
          "selectionPaginated": true,
          "validators": null,
          "hint": null,
          "historyDisplayMode": 0,
          "tags": ["css:background-color:##AFFFAF"]
        }
```

## Настройка стартовой позиции на карте

```
**NB:** Для атрибутов типа "Геоданные"
```

На форме представления для атрибута типа "Геоданные" задаем значение вида:

```
"tags": [
   "tryfind:Хабаровск", 
   "tryfind:$address"
]
```
*Результат*: при открытии формы создания координат - автоматически определятся координаты в соответствии со значением свойства `"tags"`. Где `$address` - значение атрибута *address* из текущего класса.

### Следующая страница: [Типы атрибутов](/docs/ru/2_system_description/metadata_structure/meta_view/view_types.md)

--------------------------------------------------------------------------  


 #### [Licence](/LICENCE.md) &ensp;  [Contact us](https://iondv.com) &ensp;  [English](/docs/en/2_system_description/metadata_structure/meta_view/tags.md)   &ensp; [FAQs](/faqs.md)          



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.  
All rights reserved.