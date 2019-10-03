#### [Оглавление](/docs/ru/index.md)

### Предыдущая страница: [Условия обязательности](obligation.md)

## CSS поля

**CSS поля** - задают стили для значений атрибутов и настраиваются посредством атрибута `tags`. Аналогичная настройка задается в `"options"` с использованием шаблонов. Подробнее см. ["Опции"](options.md).

### Синтаксис:

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

### Пример для атрибутов типа "Геоданные"

```
{
              "caption": "Координаты",
              "type": 100,
              "property": "geo",
              "size": 2,
              "maskName": null,
              "mask": null,
              "mode": 0,
              "fields": [],
              "columns": [],
              "actions": null,
              "commands": null,
              "orderNumber": 34,
              "required": false,
              "visibility": null,
              "enablement": null,
              "obligation": null,
              "readonly": false,
              "selectionPaginated": true,
              "validators": null,
              "hint": "",
              "historyDisplayMode": 0,
              "tags": [
                "tryfind:Хабаровский край",
                "tryfind:$address"
              ],
              "selConditions": [],
              "selSorting": []
            },

```
*Результат*: при открытии формы создания координат - автоматически определятся координаты в соответствии со значением свойства `"tags"`. Где `$address` - значение атрибута *address* из текущего класса.

### Следующая страница: [Опции](options.md)

--------------------------------------------------------------------------  


 #### [Licence](/LICENSE) &ensp;  [Contact us](https://iondv.com/portal/contacts) &ensp;  [English](/docs/en/2_system_description/metadata_structure/meta_view/tags.md)   &ensp;
<div><img src="https://mc.iondv.com/watch/local/docs/framework" style="position:absolute; left:-9999px;" height=1 width=1 alt="iondv metrics"></div>         



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.  
All rights reserved.