### Предыдущая страница: [Атрибут обратной коллекции](/docs/ru/2_system_description/metadata_structure/meta_class/atr_itemclass_backcoll.md) 
# Условия отбора допустимых значений

## Описание 
**Условия отбора допустимых значений** - позволяет ограничить выбор объектов по ссылке, допустимых для привязки в данном ссылочном атрибуте.

Фильтр списка допустимых значений используется в мете классов для атрибутов типа "Ссылка" и "Коллекция". Фильтром накладываются условия ограничения выборки объектов. Условия накладываются как список последовательных операций.

### Доступные операции:

```
•  EQUAL: 0, // равно = 
•  NOT_EQUAL: 1, // не равно <> 
•  EMPTY: 2, // пусто '' или null 
•  NOT_EMPTY: 3, // не пусто !'' или !null 
•  LIKE: 4, // похож 
•  LESS: 5, // меньше < 
•  MORE: 6, // больше >
•  LESS_OR_EQUAL: 7, // меньше или равно <=
•  MORE_OR_EQUAL: 8, // больше или равно >=
•  IN: 9, // похож (IN) 
•  CONTAINS: 10 // содержит

```

## Описание операций:
Операции могут быть разделены на группы по наличию свойств в условии:

**Атрибут не указан в условии и условие - объект**
   * nestedConditions не содержит условий
     * Операции агрегации `AgregOpers`
       1. MIN
       2. MAX
       3. AVG
       4. SUM
       5. COUNT
   * nestedConditions содержит условия
      * Логические операции сравнения вложенных условий `BoolOpers`
        2. OR
        3. NOT

**Атрибут указан и условие - объект**: операции сравнения значения артибута в условии со значением в value
   1. EMPTY
   2. NOT_EMPTY
   3. CONTAINS
   4. EQUAL
   5. NOT_EQUAL
   6. LESS
   7. MORE
   8. LESS_OR_EQUAL
   9. MORE_OR_EQUAL
   10. LIKE
   11. IN

**Условие в виде массива**
   * Применяем неявно логическую операцию AND для сравнения результатов условий (объектов в массиве)

Каждая операция типа ключ-выражение, где ключом является имя атрибута в классе ссылки или в классе коллекции. Смежные условия объединяются логической операцией «И» (если не указана другая операция) - добавляются фильтры в свойство "selConditions".

## Применение операций и другие особенности

При испол, не делайте прямых сравнений с null выражений с неопределенным результатом, например значений вложенных атрибутов. Чтобы получить атрибут по ссылке делается лукап. Если ссылка пустая, в лукапе вернется пустой массив, т.е. вложенный ссылочный обьект будет ПУСТЫМ. Т.е. у него вообще не будет атрибутов (т.е. все они будут undefined), поэтому не будут корректно сравнены с null. Используйте nempty для таких сравнений.

## JSON
 ```json
{
  "selConditions": [
    {
      "property": "region",
      "operation": 10,
      "value": "Хабаровский край",
      "nestedConditions": [
        {
          "property": "town",
          "operation": 0,
          "value": "г Хабаровск",
          "nestedConditions": []
        }
      ]
    }
  ]
}
 ```

## Описание полей

| Поле                 | Наименование в студии        | Допустимые значения                                                   | Описание                                                            |
|:---------------------|:-----------------------------|:----------------------------------------------------------------------|:--------------------------------------------------------------------|
| `"property"`         | **Атрибут**                  | Строка, только латиница без пробелов                                  | Атрибут класса ссылки, по которому производится фильтрация значений |
| `"operation"`        | **Операция**                 | Код операции (см. выше)                                               | Операция, согласно которой производится фильтрация                  |
| `"value"`            | **Значение**                 | Зависит от типа операции                                              | Второе значение для бинарных операций фильтрации                    |
| `"nestedConditions"` | **Вложенные условия отбора** | Объект, структура аналогична структуре самого объекта условий отбора. |                                                                     |

