# Пользовательские типы

`"type": 17` - пользовательский тип

Пользовательские типы находятся /meta/types/[название типа].type.json

## Допустимые основные типы

При создании пользовательского типа доступны следующие простые типы:

* Строка [0]
* Целое [6]
* Действительное [7]
* Дата/Время [9]
* Десятичное [8]

## JSON пользовательского типа user_passport.type.json
```
{
  "name": "user_passport",
  "caption": "Номер паспорта",
  "type": 0,
  "mask": "99 99 999999",
  "mask_name": "passport",
  "size": 12,
  "decimals": null
}
```

Файл в мете D&T: https://git.iondv.ru/ION-APP/develop-and-test/blob/raw/meta/types/user_passport.type.json

## Использование

Пользовательские типы подключаются путем указания типа атрибута "Пользовательский [17]" - `"type": 17` и указанием наименования пользовательского типа в поле "refClass".

## JSON атрибута пользовательского типа

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
      "refClass": "user_passport",
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

Класс с атрибутом пользовательского типа в мете D&T: https://git.iondv.ru/ION-APP/develop-and-test/blob/raw/meta/class_custom.class.json

Объекты класса в мете D&T: http://raw.dnt.local/registry/develop-and-test@class_custom

## Проблемы и задачи по типу:

https://ion-dv.atlassian.net/browse/MODREGISTR-74  
https://ion-dv.atlassian.net/browse/IONSTUDIO-104

### Следующая страница []()
--------------------------------------------------------------------------  


 #### [Licence](/LICENCE.md) &ensp;  [Contact us](https://iondv.com) &ensp;  [English](/README.md)   &ensp; [FAQs](/faqs.md)          



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.
All rights reserved. 