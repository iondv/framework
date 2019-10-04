### Back: [The report module](/docs/en/3_modules_description/report.md)

# Comments on the mine design

## "NOT CONTAINS" operations

While we are using Monga, the operations `NOT CONTAINS` will not work correctly, since `NOT` does not apply to CONTAINS, but to the conditions of entry.

It is now impossible to change it.

## Collector is not configured for the data source

Не настроен сборщик для источника данных "summaryArea.serviceGrid". Besides in the `deploy.json` file in the `modules.report.globals` you need to set the following:

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
This is the linking of collectors to data sources in order to be able to aggregate from different databases (and sources). For now, the standard mineBuilder is used, using a local Db source.


## Cannot compare two fields

If we compare two fields with each other using search expressions, it will not work. Monga DB does not know how to compare two fields among themselves.
For example, such expressions will not work:

```
{"attr1": {"$regex": "$attr2", "$options": "i"}}
```

##  Filters

For sources based on classes, filters are specified by conditions.

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


 #### [Licence](/LICENSE)&ensp;  [Contact us](https://iondv.ru/index.html) &ensp;  [Russian](/docs/ru/3_modules_description/report_warning.md) &ensp; [FAQs](/faqs.md)   <div><img src="https://mc.iondv.com/watch/local/docs/framework" style="position:absolute; left:-9999px;" height=1 width=1 alt="iondv metrics"></div>       



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV".**   
All rights reserved.  