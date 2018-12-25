#### [Content](/docs/en/index.md)

### Back: [Functionality](/docs/en/2_system_description/functionality/functionality.md)

# Filter on the list view form

The query for the filter is specified by an expression (search query) as in jira, i.e. we borrow the syntax from there except for the possibility of dereferencing reference attributes (addressing through a point to an arbitrary depth of nesting).

The available operations:

* using brackets to group
* logical: AND, OR, NOT
* comparison: =, <, >, <=, >=, <>
* arithmetic: +, -, *, /
* string: like
* over collections: size

### Query

Specify the name as in the "name" field in latin characters, for example `field_name = 1`.
Or use the "caption" field, but in backticks:

```
`Field name` != 2
```

You can use both of them together:

```
field_name = 1 AND `Field name` != 2
```

For string values, use double quotes:

```
`Field name` != "Hello"
```

The [nearley lybrary](https://nearley.js.org/) is used to parse the search expressions.


--------------------------------------------------------------------------  


 #### [Licence](/LICENCE.md) &ensp;  [Contact us](https://iondv.com) &ensp;  [Russian](/docs/ru/2_system_description/functionality/filter.md)   &ensp; [FAQs](/faqs.md)          



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.  
All rights reserved. 