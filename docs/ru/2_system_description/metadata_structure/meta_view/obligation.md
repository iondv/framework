#### [Оглавление](/docs/ru/index.md)

### Предыдущая страница: [Условия активности](enablement.md)

# Условия обязательности

## Описание

**Условия обязательности** - задают условие обязательности заполнения поля в представлении.
Синтаксис условий такой же, как в [условиях отображения](visibility.md).

Условия обязательности отличаются выполнением действий. При данном условии атрибут становится обязательным для заполнения, иначе атрибут остается таким же, каким был задан в представлении до применения условия обязательности.

### Пример в JSON:
 ```
 {
          "caption": "Основание для условия обязательности",
          "type": 1,
          "property": "obligation_condition_base",
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
        },
{
          "caption": "Поле обязательно, если основание заполнено",
          "type": 1,
          "property": "obligation_condition_use",
          "size": 2,
          "maskName": null,
          "mask": null,
          "mode": null,
          "fields": [],
          "hierarchyAttributes": null,
          "columns": [],
          "actions": null,
          "commands": [],
          "orderNumber": 30,
          "required": false,
          "visibility": null,
          "enablement": null,
          "obligation": ".obligation_condition_base !\u003d \u0027\u0027",
          "readonly": false,
          "selectionPaginated": true,
          "validators": null,
          "hint": null,
          "historyDisplayMode": 0,
          "tags": null
        },
        {
          "caption": "Поле обязательно, если в основании \u00271\u0027",
          "type": 1,
          "property": "obligation_condition_1",
          "size": 2,
          "maskName": null,
          "mask": null,
          "mode": null,
          "fields": [],
          "hierarchyAttributes": null,
          "columns": [],
          "actions": null,
          "commands": [],
          "orderNumber": 40,
          "required": false,
          "visibility": null,
          "enablement": null,
          "obligation": ".obligation_condition_base \u003d\u003d \u00271\u0027",
          "readonly": false,
          "selectionPaginated": true,
          "validators": null,
          "hint": null,
          "historyDisplayMode": 0,
          "tags": null
        }

```
### Следующая страница: [Теги](tags.md)

--------------------------------------------------------------------------  


 #### [Licence](/LICENSE) &ensp;  [Contact us](https://iondv.com/portal/contacts) &ensp;  [English](/docs/en/2_system_description/metadata_structure/meta_view/obligation.md)   &ensp;
<div><img src="https://mc.iondv.com/watch/local/docs/framework" style="position:absolute; left:-9999px;" height=1 width=1 alt="iondv metrics"></div>         



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.  
All rights reserved. 