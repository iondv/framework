### Предыдущая страница: []()
# Условия отбора допустимых значений

## Описание работы
Фильтр списка допустимых значений используется в мете классов для атрибутов типа "Ссылка", "Коллекция". Фильтром накладываются условия ограничения выборки объектов. Условия накладываются как список операций одна за другой, начиная от полного прохождения первого уровня дерева условий и затем внутрь.
Парсер условий: https://git.iondv.ru/ION/platform/blob/master/core/ConditionParser.js

## Использование в проектах:

https://git.iondv.ru/ION/platform/blob/master/core/ConditionTypes.js
```javascript
module.exports = {
  EQUAL: 0, // равно = (используется***)
  NOT_EQUAL: 1, // не равно <> (не используется*)
  EMPTY: 2, // пусто '' или null (не используется***)
  NOT_EMPTY: 3, // не пусто !'' или !null (не используется***)
  LIKE: 4, // похож (не используется*)
  LESS: 5, // меньше < (не используется*)
  MORE: 6, // больше > (не используется***)
  LESS_OR_EQUAL: 7, // меньше или равно <= (не используется*)
  MORE_OR_EQUAL: 8, // больше или равно >= (не используется*)
  IN: 9, // похож (IN) (используется***)
  CONTAINS: 10 // содержит (не используется***)
};

// * - нет примеров**
// ** - пример поиска по проектам
// khv-childzem khv-gosekspertiza khv-svyaz-info (условие EQUAL):
// db.getCollection('ion_meta').find({"properties.selConditions.operation" : 0})
// *** - есть пример и реализация в проекте develop-and-test**
```
https://git.iondv.ru/ION/platform/blob/master/core/OperationTypes.js
```javascript
module.exports = {
  AND: 0,
  OR: 1,
  NOT: 2,
  MIN: 3,
  MAX: 4,
  AVG: 5,
  SUM: 6,
  COUNT: 7
};
```

## Операции:
Операции могут быть разделены на группы по наличию свойств в условии:

 * **Атрибут не указан в условии и условие - объект**
   * nestedConditions не содержит условий
     * Операции агрегации [AgregOpers](https://git.iondv.ru/ION/platform/blob/master/core/ConditionParser.js)
       1. MIN
       2. MAX
       3. AVG
       4. SUM
       5. COUNT
   * nestedConditions содержит условия
      * Логические операции сравнения вложенных условий [BoolOpers](https://git.iondv.ru/ION/platform/blob/master/core/ConditionParser.js)
        1. AND
        2. OR
        3. NOT

 * **Атрибут указан и условие - объект**: операции сравнения значения артибута в условии со значением в value
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

 * **Условие в виде массива**
   * Применяем неявно логическую операцию AND для сравнения результатов условий (объектов в массиве)

Каждая операция типа ключ-выражение, где ключом является имя атрибута в классе ссылки или в классе коллекции. Смежные условия объединяются логической операцией «И» (если не указана другая операция) - добавляются фильтры в свойство "selConditions": []

## Применение операций и другие особенности

* Когда используем монгу, не делайте прямых сравнений с null выражений с неопределенным результатом, например значений вложенных атрибутов. Чтобы получить атрибут по ссылке делается лукап. Если ссылка пустая, в лукапе вернется пустой массив, т.е. вложенный ссылочный обьект будет ПУСТЫМ. Т.е. у него вообще не будет атрибутов (т.е. все они будут undefined), поэтому не будут корректно сравнены с null. Используйте nempty для таких сравнений.

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

## Примеры, проект sup.docker.local (управления проектами)
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
 Соответствтенно в ссылочном атрибуте нужно показывать только объекты, у которых в ссылочном классе, если задан атрибут "selConditions", в поле property этого атрибута, указаного поле связанного класса, значение в поле "value" соответствует условию "operation"
 Т.е. в примере ниже. В классе контракта, есть атрибут организация. Мы должны показать только организации ("refClass": "organization"), у которых в поле тип ( "property": "type") равно ( "operation": 0) значению zakazchik ("value": "zakazchik").
 Все условия в "selConditions" объединяются по условию "И".  
 

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
$$now доступен везде при задании условий в старом синтаксисе.

_пример_

условие: выводить объекты, у которых значение атрибута [dataStart] меньше текущей даты:

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

реализация в [таске](https://ion-dv.atlassian.net/browse/IONCORE-454)

### Следующая страница: []()
--------------------------------------------------------------------------  


 #### [Licence](/LICENCE.md) &ensp;  [Contact us](https://iondv.com) &ensp;  [English](/README.md)   &ensp; [FAQs](/faqs.md)          



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.
All rights reserved.