#### [Content](/docs/en/index.md)

### The previous page: [Meta security](/docs/en/2_system_description/metadata_structure/meta_security/meta_security.md)

# Meta report

## Description

**Meta report** - is used to build a _data mine_ that contains analytical information on data from the meta. The information is organized in the form of tables. In the meta of report module, the data sources are indicated, on the basis of which the information is generated to build a report/ Further the report table columns are formed, indicating the resource for the data from the meta classes of the system. 

Meta report is located in the `bi` folder of the project in the YML format.

**NB:** Definition of "data mine"

```
Data mine - (related term to "Data Mining" - the process of discovering patterns in large data sets) 
is a kind of a storage that contains in-depth analytical information
on all data sources and information for building reports,
organized in the form of tables.
```
 
### Example YML

```
name: reportTest
caption: Text data
sources:
  - name: dataSource
    caption: Data source
    load:
      - className: sourceClass
        results:
          - field: id
            expr: $id
          - field: date
            expr: $dateCreate
          - field: name
            expr: $nameObject
    index:
      - id
  - name: test
    caption: Test report
    load:
      - source: dataTest
        joins:
          - table: date
            alias: da
            left: id
            right: id
        results:
          - field: id
            expr: $id
          - field: date
            expr: $date
          - field: name
            expr: $name
reports:
  - name: reportTest
    caption: Test report
    sheets:
      - name: reportTest
        caption: Test report
        type: aggregation
        source: test
        fetch:
          date: $date
        rangeFilters:
          date:
            caption: For the period from|to
            format: date
            inclusive: both
        columns:
          - field: date
            caption: Creation date
          - field: name
            caption: Name
```

### Example description 

**Test report** contains data from the _"sourceClass"_ class. The data source _"dataSource"_ retrieves data from the corresponding meta class specified in the `results:` property. Then the _"test"_ subsection forms and transforms data (based on the data obtained from the source specified in the `source:` property) for correct display in the report tables. The `joins:` property sets the attribute, which is the identifier for building the report (in this case, object id).

Next, the system generates a report table, based on the converted data from the source, in the `reports:`section. The `range Filters:` property contains information on filters that are configured for the report (in this case, you must specify a date range according to the data from the class). In the module, set the range filter by using the query parameters: `?rangeFld[]=0&rangeFld[]=5`,  where rangeFld is the field we use for searching. If you are searching by date - the date is sent in the locale format, which is transmitted in the http-header `"accept-language"`, or in the format `ISO8601`. The `columns:` property allows to form table columns (numbers are actual).
 
The result: a two-column table (Date and Name) in which class objects from the _"dataSource"_ source are displayed, according to the date filter configured in `rangeFilters:`. The number of objects in the table will be equal to the number of identifier values configured in the `joins:` property.

You can see the example of a simple report [here](/docs/ru/2_system_description/metadata_structure/meta_report/example.md).

## Configuration of comparison 

The configuration of strict comparison within the boundaries of a `rangeFilters` in the report:

```
   "rangeFilters": {
            "regDate": {
              "caption": "For the period from|to",
              "format": "date",
              "inclusive": "both" | "left" | "right"
            }
          }
```

`both` - both bounds can be equal to the sought values   
`left` - left border (smaller) can be equal to the sought values    
`right` - right border (bigger) can be equal to the sought values 

If `inclusive` is nor specifyed - the comparison is strict at both boundaries.

## Hierarchical build

The configuration of the hierarchical build is necessary to process the initial data when building the mine:

* To make in one data source data extraction across the entire hierarchy in the DB
* To display data of the first column with indents depending on the nesting depth

### Configuration of the hierarchical build in the data mine:

The `"hierarchyBy"` config is the objects with the following set of properties: `id`, `parent`, `level`, `order`.
 
 ```
   hierarchyBy: 
          id: guidProj
          parent: basicobj1.guidObj
          level: objLevel
          order: objOrder
 ```

where `id` - is the attribute in data, identifying element of the hierarchy 

`parent` - is the attribute in data containing parent id

`level` - is the attribute in the resulting source where the nesting level of the element will be written

`order` - is the attribute in the resulting source where the value will be written to organize the hierarchy when displayed on the form 

The `objLevel` and `objOrder` field - are the fields to write values (no need to calculate, aggregate etc.).

### Example YML

```
reports: 
  - name: roadmap
    caption: Road map
    sheets: 
      - name: roadmap
        caption: >-
          Road map
        type: aggregation
        needFilterSet: true
        needFilterMessage: Choose project
        styles: 
          objLevel: 
            1: text-indent-1
            2: text-indent-2
            3: text-indent-3
          nameObjIndex: 
            "3": level2
            "2": level1
            "1": level0
            "0": level0
        source: roadmapSource
        fetch: 
          objLevel: $objLevel
          guidObj: $guidObj
          numLevelObj: $numLevelObj
...
```

**NB:** Hierarchical build is possible only on the basis of the source and impossible on the basis of the class.

### Build algorithm:

1. Create a result source.
2. Make a sample of root elements that have an empty `parent` field.
3. We sort and write elements in the result source (in the special attribute `element_id` - the object identifier (id), in` level` - the value 0, in `order` - the sequence number of the element in the sample, reduced to a string, supplemented up to 6 characters with leading zeros).
4. Iteratively, we make samples of the levels of nesting (starting from 0), until 0 objects are extracted at the final iteration. Samples are made by combining the initial source with the resulting by the connection - `parent = element_id` and the constraint `level = current level` of nesting. 
5. At each iteration, we sort and write elements in the result source, with:
 * write the id of the object in the special attribute `element_id`, 
 * write the current level of nesting in `level`,
 * in `order`, write an order concatenation of the parent element and the sequence number of the element in the sample, reduced to a string, supplemented up to 6 characters with leading zeros.


