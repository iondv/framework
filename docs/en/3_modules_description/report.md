#### [Content](/docs/en/index.md)

### Back: [Modules](/docs/en/3_modules_description/modules.md)

# The "report" module

**The report module** – is designed for the formation of analytical reports and reference information (on the basis of special metadata) in the form of graphs. Calculations can be performed on a schedule or be initiated by the operator.

## Library to build the report of the Pivot type

The library for building reports of the Pivot view is PivotTable.js (Examples and description: https://pivottable.js.org )
The functionality is rich, but difficult to build reports as in Excel or Word.
For now, it is not necessary to require the Microsoft Word functionality when designing the report.
## Metadata
[Metadata of the report module (data mine)](/docs/ru/2_system_description/metadata_structure/meta_report/meta_report.md)   
[Comments on the mine design](/docs/ru/3_modules_description/report_warning.md)

## Automatic data mine building

Add the `jobs.enabled = true` setting to the config.ini file to set up automatic data mine building.

### Example

To run a task at the start of the application and then every 6 hours, you need to configure the job as follows:

```json
"jobs": {
      "report-builder": {
        "description": "Report module data mines assembly service",
        "launch": {
          "hour": 21600000
        }
      }

```

--------------------------------------------------------------------------  


 #### [Licence](/LICENSE)&ensp;  [Contact us](https://iondv.ru/index.html) &ensp;  [Russian](/docs/ru/3_modules_description/report.md) &ensp; [FAQs](/faqs.md)   <div><img src="https://mc.iondv.com/watch/local/docs/framework" style="position:absolute; left:-9999px;" height=1 width=1 alt="iondv metrics"></div>       



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV".**   
All rights reserved. 