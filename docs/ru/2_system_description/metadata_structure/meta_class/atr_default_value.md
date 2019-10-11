#### [Оглавление](/docs/ru/index.md)

### Предыдущая страница: [Автозаполнение](atr_autoassigned.md)

# Значение по умолчанию 

**Значение по умолчанию** задается при необходимости вывода значения в поле атрибута автоматически при открытии формы создания объекта. Значение по умолчанию задается присвоением значения `default` для свойства `"defaultValue"`. Основное применение для списков выбора допустимых значений.

### Пример:

```
{
      "orderNumber": 20,
      "name": "defaultValue",
      "caption": "Значение поля",
      "type": 0,
      "size": null,
      "decimals": 0,
      "allowedFileTypes": null,
      "maxFileCount": 0,
      "nullable": true,
      "readonly": false,
      "indexed": false,
      "unique": false,
      "autoassigned": false,
      "hint": null,
      "defaultValue": "default",
      "refClass": "",
      "itemsClass": "",
      "backRef": "",
      "backColl": "",
      "binding": "",
      "semantic": null,
      "selConditions": [],
      "selSorting": [],
      "selectionProvider": {
        "type": "SIMPLE",
        "list": [
          {
            "key": "default",
            "value": "Значение, которое отображается по умолчанию при создании объекта"
          },
          {
            "key": "other",
            "value": "Другое значение"
          }
        ],
        "matrix": [],
        "parameters": [],
        "hq": ""
      },
      "indexSearch": false,
      "eagerLoading": false,
      "formula": null
    }

```

Для реализации **автоматического расчета значения по умолчанию**, можно использовать функцию `max`:

```
"defaultValue": {max: ["className@namespace", "attr", {"filterAttr": "filterValue"}]}
```


**Значение по умолчанию для атрибута типа "Ссылка"** задается  с помощью операции `get` следующими способами:

```
get(className) // возвращаем id случайно выбранного объекта класса
get(className, id) // проверяем наличие объекта в БД, если объект есть, возвращаем его id
get(className, attr1, val1, attr2, val2, ...) // возвращаем id первого объекта удовлетворяющего критериям поиска: attr1=val1 и attr2=val2 и т.д.
```

### Следующая страница: [Аттрибут "Ссылка"](atr_ref_backref.md)
--------------------------------------------------------------------------  


 #### [Licence](/LICENSE)&ensp;  [Contact us](https://iondv.com/portal/contacts) &ensp;  [English](atr_default_value.md) &ensp;
<div><img src="https://mc.iondv.com/watch/local/docs/framework" style="position:absolute; left:-9999px;" height=1 width=1 alt="iondv metrics"></div>         



-------------------------------------------------------------------------- 
Copyright (c) 2018 **LLC "ION DV"**.  
All rights reserved. 