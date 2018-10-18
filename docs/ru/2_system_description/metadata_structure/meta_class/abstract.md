### Предыдущая страница: []()
## Настройка признака абстрактности класса

Требуется в случае, когда необходимо по ссылке атрибута на базовые класс отображать список выбора его наследников. т.е. при формировании списка выбора классов для создания обьекта, не включаем в список абстрактные классы.

В мете класса указываем:
```
{
   "name": "SomeClassName",
   "abstract": true
}
```
И класс становится недоступным для инициализации на уровне UI

#### пример:
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

Ранее использовался параметр в deploy.json => modules.registry.globals.forceMaster
```
"forceMaster": {
          "basicObj@project-management": true,
          "eventBasic@project-management": true,
          "indicatorBasic@project-management": true,
          "indicatorValueBasic@project-management": true
        },
```
Он реализовывался в шаблоне создания объекта в проекте project-management.

#### [таск с реализацией] (https://ion-dv.atlassian.net/browse/IONCORE-437)

### Следующая страница []()
--------------------------------------------------------------------------  


 #### [Licence](/LICENCE.md) &ensp;  [Contact us](https://iondv.com) &ensp;  [English](/README.md)   &ensp; [FAQs](/faqs.md)          



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.
All rights reserved. 