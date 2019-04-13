#### [Content](/docs/en/index.md)

### Back: [Functionality](/docs/en/2_system_description/functionality/functionality.md)

# Utilities

## Description

Utilities - are additional programs for more specialized applications.

### Core utilities

Core utilities are the most necessary utilities from installation to operating the application. They are stored in the `bin` folder. Before start the utilities, you must set the environment variable `NODE_PATH` (the path to the core folder).
В состав ядра входят утилиты:

- `bin/acl.js` - to import and edit application security settings (resources, roles, users, access rights). Launch parameters:  
    - `--u` - user   
    - `--res` - resource  
    - `--role` - role  
    - `--p` - access right
    - `--m` - access application method   
    - `--d` - directory with the security settings for import

- `bin/adduser.js` - to add new users to the application’s security settings. Launch parameters:
    - `--name` - user login (admin - by default)   
    - `--pwd` - user password (admin - by default)   

- `bin/bg.js` - to run low priority background procedures that require high power from the processor or run relatively long time
- `bin/export.js` - to export the application to a local directory. Launch parameters:
    - `--dst` - path to the directory where the export result will be written (by default ../out)   
    - `--ns` - application namespace  
    - `--file-dir` - path to the directory to which files from file attributes will be exported  
    - `--acl` - optionally export security settings   
    - `--nodata` - skip export for all created objects in the application  
    - `--nofiles` - skip file attribute export   
    - `--ver` - version (last version -last)

- `bin/import.js` - to import the application metadata. Launch parameters:
    - `--src` - path to the directory from which the import will occur (by default ../in)   
    - `--ns` - application namespace
    - `--ignoreIntegrityCheck` - data integrity ignored during import

- `bin/import-data.js` - to import the application data. Launch parameters:
     - `--src` - path to the directory from which the import will occur (by default ../in)   
     - `--ns` - application namespace

- `bin/job-runner.js` - to run scheduled tasks
- `bin/job.js` - to run the job component from the job-runner utility
- `bin/meta-update.js` - to convert application meta from one version to another
- `bin/schedule.js` - for manual start of scheduled tasks
- `bin/setup.js` - to set the `deploy` settings from the application. Launch parameters:
    - `--reset` - preliminary reset of all settings `deploy` in the app
    - `--sms` - when resetting the settings, the `deploy` settings that are marked as important are not deleted 
    - `--rwa` - redefine, not add to arrays in `deploy` settings

### Application utilities

Application utilities implement specific application functionality during the operation phase, which has not yet been implemented in the kernel in a unified form for various applications. Usually, these utilities are stored in the `lib` directory and connect to the app via `deploy`.

Examples of implemented utilities for the `sakh-pm` application:

- `lib/actions/createIndicatorValueHandler.js` - utility that creates values in the collection for the selected period
- `lib/actions/createProjectReportsHandler.js` - the utility that automatically creates printed forms for the project saving files in the cloud
- `lib/actions/assignmentToEventOnly.js` - utility that forms a checkpoint from an instruction

## App utility using an example of createIndicatorValueHandler 

### Implementation

For implementation, the JavaScript language is used with the available functionality of the modules included in the application. When implementing utilities in an application with relatively large functionality, the files themselves can be split into several dependent files.

In this example in the utility main file `lib/actions/createPlanIndicatorsHandler.js` the export command should be the last line:

```
module.exports = CreatePlanIndicatorsHandler;
```

### Connection to the application

Set the connection parameters in the `deploy` to start the utility when using the application.

For example, you first need to add in the meta view an interface element for the utility that will launch the utility. Add the `CREATE_INDICATOR_VALUE` button in the `views/indicatorFinancial/item.json` file:

```
{
      "id": "CREATE_INDICATOR_VALUE",
      "caption": "Generate collected values",
      "visibilityCondition": null,
      "enableCondition": null,
      "needSelectedItem": false,
      "signBefore": false,
      "signAfter": false,
      "isBulk": false
}
```

Add the settings in the `deploy` file to connect the `CREATE_INDICATOR_VALUE` button in the UI with the `createIndicatorValueHandler` utility:

```
"modules": {
    "registry": {
      "globals": {
          "di": {
            "createIndicatorValueHandler": {
                "module": "applications/sakh-pm/lib/actions/createIndicatorValueHandler",
                "initMethod": "init",
                "initLevel": 2,
                "options": {
                "data": "ion://securedDataRepo",
                "workflows": "ion://workflows",
                "log": "ion://sysLog",
                "changelogFactory": "ion://changelogFactory",
                "state": "onapp"
                }
            },
            "actions": {
                "options": {
                "actions": [
                    {
                    "code": "CREATE_INDICATOR_VALUE",
                    "handler": "ion://createIndicatorValueHandler"
                    }
                ]
            }
          }
```

In this example all settings are held for the registry module, bacause by clicking the `CREATE_INDICATOR_VALUE` button the utility will be called in the form of the `indicatorFinancial` object.

## Additional info

#### [Modules configuration in deploy.json](/docs/en/2_system_description/platform_configuration/deploy_modules.md)

#### [Meta view - Commands](/docs/en/2_system_description/metadata_structure/meta_view/commands.md)

--------------------------------------------------------------------------  


 #### [Licence](/LICENCE.md) &ensp;  [Contact us](https://iondv.com) &ensp;  [Russian](/docs/ru/2_system_description/functionality/utilities.md)   &ensp; [FAQs](/faqs.md)   <div><img src="https://mc.iondv.com/watch/local/docs/framework" style="position:absolute; left:-9999px;" height=1 width=1 alt="iondv metrics"></div>       



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.   
All rights reserved. 