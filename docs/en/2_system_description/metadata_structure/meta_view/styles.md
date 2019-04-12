#### [Content](/docs/en/index.md)

### Back: [Meta view - general part](/docs/en/2_system_description/metadata_structure/meta_view/meta_view_main.md)

# Highlighting lines in the list

Conditions of **highlighting** the lines in the list are specified with the formula.

A list of supported formulas can be found [here](/docs/en/2_system_description/metadata_structure/meta_class/atr_formula.md).
You can configure it in the General part of the list meta view as follows:

```
"styles": {
    "css-class": "formula"
  }
```

where the `"css-class"` - is a class of available design themes and the `"formula"` - is a formula with a condition for highlighting the strings in the list.

### Available themes of the `"css-class"` design

* `attention-1` - red
* `attention-2` - yellow
* `attention-3` - orange
* `attention-4` - gray
* `attention-5` - blue
* `attention-6` - green

## Purpose of use 

When you open the view list of objects, the strings of the table are highlighted according to the conditions of the formula and the theme class.

### Example

```json
"styles": {
    "attention-1": "lt($real, 0)"
  },
```

`$real` - any integer. If $real - less than 0, then the column is highlighted in red.

--------------------------------------------------------------------------  


 #### [Licence](/LICENCE.md) &ensp;  [Contact us](https://iondv.com) &ensp;  [Russian](/docs/ru/2_system_description/metadata_structure/meta_view/styles.md)   &ensp; [FAQs](/faqs.md)   <div><img src="https://mc.iondv.com/watch/local/docs/framework" style="position:absolute; left:-9999px;" height=1 width=1 alt="iondv metrics"></div>       



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.  
All rights reserved. 