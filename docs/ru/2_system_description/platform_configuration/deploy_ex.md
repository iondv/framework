#### [Оглавление](/docs/ru/index.md)

### Назад: [Конфигурационный файл deploy.json](deploy.md)

## Файл `deploy.json` на примере приложения "Project management system"
 
```
{
  "namespace": "project-management",
  "parametrised": true, //
  "globals": {
    "moduleTitles": {
      "registry": {
        "description": "Проектное управление",
        "order": 10,
        "skipModules": true
      }
    },
    "explicitTopMenu": [
      {
        "id": "mytasks",
        "url": "/registry/project-management@indicatorValue.all",
        "caption": "Мои задачи"
      },
      {
        "type": "system",
        "name": "report"
      }
    ],
    "plugins": {
      "sessionHandler": {
        "options": {
          "storage": {
            "type": "[[session.type]]",
            "options": {
               "host": "[[cache.redis.host]]",
               "port": "[[cache.redis.port]]"
            }
          }
        }
      },
      "wfEvents": {
        "module": "applications/project-management/lib/wfEvents",
        "initMethod": "init",
        "initLevel": 1,
        "options": {
          "workflows": "ion://workflows",
          "metaRepo": "ion://metaRepo",
          "dataRepo": "ion://dataRepo",
          "log": "ion://sysLog"
        }
      },
      "actualAclProvider": {
        "module": "core/impl/access/aclmongo",
        "initMethod": "init",
        "initLevel": 1,
        "options": {
          "dataSource": "ion://Db"
        }
      },
      "aclProvider": {
        "module": "core/impl/access/aclMetaMap",
        "options": {
          "dataRepo": "ion://dataRepo",
          "acl": "ion://actualAclProvider",
          "accessManager": "ion://roleAccessManager",
          "map": {
            "person@project-management": {
              "isEntry": true,
              "sidAttribute": "user",
              "jumps": [
                "employee"
              ]
            }
          }
        }
      },
      "fileStorage": {
        "module": "core/impl/resource/OwnCloudStorage",
        "options": {
          "url": "[[ownCloud.url]]",
          "login": "[[ownCloud.login]]",
          "password": "[[ownCloud.pwd]]"
        }
      },
      "dataRepo": {
        "options": {
          "maxEagerDepth": 4
        }
      },
      "customProfile": {
        "module": "lib/plugins/customProfile",
        "initMethod": "inject",
        "options": {
          "auth": "ion://auth",
          "metaRepo": "ion://metaRepo",
          "dataRepo": "ion://dataRepo",
          "fields": {
            "piAct": {
              "caption": "Участник прогресс-индикатора",
              "required": false,
              "readonly": true,
              "type": 4
            }
          },
          "propertyMap": {
            "person@project-management": {
              "filter": "user",
              "properties": {
                "person": "id",
                "piAct": "piAct",
                "surname": "surname"
              }
            }
          }
        }
      },
      "securedDataRepo": {
        "options": {
          "accessManager": "ion://roleAccessManager",
          "roleMap": {
            "eventBasic@project-management": {
              "PROJECT_ADMIN": {
                "caption": "Администратор проекта",
                "resource": {
                  "id": "pm::project-events"
                },
                "attribute": "project.administrator"
              },
              "PROJECT_RESPONSIBLE": {
                "caption": "Ответственный по проекту",
                "resource": {
                  "id": "pm::project-events"
                },
                "sids": [
                  "$project.owner"
                ]
              }
            }
          }
        }
      },
      "indicatorWfHandler": {
        "module": "applications/project-management/lib/util/indicatorWfHandler",
        "initMethod": "init",
        "initLevel": 2,
        "options": {
          "workflows": "ion://workflows",
          "data": "ion://securedDataRepo",
          "log": "ion://sysLog"
        }
      },
      "auth": {
        "options": {
          "checkUrlAccess": [
            "/registry/project-management@project",
            "/portal"
          ]
        }
      }
    },
    "jobs": {
      "fact-creator": {
        "description": "Служба генератора фактический показателей",
        "launch": {
          "day": 1
        },
        "worker": "factCreator",
        "di": {
          "factCreator": {
            "executable": "applications/project-management/lib/fact-creator",
            "options": {
              "log": "ion://sysLog",
              "data": "ion://dataRepo",
              "workflows": "ion://workflows"
            }
          }
        }
      },
      "report-builder": {
        "description": "Служба сборки шахт данных модуля отчетов",
        "launch": {
          "hour": 24
        },
        "worker": "rebuilder",
        "di": {
          "reportMeta": {
            "module": "modules/report/lib/impl/DsReportMetaRepository",
            "initMethod": "init",
            "initLevel": 1,
            "options": {
              "dataSource": "ion://Db",
              "calc": "ion://calculator"
            }
          },
          "stdBuilder": {
            "module": "modules/report/lib/impl/StdMineBuilder",
            "options": {
              "dataSource": "ion://Db",
              "metaRepo": "ion://metaRepo",
              "dataRepo": "ion://dataRepo"
            }
          },
          "rebuilder": {
            "executable": "modules/report/lib/rebuilder",
            "options": {
              "log": "ion://sysLog",
              "meta": "ion://reportMeta",
              "mineBuilders": {
                "project-management": {
                  "projects": {
                    "indicatorAll": "ion://stdBuilder"
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  "deployer": "built-in",
  "modules": {
    "registry": {
      "globals": {
        "signedClasses": [
          "indicatorBasic@project-management"
        ],
        "staticOptions": {
          "maxAge": 3600000
        },
        "explicitTopMenu": [
          "mytasks",
          {
            "type": "system",
            "name": "report"
          }
        ],
        "eagerLoading": {
          "*": {
            "briefcase@project-management": {
              "item": [
                "projects.typeProject.name"
              ],
              "list": [
                "projects.typeProject.name"
              ],
              "exportItem": [
                "direction.name"
              ],
              "exportList": [
                "result"
              ]
            }
          }
        },
        "listSearchMinLength": 3,
        "listSearchOptions": {
          "indicatorBasic@project-management": {
            "*": {
              "searchBy": [
                "name",
                "objectBasic"
              ],
              "mode": [
                "starts",
                "starts"
              ],
              "joinBy": "and"
            }
          }
        },
        "storage": {
          "basicObj@project-management": {
            "cloudFile": "/${item.code} (${item.name})/",
            "resultCloudFile": "/${item.code} (${item.name})/"
          }
        },
        "defaultPath": "dashboard",
        "inlineForm": true,
        "navigation": {
          "namespaces": {
            "project-management": "Проектное управление"
          },
          "menus": {
            "top": [
              "project-management@mark"
            ]
          }
        },
        "templates": [
          "applications/project-management/templates/registry"
        ],
        "customTemplates": [
          {
            "node": "project-management@eventBasic",
            "classes": [
              {
                "name": "*",
                "types": {
                  "create": "task/view",
                  "item": "task/view",
                  "selectClass": "task/selectClass"
                }
              }
            ]
          },
          {
            "node": "*",
            "classes": [
              {
                "name": "project@project-management",
                "types": {
                  "item": "to-gantt-view",
                  "selectClass": "task/selectClass"
                }
              }
            ]
          }
        ],
        "statics": {
          "app-static": "applications/project-management/templates/registry/static",
          "app-vendor": "applications/project-management/themes/registry/static/vendor",
          "common-static": "applications/project-management/templates/static"
        },
        "logo": "common-static/logo.png",
        "di": {
          "pmItemToDocx": {
            "module": "modules/registry/export/itemToDocx",
            "initMethod": "init",
            "initLevel": 0,
            "options": {
              "tplDir": "applications/project-management/export/item",
              "injectors": []
            }
          },
          "pmListToDocx": {
            "module": "modules/registry/export/listToDocx",
            "initMethod": "init",
            "initLevel": 0,
            "options": {
              "tplDir": "applications/project-management/export/item2",
              "log": "ion://sysLog"
            }
          },
          "export": {
            "options": {
              "configs": {
                "project@project-management": {
                  "passport": {
                    "caption": "Паспорт проекта",
                    "mimeType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    "extension": "docx",
                    "type": "item",
                    "preprocessor": "ion://pmItemToDocx",
                    "isBackground": true
                  },
                  "markResult": {
                    "caption": "Оценка проектов",
                    "mimeType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    "extension": "docx",
                    "type": "list",
                    "query": {
                      "filter": {
                        "and": [
                          {
                            "eq": [
                              "$guid",
                              ":project"
                            ]
                          }
                        ]
                      }
                    },
                    "params": {
                      "project": {
                        "caption": "Проект",
                        "type": "reference",
                        "className": "project@project-management"
                      }
                    },
                    "preprocessor": "ion://pmFromListToDocx",
                    "isBackground": true
                  }
                }
              }
            }
          },
          "createIndicatorValueHandler": {
            "module": "applications/project-management/lib/actions/createIndicatorValueHandler",
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
          },
          "digestData": {
            "module": "applications/project-management/lib/digest/digestData",
            "options": {
              "log": "ion://sysLog"
            }
          },
          "signManager": {
            "options": {
              "Preprocessor": "ion://digestData",
              "signaturePreprocessor": "ion://signSaver"
            }
          },
          "treegridController": {
            "module": "applications/viewlib-extra/lib/controllers/api/treegrid",
            "initMethod": "init",
            "initLevel": 0,
            "options": {
              "module": "ion://module",
              "logger": "ion://sysLog",
              "dataRepo": "ion://securedDataRepo",
              "metaRepo": "ion://metaRepo",
              "auth": "ion://auth",
              "config": {
                "*": {
                  "eventBasic@project-management": {
                    "roots": [
                      {
                        "property": "name",
                        "operation": 1,
                        "value": [
                          null
                        ],
                        "nestedConditions": []
                      }
                    ],
                    "childs": [
                      "basicObjs"
                    ]
                  }
                }
              }
            }
          },
          "fileshareController": {
            "module": "applications/viewlib/lib/controllers/api/fileshare",
            "initMethod": "init",
            "initLevel": 0,
            "options": {
              "module": "ion://module",
              "fileStorage": "ion://fileStorage"
            }
          }
        },
        "dashboard": {
          "project-management": {
            "modules": {
              "dashboard": {}
            }
          }
        }
      }
    },
    "geomap": {
      "globals": {
        "ymapControls": {
          "loader": {
            "position": {
              "left": 15,
              "top": 90
            }
          },
          "rulerControl": null,
          "typeSelector": {
            "float": "right"
          },
          "zoomControl": {
            "position": {
              "right": 10,
              "top": 10
            }
          }
        },
        "panels": {
          "rightInfo": {
            "type": "rightInfo"
          },
          "navFloat": {
            "type": "float",
            "cssClass": "map-nav-float nav-tree",
            "cssStyle": "left:10px; top:46px; width: 310px; max-height:calc(100% - 163px);"
          },
          "filterFloat": {
            "type": "float",
            "title": "Фильтры",
            "cssClass": "map-filter-float collapsible",
            "cssStyle": "left:10px; bottom:10px; width: 310px; max-height:calc(100% - 163px);"
          }
        },
        "hidePageHead": false,
        "hidePageSidebar": true,
        "stroke": {
          "panel": {
            "name": "filterFloat"
          },
          "path": {
            "strokeColor": "#00ff00",
            "strokeWidth": 6,
            "opacity": 0.8
          },
          "polygon": {
            "fillColor": "#00ff00",
            "fillOpacity": 0.1,
            "strokeColor": "#00ff00",
            "strokeOpacity": 0.9,
            "strokeWidth": 3
          }
        },
        "namespaces": {
          "project-management": "Геоданные проекта"
        },
        "templates": [
          "applications/project-management/templates"
        ],
        "statics": {
          "geoicons": "applications/project-management/icons"
        },
        "start": [
          135.07,
          48.48
        ],
        "zoom": 10,
        "regions": {
          "enabled": true,
          "osmIds": [
            "151223"
          ],
          "panel": {
            "name": "filterFloat"
          },
          "button": {
            "caption": "Районы",
            "hint": "Фильтр по районам",
            "resetHint": "Сбросить фильтр"
          },
          "levels": {
            "4": {
              "strokeWidth": 3,
              "strokeColor": "#7e8dab",
              "strokeStyle": "solid",
              "strokeOpacity": 1,
              "fillColor": "#ffffff",
              "fillOpacity": 0
            }
          }
        },
        "defaultNav": {
          "namespace": "project-management",
          "node": "objectBasic"
        },
        "search": {
          "panel": {
            "name": "filterFloat",
            "orderNumber": 10
          },
          "enabled": true,
          "timeout": 2000
        },
        "formFilter": {
          "panel": {
            "name": "filterFloat"
          }
        },
        "di": {
          "dataRepo": {
            "module": "core/impl/datarepository/ionDataRepository",
            "options": {
              "dataSource": "ion://Db",
              "metaRepository": "ion://metaRepo",
              "fileStorage": "ion://fileStorage",
              "imageStorage": "ion://imageStorage",
              "log": "ion://sysLog",
              "keyProvider": {
                "name": "keyProvider",
                "module": "core/impl/meta/keyProvider",
                "options": {
                  "metaRepo": "ion://metaRepo"
                }
              },
              "maxEagerDepth": 3
            }
          }
        }
      },
      "import": {
        "src": "applications/project-management/geo",
        "namespace": "project-management"
      }
    },
    "gantt-chart": {
      "globals": {
        "staticOptions": {
          "maxAge": 3600000
        },
        "config": {
          "columns": [
            {
              "name": "owner",
              "caption": "Владелец",
              "align": "center",
              "filter": true,
              "editor": {
                "type": "select2",
                "from": "employee@project-management"
              }
            }
          ],
          "preConfigurations": {
            "config2": {
              "caption": "Расширенная",
              "showPlan": false,
              "units": "year",
              "days_mode": "full",
              "hours_mode": "work",
              "columnDisplay": {
                "text": true,
                "owner": true,
                "priority": true,
                "start": true,
                "progress": true
              }
            }
          },
          "roots": [
            "briefcase@project-management",
            "project@project-management"
          ],
          "initialDepth": 1,
          "createUrl": {
            "project@project-management": "registry/project-management@myprojectevent.all/new/{{parentClass}}.{{parentId}}/basicObjs/event@project-management"
          },
          "searchCount": 25,
          "inplaceCreation": {
            "rootLevel": true,
            "skip": [
              "briefcase@project-management"
            ],
            "ambigiousDefault": "event@project-management",
            "force": {
              "@root": "briefcase@project-management",
              "eventObject@project-management": "eventOnly@project-management"
            }
          },
          "map": {
            "employee@project-management": {
              "eager": [
                "person",
                "organization"
              ]
            },
            "project@project-management": {
              "type": "project",
              "open": true,
              "color": "#e3fcef",
              "textColor": "#000",
              "text": "name",
              "override": {
                "owner": "head"
              },
              "parents": [
                "briefcase"
              ],
              "filter": {
                "ne": [
                  "$archive",
                  true
                ]
              },
              "url": "registry/project-management@myprojectevent.all/view/:class/:id"
            }
          }
        },
        "statics": {
          "common-static": "applications/project-management/templates/static"
        },
        "logo": "common-static/logo.png",
        "rootParamNeeded": true
      }
    },
    "report": {
      "globals": {
        "namespaces": {
          "project-management": "Проектное управление"
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
    "rest": {
      "globals": {
        "di": {}
      }
    },
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
    "ionadmin": {
      "globals": {
        "defaultPath": "ionadmin",
        "securityParams": {
          "resourceTypes": {
            "*": {
              "title": "Общие"
            }
          },
          "hiddenRoles": [
            "^PROJ_DEPART_EMPLOYEE"
          ]
        }
      },
      "statics": {
        "common-static": "applications/project-management/templates/static"
      },
      "logo": "common-static/logo.png"
    },
    "dashboard": {
      "globals": {
        "namespaces": {
          "project-management": "Проектное управление"
        },
        "root": {
          "project-management": "applications/project-management/dashboard"
        }
      }
    },
    "diagram": {
      "globals": {
        "config": {
          "org1": {
            "caption": "Организационная структура",
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
  }
}
```
--------------------------------------------------------------------------  


 #### [Licence](/LICENSE) &ensp;  [Contact us](https://iondv.com/portal/contacts) &ensp;  [English](/docs/en/2_system_description/platform_configuration/deploy_ex.md)   &ensp;
<div><img src="https://mc.iondv.com/watch/local/docs/framework" style="position:absolute; left:-9999px;" height=1 width=1 alt="iondv metrics"></div>
 
 --------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.  
All rights reserved. 