#### [Content](/docs/en/index.md)

### Back: [Configuration file - deploy.json](/docs/en/2_system_description/platform_configuration/deploy.md)

# Module settings in `deploy.json`

# The "registry" module

## Setting of configurable file save

To set the path to save the file in the storage - use the following setting:

```
"modules": {
    "registry": {
      "globals": {
...
        "storage": {
           "className@ns":{
               "file_attr":"/${class}/example_${attr}/${dddd}/"
           }
         },
...
```
In the object, the key is the name of the class, then "attribute name": "relative path".

Aliases are in `${alias}`. Available aliases:

* `class` - class name
* `attr` - attribute name
* `moment.js` - dates

## Setting to specify the number of characters for search query

For all application - `"listSearchMinLength"`.

```
"modules": {
  "registry": {
     "globals": {
       "listSearchMinLength": 1
      }
   }
}
```

For one specific class - `"minLength"`.

```
"modules": {
  "registry": {
     "globals": {
       "listSearchOptions": {
          "className@ns": {
            "*": {
              "searchBy": [
                "atr1"
              ],
              "splitBy": "\\s+",
              "mode": [
                "starts"
              ],
              "joinBy": "and",
              "minLength": 3
            }
         }
      }
   }
}
```
##  Setting of container assignment when creating the nested object

For cases when it is necessary to assign a value for an attribute by reference, not when saving an object, but when creating, specify the setting for the class that contains the assigned value in the `deploy.json` file of the application:

```
"registry": {
   "globals": {
      "forceMaster": {
         "name_class@ns": true
      }
   }
 }
```

An example of the sequence generators - now for each object its code is the code of its direct container plus the next value of the sequence counter associated with the container object.

## Setting the eager loading for printed forms `"skipEnvOptions"`

[Printed forms](/docs/ru/2_system_description/functionality/printed_forms.md) in more details.

Use the `skipEnvOptions` flag to enable/disable the eager loading.

### Example

```
...
"modules": {
    "registry": {
      "globals": {
...
       "customTemplates": [
...
         "di": {
...
           "export": {
            "options": {
              "configs": {
                "class@ns": {
                  "expertItemToDocx": {
                    "type": "item",
                    "caption": "Name",
                    "mimeType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    "extension": "docx",
                    "skipEnvOptions": true,
                    "preprocessor": "ion://expertItemToDocx"
                   }
                 }
               }
             }
           }
...
         }
       }
     }
   }
 }
...
```
Thanks to the eager loading the system creates a file very quickly, but it may not always be acceptable.

## Setting of notifications about editing the object by another user

In the setting of the notification about the editing of an object by another user, the time before blocking is specified in milliseconds:

```
"modules": {
    "registry": {
      "globals": {
        "concurencyCheck": 10000
      }
    }
 } 
```
**ConcurencyChecker component**:

The `ConcurencyChecker` component in the data source stires the lock status for objects.

It stores the following parameters:
* full id of an object (class@id), 
* date/time of block (blockDate), 
* user who blocked.

The component creates blocking states, thus a timer is started, according to which the blocking record is deleted after the timeout expires. If at the time the timer is triggered, the entry is still relevant (updated blockDate), the entry is not deleted, and the timer is updated.

**Logic of the view controller**:

Read the *registry.concurencyCheck* setting (blocking timeout in seconds).

If it is bigger than 0, read the `ConcurencyCheker` - check the block status. 

If not found(expired - blockDate < now() - registry.concurencyCheck), then through the checker write a new block on behalf of the current user. If you found a running block, transfer the information about the block to the template. Display this information on the form in the "read only" mode (`globalReadOnly`).

An additional controller `concurencyState`, which takes the id of the object and checks its block status. If the object is not blocked (there is no block, or it is expired), then it blocks the object on behalf of the current user. If the object is locked by the current user, then it updates *blockDate* to *new Date()*. Returns the block state.

**Object form behavior**:

If the information about the block is transferred to the template, then a script is added that accesses the `concurencyState` controller periodically (with a period of `registry.concurencyCheck/2`).

If you receive the information about blocking by another user - it is displayed (update the message), if the blocking lock intercepted by the current user - the form reloads (it is displayed in the edit mode).

## Resources for project design

This is related, for example, to groups in a special style — in order not to connect resources through changes to module templates — you need to connect them in the application.

