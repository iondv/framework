#### [Content](/docs/en/index.md)

### Back: [Modules](modules.md)

# The dashboard module

**The dashboard module** – is a module designed to display brief information in the form of blocks. The dashboard is based on the widget model.


## Module structure

The control panel consists of three basic entities - the manager, the layout and the widget.

### Manager

The manager - is the main component of the module, responsible for creating and initializing widgets, layouts, connecting the panel to other modules.

```
let manager = require('modules/dashboard/manager');
```

### Layout

Layout - is an EJS template, which defines the layout of the widgets, the parameters for the widget templates, a plugin for managing the layout grid on the client (for example, gridster), shared resources are connected.
Basic layouts of the module are located in the /dashboard/layouts. Published from metadata in the /applications/${meta-namespace}/layouts folder.
Each layout has a unique ID. When publishing a layout from a meta, a prefix is added to the ID.   

```
let dashboard = require('modules/dashboard');
dashboard.getLayout('demo');
dashboard.getLayout('develop-and-test-demo');
```

When rendering a layout, you must pass an object to the manager.
```
res.render(dashboard.getLayout('demo'), { dashboard });
```

### Widget

A widget - is an object that is located on the layout and interacts with the server via ajax requests. 

Basic widgets are located in the /dashboard/widgets. Published from the metadata are located in the folder /applications/${meta-namespace}/widgets.  

A widget consist of the file of the **index.js** and a view template **view.ejs**.

The class must be inherited from the base class/dashboard/base-widget or its descendants.

- The **init()** method is responsible for the initial initialization of the widget when the server starts.
- The **refresh()** method is called when receiving an ajax request from a client. 
- The **job()** method gets the data for the widget.

Each widget has a unique ID. When you publish a widget from meta, a prefix is added to the ID.

```
dashboard.getWidget('demo');
dashboard.getWidget('develop-and-test-demo');
```

When rendering a widget view, you must pass a widget object.

```
<% var widget = dashboard.getWidget('develop-and-test-demo') %>
<%- partial(widget.view, {widget}) %>
```

## Meta

Example of the develop-and-test structure:

```sh
    dashboard
        layouts
          demo-layout
        widgets
          demo-widget
            index.js
            view.ejs
        static
            layouts              
            widgets
              demo-widget 
```

Add the following section in the `"modules"` of the `deploy.json` configuration file to load the data from the meta to the dashboard module:

```
    "dashboard": {
      "globals": {
        "namespaces": {
          "develop-and-test": "Meta for testing and development"
        },
        "root": {
          "develop-and-test": "applications/develop-and-test/dashboard"
        }
      }
    }
```

--------------------------------------------------------------------------  


 #### [Licence](/LICENSE)&ensp;  [Contact us](https://iondv.com/portal/contacts) &ensp;  [Russian](/docs/ru/3_modules_description/dashboard.md) &ensp;
<div><img src="https://mc.iondv.com/watch/local/docs/framework" style="position:absolute; left:-9999px;" height=1 width=1 alt="iondv metrics"></div>       



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV".**   
All rights reserved. 