### Пример
 Класс gk. Есть поля организации. У организаций есть полe тип со значениями - таск  (IONPORTAL-159 ГОТОВО)
 ```
     {
       "orderNumber": 80,
       "name": "type",
       "caption": "Тип организации",
       "type": 0,
       "size": null,
       "decimals": 0,
       "nullable": true,
       "readonly": false,
       "indexed": false,
       "unique": false,
       "autoassigned": false,
       "defaultValue": null,
       "refClass": "",
       "itemsClass": "",
       "backRef": "",
       "backColl": "",
       "binding": "",
       "selConditions": [],
       "selSorting": [],
       "selectionProvider": {
         "type": "SIMPLE",
         "list": [
           {
             "key": "zakazchik",
             "value": "Заказчик"
           },
           {
             "key": "ispolnitel",
             "value": "Исполнитель"
           }
         ],
         "matrix": [],
         "parameters": [],
         "hq": ""
       },
       "indexSearch": false,
       "eagerLoading": false
     }
 ```
 Соответственно в ссылочном атрибуте нужно показывать только объекты, у которых в ссылочном классе, если задан атрибут "selConditions", в поле `property` этого атрибута, указаного поле связанного класса, значение в поле "value" соответствует условию "operation".
 Т.е. в примере ниже. В классе контракта, есть атрибут организация. Мы должны показать только организации ("refClass": "organization"), у которых в поле тип ( "property": "type") равно ( "operation": 0) значению zakazchik ("value": "zakazchik").  
 
 Все условия в `"selConditions"` объединяются по условию "И".  
 

 ```
     {
       "orderNumber": 120,
       "name": "zakazchik",
       "caption": "Заказчик",
       "type": 13,
       "size": null,
       "decimals": 0,
       "nullable": true,
       "readonly": false,
       "indexed": false,
       "unique": false,
       "autoassigned": false,
       "defaultValue": null,
       "refClass": "organization",
       "itemsClass": "",
       "backRef": "",
       "backColl": "",
       "binding": "",
       "selConditions": [
         {
           "property": "type",
           "operation": 0,
           "value": "zakazchik",
           "nestedConditions": []
         }
       ],
       "selSorting": [],
       "selectionProvider": null,
       "indexSearch": false,
       "eagerLoading": false
     },
     {
       "orderNumber": 130,
       "name": "ispolnitel",
       "caption": "Исполнитель",
       "type": 13,
       "size": null,
       "decimals": 0,
       "nullable": true,
       "readonly": false,
       "indexed": false,
       "unique": false,
       "autoassigned": false,
       "defaultValue": null,
       "refClass": "organization",
       "itemsClass": "",
       "backRef": "",
       "backColl": "",
       "binding": "",
       "selConditions": [
         {
           "property": "type",
           "operation": 0,
           "value": "ispolnitel",
           "nestedConditions": []
         }
       ],
       "selSorting": [],
       "selectionProvider": null,
       "indexSearch": false,
       "eagerLoading": false
     }
 ```
 
### Условия отбора допустимых значений для атрибутов с типом "Дата"

В ядре реализован атрибут контекста `$$now`, возвращающий текущую дату.
`$$now` доступен везде при задании условий.

### Пример:

**Условие:** выводить объекты, у которых значение атрибута [dataStart] меньше текущей даты:

```
{
      "property": "dateStart",
      "operation": 5,
      "value": [
        "$$now"
      ],
      "nestedConditions": []
    }
```


### Следующая страница: [Сортировка выборки допустимых значений](/docs/ru/2_system_description/metadata_structure/meta_class/atr_selsorting.md)
--------------------------------------------------------------------------  


 #### [Licence](/LICENCE.md) &ensp;  [Contact us](https://iondv.com) &ensp;  [English](/docs/en/2_system_description/metadata_structure/meta_class/atr_selconditions.md)   &ensp; [FAQs](/faqs.md)          



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.  
All rights reserved.