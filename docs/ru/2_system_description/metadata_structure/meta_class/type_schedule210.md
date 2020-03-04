#### [Оглавление](/docs/ru/index.md)

### Предыдущая страница: [Геоданные](type_geodata100.md)  

# Расписание

**Расписание** - тип данных реализующий хранение периодов времени или периодичность выполнения регулярных событий. 

## Режим отображения атрибута на форме:
В представлении для расписания предусмотрено два типа полей:
`SCHEDULE = 210` – расписание отображается в табличном виде
`CALENDAR = 220` – расписание отображается в виде календаря
### Пример структуры атрибута в табличном виде:
```
  {
          "caption": "Расписание [210]",
          "type": 210,
          "property": "schedule",
          "size": 2,
          "maskName": null,
          "mask": null,
          "mode": null,
          "fields": [],
          "hierarchyAttributes": null,
          "columns": [],
          "actions": null,
          "commands": null,
          "orderNumber": 20,
          "required": false,
          "visibility": null,
          "enablement": null,
          "obligation": null,
          "readonly": false,
          "selectionPaginated": true,
          "validators": null,
          "hint": "",
          "historyDisplayMode": 0,
          "tags": null
        },
```
### Пример структуры атрибута в виде календаря: 
```
{
          "caption": "Календарь [220]",
          "type": 220,
          "property": "calendar",
          "size": 2,
          "maskName": null,
          "mask": null,
          "mode": null,
          "fields": [],
          "hierarchyAttributes": null,
          "columns": [],
          "actions": null,
          "commands": null,
          "orderNumber": 30,
          "required": false,
          "visibility": null,
          "enablement": null,
          "obligation": null,
          "readonly": false,
          "selectionPaginated": true,
          "validators": null,
          "hint": "",
          "historyDisplayMode": 0,
          "tags": null
        }
```
### Пример хранения расписания в БД:
Периоды времени задаются как объекты периодичности в атрибуте `occurs` с указанием атрибута `duration`. Пропуски во временном периоде указываются в атрибуте `skipped`.  
```
[
  {
    "description": "Рабочие часы",
    "item": "develop-and-test@WorkTime@12345", // Ссылка на объект данных
    "occurs": [ // происходит
        {
          "hour": 9, // на 9 час суток
          "duration": 14400 // длится 4 часа (4 * 60 * 60)
        },
        {
          "hour": 14, // на 14 час суток
          "duration": 14400 // длится 4 часа (4 * 60 * 60)
        }
     ],
     "skipped": [ // пропускается
        {
          "weekday": 6 // по субботам
        },
        {
          "weekday": 7 // по воскресеньям
        }
     ]
  },
// ...
]
```
## Периодичность
В объекте периодичности атрибуты задаются в рамках своих обычных значений, кроме атрибута `year` - год. Атрибут `year`, задаётся в виде частоты, так как является не периодической характеристикой. 

### **Пример**:

```
{
  "second": 30, // 1 - 60
  "minute": 20, // 1 - 60
  "hour": 9, // 0 - 23
  "day": 5, // 1 - 31
  "weekday": 1 // 1 - 7
  "month": 3 // 1 - 12
  "year": 2,
  "duration": 30 // 
}
```
 *Описание примера:* 

В примере определён временной интервал длительностью 30 секунд, который повторяется один раз в два года, пятого марта в 9 часов 20 минут 30 секунд и только если день выпадает на понедельник.

### Следующая страница: [Мета представлений](/docs/ru/2_system_description/metadata_structure/meta_view/meta_view_main.md)
--------------------------------------------------------------------------  


 #### [Licence](/LICENSE) &ensp;  [Contact us](https://iondv.com/portal/contacts) &ensp;  [English](/docs/en/2_system_description/metadata_structure/meta_class/type_schedule210.md)   &ensp;
<div><img src="https://mc.iondv.com/watch/local/docs/framework" style="position:absolute; left:-9999px;" height=1 width=1 alt="iondv metrics"></div>         



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.
All rights reserved. 
