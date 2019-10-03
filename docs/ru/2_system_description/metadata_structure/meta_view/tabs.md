#### [Оглавление](/docs/ru/index.md)

### Назад: [Мета представлений - общая часть]((/docs/en/2_system_description/metadata_structure/meta_view/meta_view_main.md))

# Вкладки

**Вкладки** - задаются в представлении создания и редактирования и используются для разбиения атрибутов класса по отдельным вкладкам на форме.

## Структура:

```json
{
  "tabs": [
    {
       "caption": "1",
          "fullFields": [],
          "shortFields": []
    },
    {
       "caption": "2",
          "fullFields": [],
          "shortFields": []
    }
  ]
}
```

где, `caption` - наименование вкладки и `fullFields` - атрибуты на вкладке

### Пример
```
{
  "tabs": [
    {
      "caption": "Первая вкладка",
      "fullFields": [
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
          "tags": ["css:background-color:#AFFFAF"]
        },
        {
          "caption": "Второй атрибут на первой вкладке",
          "type": 1,
          "property": "tab_1_2",
          "size": 2,
          "maskName": null,
          "mask": null,
          "mode": null,
          "fields": [],
          "hierarchyAttributes": null,
          "columns": [],
          "actions": null,
          "commands": [],
          "orderNumber": 20,
          "required": false,
          "visibility": null,
          "enablement": null,
          "obligation": null,
          "readonly": false,
          "selectionPaginated": true,
          "validators": null,
          "hint": null,
          "historyDisplayMode": 0,
          "tags": null
        }
      ],

```
--------------------------------------------------------------------------  


 #### [Licence](/LICENSE) &ensp;  [Contact us](https://iondv.com/portal/contacts) &ensp;  [English](/docs/en/2_system_description/metadata_structure/meta_view/meta_view_main.md)   &ensp;
<div><img src="https://mc.iondv.com/watch/local/docs/framework" style="position:absolute; left:-9999px;" height=1 width=1 alt="iondv metrics"></div>         



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.   
All rights reserved. 