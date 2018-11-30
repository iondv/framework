#### [Content](/docs/en/index.md)

### The previous page: [Meta security](/docs/en/2_system_description/metadata_structure/meta_security/meta_security.md)

# Meta report

## Description

**Meta report** - is used to build a _data mine_ that contains analytical information on data from the meta. The information is organized in the form of tables. In the meta of report module, the data sources are indicated, on the basis of which the information is generated to build a report. Further the report table columns are formed, indicating the resource for the data from the meta classes of the system. 

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
caption: Test data
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
            caption: Unit of measure
          - caption: '{$year}' # header title of the year property
            align: center
            columns: # column in the header - a group of nested columns
              - field: byPeriod
                # header title of the since and till property 
                caption: 'c {$since} по {$till}'
                align: center
                format: number
              - field: byMonth
                # header title of the month property
                caption: 'For {$month}'
                align: center
                format: number
              - field: byYear
                caption: For year
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
              - 'Issued the reports, total, including:'
              - eq:
                  - $category
                  - AB5
              - '1. State Expert Appraisal, total, including:'
              - eq:
                  - $category
                  - AC6
              - '- favourable'
              - eq:
                  - $category
                  - AD7
              - '- unfavourable'
...
          dimension:
            case:
              - eq:
                  - $category
                  - AA4
              - pieces
              - eq:
                  - $category
                  - AB5
              - pieces
...
        styles:
          category:
            AA4: level0
            AB5: level1
            AC6: level2
            AD7: level2
```

## Use of ComboBox in the parameters and filters

### Example YML

```
...
        params:
          year:
            caption: year
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
```

## Configuration of processing filter parameters on the report page

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

The year value in the `$yearStart` attribute is equal to the year value from the date in the `:dateSelect` attribute.

## Paginator `"pageSize"`


**NB:** It is used in the reports of the `list` type.

We recommend using the `"pageSize"`, when the report contains many objects and you need to output the lines page-by-page, not to load the browser with heavy data processing. 

### Example YML

```
reports:
 - name: test
    caption: Test report
    sheets:
      - name: main
        caption: Test report
        type: list
        pageSize: 100
```

## Output line by line

Setting up the output line by line of nested data in the report is configured as follows: 

```
...
reports:
  - name: testReport
  ...
      columns:
        - caption: Grouping field
          columns: // field to group
            - field: columns1
              caption: Field1
              format: string
            - field: columns2
              caption: Field2
              format: string
    ...
```

## Configure incremental load

Specify the `append: true` property to set the incremental load of data into the source when bulding the data mine. It is used to uploade the statistics for a day to the mine, so as not to recalculate the entire volume of source data and have a history by periods.
 
## Specificity of object sorting

Taking into account the MongoDB aggregation functional — the sorting is possible only by the resulting fields. This means that for backward compatibility, you should name the result fields that are used for sorting the same as the fields in the data source.

### Example of sorting (the `sort` property):

```
reports:
  - name: sors
    caption: Source
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
