#### [Content](/docs/en/index.md)

### The previous page: [Options](/docs/ru/2_system_description/metadata_structure/meta_view/options.md)

## Maintenance of project documents

**Maintenance of project documents** -  is realized as `"filesharelist"` and `"fileshare"` settings, which are intended for document management, such as the ability to download and/or get a file link. To configure, specify the following property in the file type attribute view:

```
 "options": {
              "template": "fileshare-list"
            }
```
* `fileshare-list` - for the `multifile` type - multiple files
* `fileshare` - for the `file` type - one file

In the `deploy.json` file in the settings of `registry` connect a custom uploader-file (with "share" directory and advanced settings):

```
  "modules": {
    "registry": {
      "globals": {
        ...
        "di": {
          ...
          "fileshareController": {
            "module": "applications/viewlib/lib/controllers/api/fileshare",
            "initMethod": "init",
            "initLevel": 0,
            "options": {
              "module": "ion://module",
              "fileStorage": "ion://fileStorage"
            }
          }
```

## How to save files in the cloud

The path to save the file in the cloud is configured in the `deploy.json` file of the application. The `$` sign is used to access to the object properties.

```
{item.propertyName.referenceObjectProperty}
```
i.e. use `$ {item.}` to indicate that this is an object call.

### Example:

```json
"modules": {
    "registry": {
      "globals": {
        "storage": {
          "basicObj@project-management": {
            "cloudFile": "/${class}/pm_${attr}/${dddd}/"
          },
          "project@project-management": {
            "cloudFile": "/${item.name} (${item.code})/"
          },
          "eventControl@project-management": {
            "cloudFile": "/${class}/pm_${attr}/${dddd}/"
          },
          "eventOnly@project-management": {
            "cloudFile": "/${class}/pm_${attr}/${dddd}/"
          }
        }
      }
    }
 }
```
_The setting allows you to specify any structure of file storage (linear/hierarchical, collection/single file)_



## "Sharing" functionality

### How to configure?

In the view set the attribute property of the `"File"` type:

```
"tags": [
            "share"
          ],
```
### How to use?

When you click on the "share" icon, open the control window similar to one in OwnCloud with the following buttons:
* `apply` - по апи облачного хранилища для файлика/каталога передаем все выбранные параметры:
* `share a link` - form a "share" on the file / directory - after applying, return to the field to copy the link
* `allow editing`
* `protect with a password`- the field for entering password
* `set period of validity` - the field for entering data
* `go to storage` - open in a new tab the link on the "share" where there are the files/directory
* `close` - close the control window of the file

**NB:** Sharing setting is available both for each file and for the entire directory. If there is already a sharing on the file / directory, then when you open the control window, the sharing settings are displayed, if necessary, you can change the properties.

## Direct link to file storage

### Features

* download immediately 

* go to nextCloud and edit

### Conditions of link storage

Conditions for storing links created in the process of working with files: **To be released** the ability to delete all links created in the process of working with a file after some time or as unnecessary.

### Access configuration

Settings of users and access rights to OwnCloud storage objects. In some cases, you must specify users and their rights to the storage objects that you create.

You can specify it in the `deploy.json` file of the project. 

### Example:

```json
"ownCloud": {
  "module": "core/impl/resource/OwnCloudStorage",
  "options": {
   ...
     "users": [
        {
           "name": "user",
           "permissions": {
              "share": true,
              "create": false,
              "edit": true,
              "delete": false
           }
         }
      ]
   }
}
```

### The next page: [Comments](/docs/en/2_system_description/metadata_structure/meta_view/comments.md)

--------------------------------------------------------------------------  


 #### [Licence](/LICENCE.md) &ensp;  [Contact us](https://iondv.com) &ensp;  [Russian](/docs/ru/2_system_description/metadata_structure/meta_view/fileshare.md)   &ensp; [FAQs](/faqs.md)   <div><img src="https://mc.iondv.com/watch/local/docs/framework" style="position:absolute; left:-9999px;" height=1 width=1 alt="iondv metrics"></div>       



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.  
All rights reserved. 