```
        "statics": {
          "geoicons": "applications/khv-svyaz-info/icons"
        },
```
All that inside the `icons` directory if available by the `registry/geoicons` link.

## Setting the form for specifying export parameters (for printed forms)

Example of `params`:

```
...
        "di": {
          "pmListToDocx": {
            "module": "modules/registry/export/listToDocx",
            "initMethod": "init",
            "initLevel": 0,
            "options": {
              "tplDir": "applications/project-management/export/item2",
              "log": "ion://sysLog"
            }
          }
...
          "export": {
            "options": {
              "configs": {
                "evaluationPerform@project-management": {
                  "rating": {
                    "caption": "Evaluation of the executor and co-executor of the project",
                    "mimeType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    "extension": "docx",
                    "type": "list",
                    "query": {
                      "filter": {
                        "and": [
                          {
                            "eq": [
                              "$basicObjPerform",
                              ":project"
                            ]
                          },
                          {
                            "gte": [
                              "$date",
                              ":since"
                            ]
                          },
                          {
                            "lte": [
                              "$date",
                              ":till"
                            ]
                          }
                        ]
                      }
                    },
                    "params": {
                      "project": {
                        "caption": "Project",
                        "type": "reference",
                        "className": "project@project-management"
                      },
                      "since": {
                        "caption": "Period from",
                        "type": "date",
                        "default": "$monthStart"
                      },
                      "till": {
                        "caption": "Period to",
                        "type": "date",
                        "default": "$monthEnd"
                      }
                    },
                    "eagerLoading": [
                      "ownOrg",
                      "basicObjs"
                    ],
                    "preprocessor": "ion://pmListToDocx"
                  }
                }
...
```
##  Setting search options in the list of objects

The functionality allows you to determine at the class level whether we are looking for class objects from the list view by the first instance of a word or by full words, by individual attributes or by the specified attributes in the list with search parameters separated by spaces.

### Format and available operations:

```
"listSearchOptions": {
    "person@khv-childzem": {...} // for a class
       "khv-childzem@person": {...} // only in the "person" navigation node
      "*": {...} // everywhere by default
}
```

Substitute attributes instead of the `...` and set operations for search, for example:

```
        "searchBy": [ // attributes by which we search, by default displayed in the columns
         "surname",
         "name",
         "patronymic"
       ],
       "splitBy": "\\s+", // split the search phrase into regular expressions, match parts with attributes
       "mode": ["starts", "starts", "starts"], // combining conditions mode - in this case "starts with" (also available like, contains, starts, ends)
       "joinBy": "and" // attribute combining conditions mode (or by default)
```
## Setting a hierarchical view of collections

**Hierarchical view of collections** - diplays collections, in which elements are connected in the form of a hierarchical reference book. The viewlib library has a custom controller that returns the next level of hierarchy in the TreeGrid format.

### Example

```
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
              "config": {
                "*": {
                  "project@project-management":{
                    "roots":[{
                      "property": "name",
                      "operation": 1,
                      "value": [null],
                      "nestedConditions": []
                    }],
                    "childs":["stakeholders", "basicObjs"]
                  },
                  "governmentPower@project-management": {
                    "roots":[],
                    "childs":null,
                    "override": {
                      "descript": "url"
                    }
                  },
                  "object@project-management": {
                    "roots":[],
                    "childs":null
                  },
                  "event@project-management": {
                    "roots":[],
                    "childs":null
                  }
                }
              }
            }
          }
...
```

The `config` field contains all settings:
* first key is the navigation node (the "*" sign means - applies to all nodes), 
* classes have `roots` - that indicate the objects of this class to pull out as root (conditions are used),
* `childs` - are class attributes to pull the hierarchy.

## Setting text search depth by reference attributes

`searchByRefs` - is an array of settings to indicate the class hierarchy. You can compare it with several classes.
### Example

```
"family@khv-childzem": {
            "*": {
              "searchByRefs":[
                {
                  "class": "person@khv-childzem",
                  "idProperties": ["famChilds", "famParentMale", "famParentFemale"],
                  "searchBy": [
                    "surname",
                    "name",
                    "patronymic"
                  ],
                  "splitBy": "\\s+",
                  "mode": [
                    "starts",
                    "starts",
                    "starts"
                  ],
                  "joinBy": "and"
                }
              ]
            }
          }
```

# The "geomap" module

## Setting the application icons

The logo for the module is described through the standard mechanism of static routes:

