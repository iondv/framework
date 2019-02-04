#### [Content](/docs/en/index.md)

### Back: [Module](/docs/en/3_modules_description/modules.md)

# The ionadmin module

**The ionadmin module** –  is used for assigning rights, managing tasks on a schedule and other administrative tasks.

# Configuration of the ionadmin module in the config.json file 

## Configuring the entry in the DB

Setting as a modal window on the list of slow queries.
Set the source in the config.json fil of the ionadmin module:

```json
"profiling": {
    "slowQuery": {
      "sources": [
          {
            "collection": "system.profile"
          }
      ]
    }
  }
```

If the `"sources"` propery is not set or null, then the data will be taken from the table:

```json
{ 
  "profiling": {
    "slowQuery": {
      "sources": null
    }
  }
}
```

If an empty array is specified, then there are no sources.

## Setting log sources

Log sources (maybe a few) are specified in the config.json file of the module:

```json
"profiling": {
    "slowQuery": {
      "sources": [
        {
          "collection": "system.profile"
        },
        {
          "file": "D:/Temp/slow-query.txt"
        }
      ]
    }
  }
```
The made selections are stored in a separate table and do not depend on the current state of the log sources. You can add information by editing them. For example, comments or notes about solved the problem or not.

## Configure DB Backup

Setting in the *ionmodule/config*:
```json
"backup": {
    "dir": "../ion-backups",
    "zlib": {
      "level": 1
    }
  }
```
* `dir` contains the path of the folder in which the node application was launched. *"../ion-backups"* - by default.

* `zlib.level` - the level of compression also affects the speed of the archive. 3 - by default.

* In addition, it is necessary that the `export.js` utility with the specified parameters correctly worked on its own.

## User's guide for ionadmin security

User's guide for ionadmin security is [nere](/docs/en/3_modules_description/admin_security.md).

--------------------------------------------------------------------------  


 #### [Licence](/LICENCE.md)&ensp;  [Contact us](https://iondv.ru/index.html) &ensp;  [Russian](/docs/ru/3_modules_description/admin.md) &ensp; [FAQs](/faqs.md)          



--------------------------------------------------------------------------  

Copyright (c) 2018 LLC "ION DV".   
All rights reserved. 

