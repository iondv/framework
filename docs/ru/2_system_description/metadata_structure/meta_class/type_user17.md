#### [Оглавление](/docs/ru/index.md)

### Предыдущая страница: [Структура](type_isstruct16.md)

# Пользовательские типы

**Пользовательский тип** - `"type": 17`, задает значение пользовательского типа на основе базового типа. Находится в директории `meta`, `types` + [название типа].type.json. Используется в случаях, когда необходимо применить маску на значения определенного атрибута в различных классах.

## Допустимые базовые типы

При создании пользовательского типа доступны следующие базовые типы:

* Строка [0]
* Целое [6]
* Действительное [7]
* Дата/Время [9]
* Десятичное [8]

## Пример пользовательского типа userPassport.type.json
```
{
  "name": "userPassport",
  "caption": "Номер паспорта",
  "type": 0,
  "mask": "99 99 999999",
  "mask_name": "passport",
  "size": 12,
  "decimals": null
}
```


## Применение

Пользовательские типы подключаются путем указания типа атрибута "Пользовательский [17]" - `"type": 17` и указанием наименования пользовательского типа в поле "refClass". 

## Пользовательский тип в JSON

```
 {
      "orderNumber": 20,
      "name": "passport",
      "caption": "Номер паспорта (Пользовательский тип [17])",
      "type": 17,
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
      "defaultValue": null,
      "refClass": "userPassport",
      "itemsClass": "",
      "backRef": "",
      "backColl": "",
      "binding": "",
      "semantic": null,
      "selConditions": [],
      "selSorting": [],
      "selectionProvider": null,
      "indexSearch": false,
      "eagerLoading": false,
      "formula": null
    }
```

Таким образом, при вводе значения для атрибута `"Номер паспорта (Пользовательский тип [17])"` будет применяться маска, заданая для типа `"userPassport"` по ссылке свойства `"refClass"`. 


### Следующая страница: [Геоданные](type_geodata100.md)
--------------------------------------------------------------------------  


 #### [Licence](/LICENSE) &ensp;  [Contact us](https://iondv.com/portal/contacts) &ensp;  [English](/docs/en/2_system_description/metadata_structure/meta_class/type_user17.md)   &ensp;
<div><img src="https://mc.iondv.com/watch/local/docs/framework" style="position:absolute; left:-9999px;" height=1 width=1 alt="iondv metrics"></div>         



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.
All rights reserved. 