#### [Content](/docs/en/index.md)

### Back: [Functionality](functionality.md)

# Module templates

## Themes

**Themes** - is a directory of the following structure:

```
/static/css     styles directory
/static/js        script directory
/templates      ejs templates directory
``` 

Themes can be located:

 * In the `view` directory of modules and platform - are the system themes
 * In the `applications` directory of application as a platform - are the projects themes
 * In the `themes` directory application - are the project themes

Setting the current theme:

 1. For a platform
  * Setting `theme` in the `config.json` of the platform
  * Setting `globals.theme` in the `deploy.json` of the application
 2. For a module
  * Setting `theme` in the `config.json` of the module
  * Setting **Module name**.`globals.theme` in the `deploy.json` of the application

The default system theme is `default` (in the platform and modules "registry", "geomap", "report").

Set the path to the theme directory in the `theme` field according to the following rules:
 1. The absolute path is taken as it is.
 2. A relative path is taken relative to the system paths in the following order:
  * Relative to the `view` directory of module and platform 
  * Relative to the `applications` directory of the platform
  * Relative to the platform directory

### Example in dnt

```
"geomap": {
      "globals": {
        "theme": "develop-and-test/themes/geomap",
```

--------------------------------------------------------------------------  


 #### [Licence](/LICENSE) &ensp;  [Contact us](https://iondv.com/portal/contacts) &ensp;  [Russian](/docs/ru/2_system_description/functionality/module_templates.md)   &ensp;
<div><img src="https://mc.iondv.com/watch/local/docs/framework" style="position:absolute; left:-9999px;" height=1 width=1 alt="iondv metrics"></div>       



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.  
All rights reserved. 