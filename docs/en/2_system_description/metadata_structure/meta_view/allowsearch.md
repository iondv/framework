#### [Content](/docs/en/index.md)

### Back: [Meta view - general part](/docs/en/2_system_description/metadata_structure/meta_view/meta_view_main.md)

# Search in lists - "allowSearch"

The field of the general part of the meta view **"LIST"**: `"allowSearch"` allows or denies displaying a search field on the form.

## How it works?

The platform architecture and registry impose the following restrictions:  

To use the `"allowSearch"` field in the list view you need to fulfill one of the conditions:

* The key field of the class should include one of the following types: String, Date-Time, Integer, Real, Decimal 
* There should be the non-key attributes of the same types, but specified as "Indexed"

If none of the conditions is met, the search in the list view is impossible - so the search field is not displayed. If one or both conditions are met, the search is available and is performed by matching each indexed attribute with the search phrase. If at least one of the attributes matches the search phrase, the object is considered to meet the search condition and is added to the selection.

Depending on the field, the matching is performed according to the following rules:

* String - the search of the string value of the attribute using the regular expression. 
* Date-time - the search phrase is cast to the date-time, then the attribute value of the received date is checked for equality. The comparison is strict - up to seconds, i.e. if the search does not indicate the time, dates with the time 00:00 will be searched.
* Integer, Real, Decimal - the search phrase is cast to a number and the attribute value is checked for equality.

### Search by objects of computable attributes

For objects of computable attributes, the search will work only if `"cached:true"` is set. For more details see [Cached attributes](/docs/en/2_system_description/metadata_structure/meta_class/atr_cached_true.md). So there is no need to set `indexed` in the computable attributes, if they are not `cached`.  

--------------------------------------------------------------------------  


 #### [Licence](/LICENSE) &ensp;  [Contact us](https://iondv.com) &ensp;  [Russian](/docs/ru/2_system_description/metadata_structure/meta_view/allowsearch.md)   &ensp; [FAQs](/faqs.md)   <div><img src="https://mc.iondv.com/watch/local/docs/framework" style="position:absolute; left:-9999px;" height=1 width=1 alt="iondv metrics"></div>       



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.  
All rights reserved. 