## Configuration to hide objects

Configuration to hide all objects if tabular filters are not specified. Apply the `" needFilterSet: true "` setting to hide all objects when opening a report, until a value is selected from the list in the filter.

## How to display sample parameters in the report header by using patterns

### Example YML

```
...
          byPeriod:
            sum:
              - if:
                  - and:
                      - gte:
                          - $date
                          - ':since' # take from params->since
                      - lte:
                          - $date
                          - ':till' # take from params->till
                  - $amount
                  - 0
          byMonth:
            sum:
              - if:
                  - and:
                      - eq:
                          - month: 
                              - dateAdd:
                                  - $date
                                  - 10
                                  - h
                          - ':month' # take from params->month
                      - eq:
                          - year: 
                              - dateAdd:
                                  - $date
                                  - 10
                                  - h
                          - ':year' # take from params->year
                  - $amount
                  - 0
          byYear:
            sum:
              - if:
                  - eq:
                      - year: 
                          - dateAdd:
                              - $date
                              - 10
                              - h
                      - ':year' # take from params->year
                  - $amount
                  - 0
...
        params:
          year:
            caption: Year
            format: int
          month:
            caption: Month
            format: int
            select: # drop-down list
              '1': january
              '2': february
              '3': march
              '4': april
              '5': may
              '6': june
              '7': july
              '8': august
              '9': september
              '10': october
              '11': november
              '12': december
          since:
            caption: from
            format: date
          till:
            caption: to
            format: date
...
        columns:
          - field: title
            caption: Indicator
          - field: dimension
            align: center # header title in the center of the cell
            caption: Единица измерения
          - caption: '{$year}' # header title in the в шапке из параметра year
            align: center
            columns: # колонка в шапке - группа вложенных колонок
              - field: byPeriod
                # наименование заголовка в шапке из параметров since и till
                caption: 'c {$since} по {$till}'
                align: center
                format: number
              - field: byMonth
                # наименование заголовка в шапке из параметра month
                caption: 'За {$month}'
                align: center
                format: number
              - field: byYear
                caption: За год
                align: center
                format: number
```

## How to style lines of the report by using data

### Example YML

```
...
        fetch:
          category: $category
          title:
            case:
              - eq:
                  - $category
                  - AA4
              - 'Выдано заключений, всего в т.ч.:'
              - eq:
                  - $category
                  - AB5
              - '1. Государственная экспертиза, всего в т.ч.:'
              - eq:
                  - $category
                  - AC6
              - '- положительных'
              - eq:
                  - $category
                  - AD7
              - '- отрицательных'
...
          dimension:
            case:
              - eq:
                  - $category
                  - AA4
              - штук
              - eq:
                  - $category
                  - AB5
              - штук
...
        styles:
          category:
            AA4: level0
            AB5: level1
            AC6: level2
            AD7: level2
```

## Возможность использования комбобоксов в параметрах и фильтрах

### Example YML

```
...
        params:
          year:
            caption: Год
            format: int
          month:
            caption: Месяц
            format: int
            select: # выпадающий список
              '1': январь
              '2': февраль
              '3': март
              '4': апрель
              '5': май
              '6': июнь
              '7': июль
              '8': август
              '9': сентябрь
              '10': октябрь
              '11': ноябрь
              '12': декабрь
          since:
            caption: с
            format: date
          till:
            caption: по
            format: date
...
```

## Настройка обработки параметров в фильтре на странице отчета

### Example YML

```
reports:
   ...
   filter:
          eq:
            - $yearStart
            - year:
              - ':dateSelect'
  ...
```

Значение года в атрибуте `$yearStart` равно значению года из даты в атрибуте `:dateSelect`.

## Настройка пагинатора `"pageSize"`


**NB:** Применяется для отчетов с типом `type: list`.

Для случаев, когда отчет содержит в себе больше много объектов и на станицах нужно выводить строки постранично, чтобы не нагружать браузер тяжелой обработкой данных.

### Example YML

```
reports:
 - name: test
    caption: Тестовый отчет
    sheets:
      - name: main
        caption: Тестовый отчет
        type: list
        pageSize: 100
```

## Настройка вывода построчно

Настройка вывода вложенных данных в отчете построчно настраивается следующим образом: 

### Example YML

```
...
reports:
  - name: testReport
  ...
      columns:
        - caption: Группирующее поле
          columns: // поля для группировки
            - field: columns1
              caption: Поле1
              format: string
            - field: columns2
              caption: Поле2
              format: string
    ...
```

## Настройка инкрементальной загрузки

Для настройки инкрементальной загрузки данных в источник при сборке шахты необходимо выставить параметр:

```
append: true
```

Он необходим для подгрузки статистики за день в шахту, чтоб не пересчитывать весь объем исходных данных и иметь историю по периодам. 

## Особенности сортировки объектов

Учитывая функционал агрегации MongoDB - сортировка возможна только по результирующим полям. Это значит, что для обратной совместимости поля результата, по которым сортируем, необходимо называть так же, как и поля в источнике данных.

### Example сортировки (свойство `sort`):

```
reports:
  - name: sors
    caption: Источник
    sheets:
      ...
        rangeFilters:
          ...
        sort:
          regDateOrder: asc
        columns:
          ...
```

### The next page: [Platform configuration - deploy.json](/docs/en/2_system_description/platform_configuration/deploy.md)

--------------------------------------------------------------------------  


 #### [Licence](/LICENCE.md) &ensp;  [Contact us](https://iondv.com) &ensp;  [Russian](/docs/ru/2_system_description/metadata_structure/meta_report/meta_report.md)   &ensp; [FAQs](/faqs.md) 
 
 --------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.  
All rights reserved. 
