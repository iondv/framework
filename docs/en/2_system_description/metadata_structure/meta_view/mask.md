#### [Content](/docs/en/index.md)

### The previous page: [View types](/docs/ru/2_system_description/metadata_structure/meta_view/view_types.md)

# Input masks

## Description

**Input mask** - provides the possibility to set a pattern or a template for an input data. It is used to facilitate the processing of values that have a fixed pattern - for example, telephone numbers. Input masks allows users to enter a predefined format in an attribute.

##  The "mask" field in meta view

### Example
```
{
  "tabs": [
    {
      "caption": "Information system ",
      "fullFields": [
        {
          "caption": "Unique Identification Number UIN",
          "type": 1,
          "property": "OuId",
          "size": 2,
          "maskName": null,
          "mask": null,
```

At the moment, it is possible to set a mask as a string or an object in the `"mask"` field.

##  Masks by default:

**Masks by default** - you can override the extensions:

* 9 — numeric symbol
* a — letter
* A — uppercase letter
* \* — number or letter 

#  Mask types

## Static mask

You can predefine the **static masks**. But they can not be modified while you type. 


```
          "mask": "aa-9999",
```

```
          "mask": {"mask": "aa-9999"},
```

## Optional masks

**Optional masks** - allow you to make some part of the mask optional for input.
In square brackets `[]` the optional part of the input is specified.



```
          "mask": {"mask": "(99) 9999[9]-9999"},
```

## Dynamic masks

**Dynamic masks** can be modified while you type.
In braces `{}` sets the dynamic part of the input. It applies to the expression before the braces:

- {n} - n repetitions
- {n,m} - from n to m repetitions
- {+} - from 1 and more repetitions
- {*} - from 0 and more repetitions



```
          "mask": {"mask": "aa-9{1,4}"},
```

## Generated masks

The syntax of the **Generated masks** is simillar to the *OR* expression. The mask can be one of three variantes, specified in the genrator. Use `|` to determine the generator. 



```
          "mask": {"mask": "(aaa)|(999)"},
```

```
          "mask": {"mask": "(aaa|999|9AA)"},
```

### KeepStatic

By default - `null (~false)`. It is used in combination with generator syntax and leaves the mask static as you type. When an array of masks is specified, `keepStatic` automatically becomes true, unless it was specified through parameters.


```
          "mask": { "mask": ["+55-99-9999-9999", "+55-99-99999-9999" ], "keepStatic": true },
```

**Result**: Enter 1212345123 => as a result we have - +55-12-1234-5123 enter another 4 => as a result we have - +55-12-12345-1234

## Additional mask examples:

"99 99 999999" —  passport number and series  
"\[\+\]9 (999) 999-99-99" —  telephone number  
"(999)|(aaa)" - enter either three numeric symbols or three characters 

## Complex masks

Set the complex masks with character validation. Use the **inputmask** plagin of the 4.0.0 version to determine the valid fields within the definition.
Set as an array in `field.mask`: 


```
field.mask: ["X{1,4}-AA №999999", {definitions: {"X": {validator: "[lLvVcCxX]", cardinality: 1, casing: "upper"}}}]
```

Index 0 - is the mask definition, and index 1 - is the additional options.

Masks are also used with "regex".

```
"mask": {
    "regex": "[A-Za-z]{1,50}"
},
```

## Masks by ID

Use the `"maskName"` field of the attribute part of the meta view to set the mask from the mask preset. **To be realized.**

### The next page: [Fields](/docs/en/2_system_description/metadata_structure/meta_view/fields.md)

--------------------------------------------------------------------------  


 #### [Licence](/LICENCE.md) &ensp;  [Contact us](https://iondv.com) &ensp;  [Russian](/docs/ru/2_system_description/metadata_structure/meta_view/mask.md)   &ensp; [FAQs](/faqs.md)   <div><img src="https://mc.iondv.com/watch/local/docs/framework" style="position:absolute; left:-9999px;" height=1 width=1 alt="iondv metrics"></div>       



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.  
All rights reserved. 