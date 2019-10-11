#### [Оглавление](/docs/ru/index.md)

### Предыдущая страница: [Пользовательский тип](type_user17.md)

# Геоданные

Тип атрибута **геокоординаты** - является атрибутом, который хранит координаты с уникальными представлениями для создания и редактирования. Значение свойства "type" для атрибута, имеющего тип геокоординаты равно 100.

## Описание:

Если атрибут имеет тип геокоординаты и на форме создания/редактирования объекта  атрибут заполнен (координаты заданы), то отображается поле карты с координатами и кнопка "Изменить". Если атрибут не заполнен – то отображается только кнопка "Задать координаты". _Доступно только в студии_

## Особенности работы

Если задано свойство "autoassigned": true и не заданы данные при создании формы - то нужно определять координаты автоматически по данным адреса из атрибутов указанных в свойствах геометки.
 

## Способы отображения на форме

Для отображения атрибута с типом геокоординаты используется тип представления геообъект. 
Геообъект может быть отображён на форме в одном из трёх режимов:

* **Карта (0)** - геообъект отображается на карте;
* **Поиск по адресу (1)** - геообъект отображается на карте, на которой по адресу можно найти место и переместить туда геообъект. Или же можно просто задать координаты геообъекта;
* **Холст (2)** - геообъект отображается на карте, можно задать интерактивное отображение геообъекта на карте.

Режим отображения задаётся указанием соответствующей цифры в поле `"mode"` в **мете представлений класса**: 

"mode": 0, – Режим отображения Карта

"mode": 1, – Режим отображения поиск по адресу

"mode": 2, – Режим отображения Холст

## Способы хранения в БД
Данные атрибута с типом геокоординаты сохраняются в БД в виде строки со значениями через запятую, строки в формате JSON-массива или строки в формате JSON-объекта.  

### Пример структуры атрибута в режиме Карта (0) в JSON: 
В логическом имени атрибута (`caption`) указан режим отображения (`mode`) для разделения атрибутов с одинаковым типом.
```
{
      "orderNumber": 20,
      "name": "class_geodata",
      "caption": "Геоданные [100] mode [0] - Карта",
      "type": 100,
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
      "refClass": "",
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
    },

```
### Пример структуры атрибута в режиме Поиск по адресу (1) в JSON:
```
{
      "orderNumber": 30,
      "name": "class_geodata1",
      "caption": "Геоданные [100] mode [1] - Поиск по адресу",
      "type": 100,
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
      "refClass": "",
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
    },
```
### Пример структуры атрибута в режиме Холст (2) в JSON:
```
{
      "orderNumber": 40,
      "name": "class_geodata2",
      "caption": "Геоданные [100] mode [2] - Холст",
      "type": 100,
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
      "refClass": "",
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

### Следующая страница: [Расписание](type_schedule210.md) 
--------------------------------------------------------------------------  


 #### [Licence](/LICENSE) &ensp;  [Contact us](https://iondv.com/portal/contacts) &ensp;  [English](/docs/en/2_system_description/metadata_structure/meta_class/type_geodata100.md)   &ensp;
<div><img src="https://mc.iondv.com/watch/local/docs/framework" style="position:absolute; left:-9999px;" height=1 width=1 alt="iondv metrics"></div>         



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.
All rights reserved. 