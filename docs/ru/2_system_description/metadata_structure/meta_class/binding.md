#### [Оглавление](/docs/ru/index.md)

### Предыдущая страница: [Ключевой атрибут](key.md)

# Основание коллекции

**Основание коллекции** - атрибут в объекте, по значению которого выполняется поиск объектов в коллекции на основании сравнения с атрибутом обратной ссылки.

## Цель использования

Основание коллекции может быть использовано для создания динамичных коллекций, когда объекты в коллекции могут быть загружены в зависимости от введенных данных или расчитанных по формуле значений, в отличие от обычных обратных ссылок с поиском только по ключевым атрибутам.

## Пример

Для примера в проекте develop-and-test заведены два класса:

- `searchRefs` - в нем добавлен атрибут-строка `code_binding` в качестве обратной ссылки для `binding`.
```
    {
      "orderNumber": 30,
      "name": "code_binding",
      "caption": "Код для binding",
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
      "itemsClass": null,
      "backRef": null,
      "backColl": "",
      "binding": "",
      "semantic": "",
    "selConditions": null,
      "selSorting": [],
      "selectionProvider": null,
      "indexSearch": false,
      "eagerLoading": false,
      "formula": null
    }
```


- `backref_searchRefs` - в этом классе используются атрибуты `backref_searchRefs_binding` и `backref_searchRefs_text`. `backref_searchRefs_binding` является динамичной коллекцией, а `backref_searchRefs_text` используется в качестве фильтра для коллекции `backref_searchRefs_binding`. Выборка в коллекцию `backref_searchRefs_binding` идет по равенству значений `backref_searchRefs_text` из класса `backref_searchRefs` и `code_binding` из класса `searchRefs`. При добавлении объектов в коллекцию вручную автоматически заполняется атрибут `code_binding`.

```
    {
      "orderNumber": 25,
      "name": "backref_searchRefs_binding",
      "caption": "Обратная ссылка (с подключенным binding) на класс searchRefs",
      "type": 14,
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
      "itemsClass": "searchRefs",
      "backRef": "code_binding",
      "backColl": "",
      "binding": "backref_searchRefs_text",
      "semantic": null,
    "selConditions": null,
      "selSorting": [],
      "selectionProvider": null,
      "indexSearch": false,
      "eagerLoading": false,
      "formula": null
    },
    {
      "orderNumber": 30,
      "name": "backref_searchRefs_text",
      "caption": "Значение",
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
      "itemsClass": "",
      "backRef": "",
      "backColl": "",
      "binding": "",
      "semantic": null,
    "selConditions": null,
      "selSorting": [],
      "selectionProvider": null,
      "indexSearch": false,
      "eagerLoading": false,
      "formula": null
    }
```


### Следующая страница: [Признак абстрактности для класса](abstract.md)
--------------------------------------------------------------------------  


 #### [Licence](/LICENSE) &ensp;  [Contact us](https://iondv.com/portal/contacts) &ensp;  [English](/docs/en/2_system_descriptionmetadata_structure/meta_class/binding.md) &ensp;
<div><img src="https://mc.iondv.com/watch/local/docs/framework" style="position:absolute; left:-9999px;" height=1 width=1 alt="iondv metrics"></div>         



--------------------------------------------------------------------------  


Copyright (c) 2018 **LLC "ION DV"**.  
All rights reserved.  