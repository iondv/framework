### Назад: [Модуль отчетов](/docs/en/3_modules_description/report.md)

# Замечания при проектировании шахты

## Операции "NOT CONTAINS"

Пока пользуемся монгой операции `NOT CONTAINS` работать корректно не будут, так как NOT применяется не к CONTAINS а к условиям вхождения.

Переделать это сейчас не представляется возможным.

## Не настроен сборщик для источника данных

Не настроен сборщик для источника данных "summaryArea.serviceGrid". Кроме самой меты надо в `deploy.json` в `modules.report.globals` прописать:

```json
      "mineBuilders": {
          "khv-svyaz-info": {
            "summaryArea": {
              "internet": "mineBuilder",
              "population": "mineBuilder",
              "internetGrid": "mineBuilder",
              "station": "mineBuilder",
              "serviceGrid": "mineBuilder"
            }
          }
        }
```
Это привязка сборщиков к источникам данных, чтобы иметь возможность агрегировать из разных БД (и вообще источников). Сейчас пока используется стандартный mineBuilder, использующий локальный датасорс Db.


## Нельзя сравнить два поля

Если сравниваем два поля между собой с использованием поисковых выражений, то работать не будет. Монга БД не умеет сравнивать два поля между собой.
Например подобные выражения работать не будут:

```
{"attr1": {"$regex": "$attr2", "$options": "i"}}
```

##  Фильтры

Для сорсов на основе классов фильтры указываются через кондишнсы.

```json
"filter": [
            {
              "property": "typePet",
              "operation": 0,
              "value": "statement",
              "nestedConditions": []
            }
          ]
```

--------------------------------------------------------------------------  


 #### [Licence](/LICENCE.md)&ensp;  [Contact us](https://iondv.ru/index.html) &ensp;  
[English](/docs/en/3_modules_description/report_warning.md) &ensp; [FAQs](/faqs.md)          



--------------------------------------------------------------------------  

Copyright (c) 2018 LLC "ION DV".
All rights reserved.