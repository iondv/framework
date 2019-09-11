#### [Оглавление](/docs/ru/index.md)

### Предыдущая страница: [Условия отбора допустимых значений](atr_selconditions.md)

# Сортировка выборки допустимых значений

## Описание

**Сортировка выборки допустимых значений** - задается при создания сущности в поле `"selSorting"`  и представляет собой фильтр, который задает способ сортировки объектов. Применяется для атрибутов типа  `"Ссылка"`.

### Доступные типы сортировки:

•  Сортировка по возрастанию  
•  Сортировка по убыванию


## JSON
```
{
      "orderNumber": 20,
      "name": "ref",
      "caption": "Ссылка",
      "type": 13,
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
      "refClass": "selSortingCatalog@develop-and-test",
      "itemsClass": "",
      "backRef": "",
      "backColl": "",
      "binding": "",
      "semantic": null,
      "selConditions": [],
      "selSorting": [
        {
          "property": "string",
          "mode": 1
        }
      ],

```
## Описание полей

| Поле         | Наименование   | Допустимые значения                  | Описание                                            |
|:-------------|:-----------------------|:-------------------------------------|:----------------------------------------------------|
| `"property"` | **Атрибут**            | Строка, только латиница без пробелов | Атрибут, по которому будет производится сортировка. |
| `"mode"`     | **Порядок сортировки** | _0 - по возрастанию_                 | Порядок сортировки                                  |
|              |                        | _1 - по убыванию_                    |                                                     |

### Следующая страница: [Список выбора допустимых значений](atr_selectionprovider.md)
--------------------------------------------------------------------------  


 #### [Licence](/LICENSE) &ensp;  [Contact us](https://iondv.com/portal/contacts) &ensp;  [English](/docs/en/2_system_description/metadata_structure/meta_class/atr_selconditions.md)   &ensp;
<div><img src="https://mc.iondv.com/watch/local/docs/framework" style="position:absolute; left:-9999px;" height=1 width=1 alt="iondv metrics"></div>         



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.  
All rights reserved. 