# Значение по умолчанию `defaultValue`

Свойство позволяет определять значение атрибута, для которого задано, при открытии формы создания. Основное применение для списков выбора допустимых значений:

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

Для реализации **автоматического расчета значения по умолчанию**, можно использовать различные функции. 

К примеру, функция `max`:

```
"defaultValue": {max: ["className@namespace", "attr", {"filterAttr": "filterValue"}]}
```

[реализация в таске] (https://ion-dv.atlassian.net/browse/IONCORE-363)


**Значение по умолчанию для атрибута типа "Ссылка"** задается  с помощью операции `get` следующими способами:

```
get(className) // возвращаем id первого попавшегося объекта класса
get(className, id) // проверяем наличие объекта в БД, если объект есть, возвращаем его id
get(className, attr1, val1, attr2, val2, ...) // возвращаем id первого объекта удовлетворяющего критериям поиска: attr1=val1 и attr2=val2 и т.д.
```
[пример] (https://git.iondv.ru/ION-METADATA/khv-svyaz-info/blob/32eda762ac84de4bb647aaf1991759cbb9ade7b4/meta/infomat.class.json#L100)