```json
{
  "modules": {
    "geomap": {
      "statics":[{"path":"applications/khv-svyaz-info/icons", "name":"icons"}],
      "logo": "icons/logo.png"
    }
  }
}
```

## Setting to hide header and sidebar

### Example:

```
"geomap": {
   "globals": {
      "hidePageHead": true, //display header
      "hidePageSidebar": false, //hide the sidebar
      ...
    }
 }
```

# The "gantt-chart" module

## Настройка шкалы времени 

The time scale is configured by setting the "Step" in the Gaant module.
In the preconfiguration "Step" is set through the `step` parameter:

```
{
  "unit": "year",
  "step": 5
}
```

### Example

```
...
   "gantt-chart": {
      "globals": {
        "config": {
...
          "preConfigurations": {
...
            "config3": {
              "caption": "Third configuration",
              "showPlan": true,
              "units": "year",
              "step": 5,
              "days_mode": "full",
              "hours_mode": "full",
              "columnDisplay": {
                "text": true,
                "owner": true,
                "priority": true
              },
              "filters": {
                "priority": "Usual"
              }
            }
          }
...
        }
      }
    }
```

# The "report" module
```
"report": {
      "globals": {
        "namespaces": {
          "project-management": "Project management"
        },
        "defaultNav": {
          "namespace": "project-management",
          "mine": "projects",
          "report": "roadmap"
        },
        "mineBuilders": {
          "project-management": {
            "test": {
              "projects": "mineBuilder"
            },
            "projects": {
              "indicatorAll": "mineBuilder"
            }
          }
        },
        "di": {},
        "statics": {
          "common-static": "applications/project-management/templates/static"
        },
        "logo": "common-static/logo.png"
      },
      "import": {
        "src": "applications/project-management/bi",
        "namespace": "project-management"
      }
    },
```

# The "rest" module
```
 "rest": {
      "globals": {
        "di": {}
      }
    },
 ```

# The "portal" module
```
"portal": {
      "import": {
        "src": "applications/project-management/portal",
        "namespace": "project-management"
      },
      "globals": {
        "portalName": "pm",
        "needAuth": true,
        "default": "index",
        "theme": "project-management/portal",
        "templates": [
          "applications/project-management/themes/portal/templates"
        ],
        "statics": {
          "pm": "applications/project-management/themes/portal/static"
        },
        "pageTemplates": {
          "navigation": {
            "index": "pages/index"
          }
        }
      }
    },
 ```

# The "ionadmin" module

## Hiding roles in admin from assignment to user

For roles that you want to hide in the admin from being assigned to the user, in the deploy of the application prescribe the filters based on the regular expressions, by which such roles will be determined.

```
"ionadmin": {
      "globals": {
        "securityParams": {          
          "hiddenRoles": [
            "^somePrefix_"
          ]
        }
      }
    }
```

# The "dashboard" module

Set the following function in the `"modules"` section in the deploy.json file of the application, to load the data from the meta into the "dashboard" module.

```
   "dashboard": {
      "globals": {
        "namespaces": {
          "project-management": "Project management"
        },
        "root": {
          "project-management": "applications/project-management/dashboard"
        }
      }
    },
```
# The "diagram" module

```
"diagram": {
      "globals": {
        "config": {
          "org1": {
            "caption": "Organizational structure",
            "edit": true,
            "showSections": false,
            "relations": {
              "className": "organization@project-management",
              "title": "name",
              "text": "address",
              "img": "",
              "filter": [
                {
                  "property": "headOrg",
                  "operation": 0,
                  "value": [
                    null
                  ],
                  "nestedConditions": []
                }
              ],
              "children": [
                {
                  "className": "branchOrg@project-management",
                  "property": "branch",
                  "title": "name",
                  "text": "address",
                  "children": [
                    {
                      "className": "branchOrg@project-management",
                      "property": "branch",
                      "children": []
                    }
                  ]
                }
              ]
            }
          }
        }
      }
    }
 ```

### The [full example](/docs/en/2_system_description/platform_configuration/deploy_ex.md) of the deploy.json file

--------------------------------------------------------------------------  


 #### [Licence](/LICENCE.md) &ensp;  [Contact us](https://iondv.com) &ensp;  [Russian](/docs/ru/2_system_description/platform_configuration/deploy_modules.md)   &ensp; [FAQs](/faqs.md) 
 
 --------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.  
All rights reserved. 