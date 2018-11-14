#### [Оглавление](/docs/ru/index.md)

### Предыдущая страница: [Условия отображения](/docs/ru/2_system_description/metadata_structure/meta_view/visibility.md)

# Условия активности

## Описание

**Условия активности** - задает условие активности, то есть доступности для редактирования поля в представлении.
Синтаксис условий такой же, как в [Условия отображения](/docs/ru/2_system_description/metadata_structure/meta_view/visibility.md).

### Пример в JSON:
```
{
          "caption": "Основание для условия активности",
          "type": 1,
          "property": "enablement_condition_base",
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
```

### Пример условия отображения
```
{
          "caption": "Поле активно, если основание заполнено",
          "type": 1,
          "property": "enablement_condition_use",
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
          "enablement": ".enablement_condition_base !\u003d \u0027\u0027",
          "obligation": null,
          "readonly": false,
          "selectionPaginated": true,
          "validators": null,
          "hint": null,
          "historyDisplayMode": 0,
          "tags": null
        },
        {
          "caption": "Поле активно, если в основании \u00271\u0027",
          "type": 1,
          "property": "enablement_condition_1",
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
          "enablement": ".enablement_condition_base \u003d\u003d \u00271\u0027",
          "obligation": null,
          "readonly": false,
          "selectionPaginated": true,
          "validators": null,
          "hint": null,
          "historyDisplayMode": 0,
          "tags": null
        }
```
### Следующая страница: [Условия обязательности](/docs/ru/2_system_description/metadata_structure/meta_view/obligation.md)

--------------------------------------------------------------------------  


 #### [Licence](/LICENCE.md) &ensp;  [Contact us](https://iondv.com) &ensp;  [English](/docs/en/2_system_description/metadata_structure/meta_view/enablement.md)   &ensp; [FAQs](/faqs.md)          



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.  
All rights reserved. 
