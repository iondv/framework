#### [Оглавление](/docs/ru/index.md)

### Предыдущая страница: [Вычислимые поля](atr_formula.md)

# Кеширование значения вычисляемого атрибута
## Описание функционала

При применении функционала кеширования, значения атрибутов рассчитываются при создании и изменении объекта. При выборках берутся ранее рассчитанные значения.

Если есть два вычисляемых атрибута A и B обращающиеся к коллекции C, и при этом на A настроено кеширование, а на B не настроено, то при редактировании коллекция C будет выдергиваться 2 раза - один раз для атрибута B на уровне `securedDataRepo` для проверки доступа, второй раз для атрибута A при его пересчете уже в `dataRepo`. При чтении объекта из БД в данном случае кеш атрибута A просто не имеет смысла, так как коллекция в любом случае будет выбираться для атрибута B.

## Кеширование семантик

Для кеширования семантик объектов в мете класса необходимо указать параметр:

```
semanticCached: true
```

Для атрибутов используемых в кешируемых семантиках не выполняется предварительная выборка объектов загрузки. Также в таких семантиках не рекомендуется использовать даты, т.к. они не будут приведены к формату часового пояса пользователя, так как кешируются при редактировании объекта на уровне `DBAL`.

## Кеширование значения вычисляемого атрибута

Для кеширования значения вычисляемого атрибута в его мете указываем:

```
cached: true
```

Кроме того, реализована возможность обновлять кеши у объектов по ссылкам при редактировании основного объекта.

Для этого в мете класса указываем настройку:

```
cacheDependencies: ["refAttr1", "refAttr2.refAttr3", "refAttr2.collAttr4"]
``` 

В настройке необходимо указать ссылки и коллекции, кеши объектов в которых необходимо обновить при редактировании объекта данного класса. Обновления выполняестя рекурсивно, то есть если в классе объекта в `refAttr1` настроено обновление кешей, оно будет запущено. Настройка наследуется в классах наследниках.

### Пример настройки:

```json
{
      "orderNumber": 40,
      "name": "kolStatOps",
      "caption": "Количество стационарных ОПС",
      "type": 6,
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
      "selConditions": [],
      "selSorting": [],
      "selectionProvider": null,
      "indexSearch": false,
      "eagerLoading": false,
      "formula": "count($raionObslu.oktmo_nasPunkta.svyaz.ops,&eq($gops, b), 1)",
      "cached": true
    },
```

Кешируется значение данного атрибута, получаемое из формулы. Дополнительно для обновления значения при редактирования объекта необходимо обновлять кеши объектов по ссылке: для это в мете класса каждого объекта по ссылке указываем `cacheDependencies: `.
### Пример:

```json
{
  "isStruct": false,
  "key": [
    "okato"
  ],
  "semantic": "name",
  "name": "naselenniyPunkt",
  "version": "",
  "caption": "Населенный пункт",
  "ancestor": null,
  "container": "",
  "creationTracker": "",
  "changeTracker": "",
  "history": 0,
  "journaling": true,
  "compositeIndexes": null,
  "cacheDependencies": ["supOktmo"],
  "properties": [
...
```


### Следующая страница: [Типы атрибутов](property_types.md)
--------------------------------------------------------------------------  


 #### [Licence](/LICENSE) &ensp;  [Contact us](https://iondv.com/portal/contacts) &ensp;  [English](/docs/en/2_system_description/metadata_structure/meta_class/atr_cached_true.md)     &ensp;
<div><img src="https://mc.iondv.com/watch/local/docs/framework" style="position:absolute; left:-9999px;" height=1 width=1 alt="iondv metrics"></div>         



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.  
All rights reserved. 