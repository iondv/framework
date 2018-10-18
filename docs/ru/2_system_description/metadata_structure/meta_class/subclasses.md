### Предыдущая страница []()
Для лучшего понимания сначала прочитать про [наследование] (https://git.iondv.ru/ION/platform/wikis/metadata/ancestor)

# Настройка списка классов наследников для создания объектов по ссылке


Задается в мете класса для атрибута типа "Ссылка"/"Коллекция" после указания ссылочного класса/класса коллекции: 

```
"itemsClass": "event",
"allowedSubclasses": [
        "Subclasses1",
        "Subclasses2"
      ],

```

`itemsClass` - коллекция на базовый класс `[event]`

`Subclasses1` - дочерний класс базого класса `[event]`, который будет отображаться в списке, при создании объекта по ссылке (далее перечисляем все дочерние классы, которые нужно отображать в списке)

> NB. Если данная настройка не задана - при создании, в списке отображаются все дочерние классы

### Условия для применения настройки: 

* тип атрибута "Коллекция" или "Ссылка"
* Для атрибута типа "Коллекция", "Ссылка" указан класс ссылки/коллекции на родительский (базовый) класс (при создании объекта ссылочного класса выводиться окно выбора нескольких классов)  
* помимо [скрытия базового класса] (https://git.iondv.ru/ION/platform/wikis/metadata/abstract),при создании объекта нужно отображать НЕ ВСЕ дочерние классы в списке выбора классов для создания объекта по ссылке

### Пример

Родительский класс [Мероприятия] имеет несколько классов наследников ([Мероприятие1], [Мероприятие3], [Мероприятие2])

В классе [Проект] есть атрибут типа "Коллекция", который ссылается на родительский класс [Мероприятие] :

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

В случае, если для класса задана настройка абстрактности ( [подробнее здесь] ((https://git.iondv.ru/ION/platform/wikis/metadata/abstract) ), то при создании объекта класса [Мероприятие] в коллекцию отобразятся в списке выбора те наследники класса [event], которые указаны в свойстве `"allowedSubclasses"`. То есть, исходя из примера, в коллекцию "Мероприятия" можно создать только объекты класса "Мероприятие1" и "Мероприятие2"


#### [реализация в таске] (https://ion-dv.atlassian.net/browse/IONCORE-450)

### Следующая страница: []()
--------------------------------------------------------------------------  


 #### [Licence](/LICENCE.md) &ensp;  [Contact us](https://iondv.com) &ensp;  [English](/README.md)   &ensp; [FAQs](/faqs.md)          



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.
All rights reserved. 



