#### [Content](/docs/en/index.md)

### Back: [Functionality](/docs/en/2_system_description/functionality/functionality.md)

# Printed forms

## Printed forms - Word

- The docxtemplater library is used
- See the [examples](http://javascript-ninja.fr/docxtemplater/v1/examples/demo.html) of the docxtemplater library.

### Format transfer options

The `table_col` parameter is to transfer the formatting se the rulles and examples [here](https://momentjs.com/docs/#/displaying/).

format: 
```
${table_col:collection:separator:format}
```
example:
```
${table_col:list.instenctions.limit:;:DD.MM.YYYY}
```
result:
```
30.08.2017;06.09.2017
```
The format allows the use of the `:` symbol.

### Displays the value of the sum in the upper case

For docx templates, there is a *toWords* filter, which by default converts to text. If you add the second parameter *tene*, then a ruble format will be added (rubles - kopecks
).

### Example:
```
{costing.costExp | toWords:tene}
```

As a result, the value of the "costExp" attribute equals **345.52**. The result in printed form will be = **Three hundred and forty five rubles fifty two kopecks**.

### Conversion between date and string

The following functions are available:
* date - convert string to date
* upper - string to upper case
* lower - string to lower case

In the export to docx, the following filters are available in expressions:
* lower - to lower case
* upper - to upper case
* dateFormat - convert date to string, examples of use:
  * {now | dateFormat:`en`}
  * {since | dateFormat:`en`}
  * {date | dateFormat:`en`:`YYYYMMDD`}
* toDate - string to date

### Current date value - `_now`

```
{_now} г.
```

### Setting to display field values from an array of objects

If you need to display fields from an array of objects (collection for example), use the tag:

```
${table_col:list.collection.attrFromCollection}
```

By default, the values will be connectes by a semicolon. To indicate another separator, specify it after the second colon:

```
${table_col:list.collection.attrFromCollection:разделитель}
```

--------------------------------------------------------------------------  


 #### [Licence](/LICENCE.md) &ensp;  [Contact us](https://iondv.com) &ensp;  [Russian](/docs/ru/2_system_description/functionality/printed_forms.md)   &ensp; [FAQs](/faqs.md)          



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.  
All rights reserved. 