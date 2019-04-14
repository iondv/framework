#### [Content](/docs/en/index.md)

### Back: [The registry module](/docs/en/3_modules_description/registry.md)

# DI setting

## Connection in the global settings the register module 

### Example in deploy.json

```json
"modules": {
    "registry": {
      "globals": {
	 "di": {
```

## treegridController

### Description

"treegridController" is designed to create hierarchical lists of objects in a class collection attribute or in class navigation.  

Works with the use of the dhtmlxSuite_v51_pro (https://dhtmlx.com/docs/products/dhtmlxTreeGrid/) component.

### Connection in DI

```json
"treegridController": {
            "module": "applications/viewlib/lib/controllers/api/treegrid",
            "initMethod": "init",
            "initLevel": 0,
            "options": {
              "module": "ion://module",
              "logger": "ion://sysLog",
              "securedDataRepo": "ion://securedDataRepo",
              "metaRepo": "ion://metaRepo",
              "auth": "ion://auth",
              "config": { // the main config
                "*": { // selection of objects is possible in each navigation
                  "eventBasic@project-management":{ // selection of objects in the specified class
                    "roots":[{ // roots search
                      "property": "name",
                      "operation": 1,
                      "value": [null],
                      "nestedConditions": []
                    }],
                    "childs":["basicObjs"] // search for heirs
                  },
```

### Template types

* "template": "treegrid/collection"   
For a collection attribute. It is connected in the view of the object:   

```json
"options": {
            "template": "treegrid/collection",
            "reorderable": true,
            "treegrid": {
              "width": "auto,100,100,100,100,0",
              "align": "left, center,center,center,center, left",
              "sort": "str, date, date, date, date, int",
              "enableAutoWidth": false,
              "paging": {
                "size": 20
              }
            }
          }
```
* "template": "treegrid/list"   
For navigation class. Connection:   

```json
"options": {
    "template": "treegrid/list"
  }
```

* Setting `skin`

https://docs.dhtmlx.com/grid__skins.html

```
"options" : {
...
  "treegrid" : {
	"skin": "material" // by default
	// "skin": "skyblue"
	// "skin": "terrace"
	// "skin": "web"
  }
}
```

### Additional sources of information on treegridController

* [Hierarchical view for collections](/docs/en/2_system_description/platform_configuration/deploy_modules.md#setting-a-hierarchical-view-of-collections).

 DHTMLX (dhtmlxSuite_v51_pro)

 * https://docs.dhtmlx.com/
 * https://dhtmlx.com/docs/products/dhtmlxTreeGrid/

 --------------------------------------------------------------------------  


 #### [Licence](/LICENCE.md)&ensp;  [Contact us](https://iondv.ru/index.html) &ensp;  [Russian](/docs/ru/3_modules_description/registry_treegrid.md) &ensp; [FAQs](/faqs.md)   <div><img src="https://mc.iondv.com/watch/local/docs/framework" style="position:absolute; left:-9999px;" height=1 width=1 alt="iondv metrics"></div>       



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV".**   
All rights reserved. 