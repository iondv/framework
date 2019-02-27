#### [Оглавление](/docs/ru/index.md)

### Предыдущая страница: [Семантика](/docs/ru/2_system_description/metadata_structure/meta_class/semantic.md)

## Признак абстрактности класса

**Признак абстрактности класса** - требуется в случае, когда необходимо по ссылке атрибута на базовый класс отображать список выбора его наследников. При формировании списка выбора классов для создания обьекта абстрактные классы не включены. Выставите `true` в поле "abstract".

### Пример

```
{
   "name": "SomeClassName",
   "abstract": true
}
```
Класс становится недоступным для инициализации на уровне UI.

### Пример
```
{
  "isStruct": false,
  "key": [
    "id"
  ],
  "semantic": "value|[|plannedValue|](|dateStart|-|dateEnd|)",
  "name": "indicatorValueBasic",
  "version": "",
  "caption": "Значения показателей на период",
  "ancestor": null,
  "container": null,
  "creationTracker": "",
  "changeTracker": "",
  "history": 0,
  "journaling": true,
  "abstract": true,
  "compositeIndexes": [
    {
      "properties": [
        "indicatorBasic",
        "dateStart",
        "dateEnd"
      ],
      "unique": true
    }
  ],
  "properties": [
...
```


### Следующая страница: [Версионирование](/docs/ru/2_system_description/metadata_structure/meta_class/metaversion.md)
--------------------------------------------------------------------------  


 #### [Licence](/LICENCE.md) &ensp;  [Contact us](https://iondv.com) &ensp;  [English](/docs/en/2_system_description/metadata_structure/meta_class/abstract.md)   &ensp; [FAQs](/faqs.md)          



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.  
All rights reserved. 