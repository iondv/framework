#### [Оглавление](/docs/ru/index.md)

### Предыдущая страница: [Действия](commands.md)

# Условия отображения

## Описание

**Условия отображения** - задаёт условия отображения поля в представлении класса.

Настройка выполняется не только для логических полей, но и для строковых, строковых перечислимых (сравнивается значение по коду перечислимого). 

 ## Синтаксис
 
 * Символ `\u003d` обозначает операцию `=`
 
 * Символ `\u0027` обозначает операцию `'`
```
 "visibility": ".visibility_condition_base !\u003d \u0027\u0027",
```
Данные символы нужны для корректного отображения условий в формате .json

### Типы условий

* Сложные условия:  
```
".state == 'work' || .state == 'result' || .state == 'fin'"
```
где идет проверка по трём условиям с объединением И.  
Сам синтаксис настройки похож на условия в js.  


* Логический:

```
".archive == true"
```
где идет проверка по значению логического атрибута.

* Простое условие:

```
".state == 'work'"
```
где идет проверка по значению атрибута со списком выбора.

* Числовое условие:

```
".magistral == 1"
```
где идет проверка по числовому значению атрибута.

* Пусто/не пусто:

```
"!! .meeting"
```
где идет проверка - есть ли значение в указанном атрибуте (!! - не пусто, без "!!" - пусто).

Для аттрибута с типом "коллекция" такое условие не сработает. 
Необходимо проверять длинну коллекции, так:
```
"visibility": ".meeting > 0"
```
Где `meeting` - атрибут с типом "Коллекция".

### Пример в JSON:
```
{
          "caption": "Основание для условия отображения",
          "type": 1,
          "property": "visibility_condition_base",
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
          "caption": "Поле отобразится, если основание заполнено",
          "type": 1,
          "property": "visiility_condition_use",
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
          "visibility": ".visibility_condition_base !\u003d \u0027\u0027",
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
          "caption": "Поле отобразится, если в основании \u00271\u0027",
          "type": 1,
          "property": "visiility_condition_1",
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
          "visibility": ".visibility_condition_base \u003d\u003d \u00271\u0027",
          "enablement": null,
          "obligation": null,
          "readonly": false,
          "selectionPaginated": true,
          "validators": null,
          "hint": null,
          "historyDisplayMode": 0,
          "tags": null
        }
```

### Следующая страница: [Условие активности](enablement.md)

--------------------------------------------------------------------------  


 #### [Licence](/LICENSE) &ensp;  [Contact us](https://iondv.com/portal/contacts) &ensp;  [English](/docs/en/2_system_description/metadata_structure/meta_view/visibility.md)   &ensp;
<div><img src="https://mc.iondv.com/watch/local/docs/framework" style="position:absolute; left:-9999px;" height=1 width=1 alt="iondv metrics"></div>         



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.  
All rights reserved. 
