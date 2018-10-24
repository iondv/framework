### Предыдущая страница: [Версионирование](/docs/ru/2_system_description/metadata_structure/meta_class/metaversion.md)
# Наследование

**Наследование** - позволяет создать новый класс на основе уже существующего (родительского), при этом атрибуты родительского класса заимствуются новым классом. Родительский класс может иметь несколько наследников с различным атрибутивным составом. Каждый наследник может включать в себя свой (индивидуальный) состав атрибутов + атрибуты родительского класса.

## Атрибутивный состав

В мете родительского класса атрибутивный состав формируется таким образом, чтобы каждый из них можно было использовать для какого-либо из классов наследников. В то время как в мете класса наследника атрибутивный состав для каждого свой и применяется только на класс, в котором находится.

### Пример:

*Родительский класс* :

```
{
  "isStruct": false,
  "key": [
    "id"
  ],
  "semantic": "name",
  "name": "organization",
  "version": "",
  "caption": "Организация",
  "ancestor": null,
  "container": null,
  "creationTracker": "",
  "changeTracker": "",
  "history": 0,
  "journaling": true,
  "compositeIndexes": [],
  "properties": [
```
*Класс наследник* :
```
{
  "isStruct": false,
  "key": [
    "id"
  ],
  "semantic": "",
  "name": "medicalOrg",
  "version": "",
  "caption": "Медицинская организация",
  "ancestor": "organization",
  "container": null,
  "creationTracker": "",
  "changeTracker": "",
  "history": 0,
  "journaling": true,
  "compositeIndexes": [],
  "properties": [

```

`"id"` - храниться в родительском классе и является уникальным идентификатором для всех его наследников.

`"name"` - в классе есть атрибут "Наименование", который может отображаться в любом из наследников, или в одном из них (если задать его в мете представления класса наследника).

*Представление класса* :

Если для родительского класса задан [признак абстрактности](/docs/ru/2_system_description/metadata_structure/meta_class/abstract.md), то представление для него задавать не обязательно.

Представления класса задается для каждого наследника по отдельности, с указанием необходимого атрибутивного состава (из класса, для которого создается + необходимые из родительского класса).

## Настройка списка классов наследников для создания объектов по ссылке


Задается в мете класса для атрибута типа `"Ссылка"`/`"Коллекция"` после указания ссылочного класса/класса коллекции: 

```
"itemsClass": "event",
"allowedSubclasses": [
        "Subclasses1",
        "Subclasses2"
      ],

```

`itemsClass` - коллекция на базовый класс `[event]`

`Subclasses1` - дочерний класс базого класса `[event]`, который будет отображаться в списке, при создании объекта по ссылке (далее перечисляем все дочерние классы, которые нужно отображать в списке).

> NB. Если данная настройка не задана - при создании, в списке отображаются все дочерние классы.

### Условия для применения настройки: 

* Тип атрибута "Коллекция" или "Ссылка".
* Для атрибута типа "Коллекция", "Ссылка" указан класс ссылки/коллекции на родительский (базовый) класс (при создании объекта ссылочного класса выводиться окно выбора нескольких классов)  .
* Помимо [скрытия базового класса](/docs/ru/2_system_description/metadata_structure/meta_class/abstract.md), при создании объекта не нужно отображать все дочерние классы в списке выбора классов для создания объекта по ссылке.

### Пример

Родительский класс [Мероприятия] имеет несколько классов наследников ([Мероприятие1], [Мероприятие3], [Мероприятие2]). В классе [Проект] есть атрибут типа "Коллекция", который ссылается на родительский класс [Мероприятие] :

```
{
    "namespace": "ns",
    "isStruct": false,
    "key": [],
    "semantic": "",
    "name": "project",
    "version": "",
    "caption": "Проект",
    "ancestor": "",
    "container": null,
    "creationTracker": "",
    "changeTracker": "",
    "creatorTracker": "",
    "editorTracker": "",
    "history": 0,
    "journaling": true,
    "compositeIndexes": [],
    "properties": [
      {
        "orderNumber": 80,
        "name": "event",
        "caption": "Мероприятия",
        "type": 0,
        "size": null,
        "decimals": 0,
        "allowedFileTypes": null,
        "maxFileCount": 0,
        "nullable": true,
        "readonly": false,
        "indexed": true,
        "unique": false,
        "autoassigned": false,
        "hint": null,
        "defaultValue": null,
        "refClass": "",
        "itemsClass": "event@ns",
        "allowedSubclasses": [
            "event1",
            "event2"
        ],
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
   ...


```

В случае, если для класса задана [настройка абстрактности](/docs/ru/2_system_description/metadata_structure/meta_class/abstract.md), то при создании объекта класса [Мероприятие] в коллекцию отобразятся в списке выбора те наследники класса [event], которые указаны в свойстве `"allowedSubclasses"`. То есть, исходя из примера, в коллекцию "Мероприятия" можно создать только объекты класса "Мероприятие1" и "Мероприятие2"


## Многоуровневая иерархия

Дочерние классы могут унаследовать атрибутивный состав не только от своих прямых родительских классов, но и от 
тех, которые находятся выше по иерархии наследования.

### Пример:
Родительский класс `[basicObj]` ->> `[eventBasic]` - наследник класса [basicObj] ->> `[eventBlock]` - наследник класса `[eventBasic]`.

```
{
  "isStruct": false,
  "key": [
    "guid"
  ],
  "semantic": "name",
  "name": "basicObj",
  "abstract": true,
  "version": "31",
  "caption": "Учетный объект",
  "ancestor": null,
  "container": null,
  "creationTracker": "createDatet",
  "changeTracker": "modifeDate",
  "creatorTracker": "creator",
  "editorTracker": "editor",
  "history": 0,
  "journaling": true,
  "compositeIndexes": null,
  "properties": [

```

```
{
  "isStruct": false,
  "key": [
    "guid"
  ],
  "semantic": "name| ( |code| )",
  "name": "eventBasic",
  "version": "31",
  "caption": "Базовое мероприятие",
  "ancestor": "basicObj",
  "container": null,
  "creationTracker": "",
  "changeTracker": "",
  "history": 0,
  "journaling": true,
  "compositeIndexes": null,
  "abstract": true,
  "properties": [

```

```
{
  "isStruct": false,
  "key": [
    "guid"
  ],
  "semantic": "name| ( |code| )",
  "name": "eventBlock",
  "version": "31",
  "caption": "Блок мероприятий",
  "ancestor": "eventBasic",
  "container": null,
  "creationTracker": "",
  "changeTracker": "",
  "history": 0,
  "journaling": true,
  "compositeIndexes": null,
  "properties": [

```
Наследник `[eventBlock]` будет так же наследовать атрибутивный состав родительского класса `[basicObj]`, как и наследник `[eventBasic]`.
 
### Следующая страница: [Метка времени создания](/docs/ru/2_system_description/metadata_structure/meta_class/time_user_tracker.md)
--------------------------------------------------------------------------  


 #### [Licence](/LICENCE.md) &ensp;  [Contact us](https://iondv.com) &ensp;  [English](/docs/en/2_system_description/metadata_structure/meta_class/ancestor.md)   &ensp; [FAQs](/faqs.md)          



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.
All rights reserved. 