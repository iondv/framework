#### [Content](/docs/en/index.md)

### Back: [Modules](modules.md)

# The "Registry" module

**The registry module** – is a central module designed specifically for working with data based on metadata structures - including project management, programs, events, etc.

## Setting

* [DI (treegridController)](registry_treegrid.md)

## Deploy

### Configure polling frequency in deploy.json

Setting the frequency of polling the server to check that the objects is not blicked in deploy.json:

```
"registry": {
   "globals": {
      "notificationCheckInterval": 60000 // once in a minute
   }
}
```

### Setting "createByCopy"

Setting to display the "Create more" button in deploy.json:

```
"createByCopy": [
          "person@khv-childzem" // class
        ],
```

## Filters

For more information on the filters see [here](/docs/en/2_system_description/functionality/filter.md).

### Setting "help" on filters

"Help" is placed in the template file - `modules/registry/view/default/templates/view/list-filter-helper.ejs`

## Code requirements

Frontend component writing style is [here](registry_code.md)

--------------------------------------------------------------------------  


 #### [Licence](/LICENSE)&ensp;  [Contact us](https://iondv.com/portal/contacts) &ensp;  [Russian](/docs/ru/3_modules_description/registry.md) &ensp;
<div><img src="https://mc.iondv.com/watch/local/docs/framework" style="position:absolute; left:-9999px;" height=1 width=1 alt="iondv metrics"></div>       



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV".**   
All rights reserved. 