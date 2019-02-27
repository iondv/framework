#### [Content](/docs/en/index.md)

### Back: [Functionality](/docs/en/2_system_description/functionality/functionality.md)

# Filter on the list view form

```
If for a date, the value in the filter field and the value in the attribute field have a different format, then the filter on this field WILL NOT work
```
The query for the filter is specified by an expression (search query).

The available operations:

* using brackets to group
* logical: AND, OR, NOT
* comparison: =, <, >, <=, >=, <>
* arithmetic: +, -, *, /
* string: like
* over collections: size

### Create a query

**Choose attribute** from the drop-down list using the `> _` button located at the bottom of the filter request field. The name of the attribute is shortened in *"backticks"* i.e.:

```
`Attribute name` != 2
```

**Combination options** of attribute values for a query:

* and - necessarily both (or more) values,
* or - any of the values of both (or more) values.

Example of a combination:

```
`Attribute1` = 1 AND `Attribute2` != 2
```

**String values** of attributes when forming the query, are wrapped in * double quotes *:

```
`Field name` != "hello"
```

**Accessing attributes by reference**:

```
`Attribute1`.`Attribute by reference from the Attribute 1` = "values"
```

**Hints**:

At the end of the query field for the filter, there is a `?` sign, when clicked, a model window opens describing how the filter works and the query syntax for it.

This library (https://nearley.js.org/) is used to parse search expressions.

###  Options for using

In addition to the button next to the search bar at the top of the page, you can call the filter by clicking on the similar icon located in each column of the table.

To create a query for the filter, select a value from the drop-down list, or start typing a value in a row. As soon as the value is selected, you must press the `Enter` key - the result of the query is displayed in the value column.


--------------------------------------------------------------------------  


 #### [Licence](/LICENCE.md) &ensp;  [Contact us](https://iondv.com) &ensp;  [Russian](/docs/ru/2_system_description/functionality/filter.md)   &ensp; [FAQs](/faqs.md)          



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.  
All rights reserved. 