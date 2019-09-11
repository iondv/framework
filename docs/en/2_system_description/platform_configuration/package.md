#### [Content](/docs/en/index.md)

### The previous page: [Configuration file - deploy.json](deploy.md)

# Dependencies in package.json

The **package.json** file - defines the structure of dependencies and the detailed composition of the system modules.

```
"ionMetaDependencies": { 
  "viewlib": "0.0.1" 
}
```

## Specificity of connection using a script

* if there is no slash in the object name - / => "project-management"- substitute in the default path the ION-APP group - i.e the path is - //git.iondv.ru/ION-APP/project-management.
* if there is a slash in the object name - it means it’s already set up with the group and just pick up the path to the git with the group and meta, for example "ION-METADATA/viewlib" - the path - //git.iondv.ru/ION-METADATA/viewlib.
* if the version value begins with git+http:// или git+https:// - then this is the full path to the external repository - drop git+ and pull the git.
* if the version value begins with http:// or https:// - then this is the full path to the archive - pull and unzip.  
**Not realized**, as dapp does not support working with archives.

### Example of the `package.json` file

```
{
  "name": "develop-and-test",
  "description": "Metaproject for develop and test",
  "version": "1.9.2",
  "homepage": "http://docker.local:8080",
  "engines": {
    "ion": "1.24.1"
  },
  "scripts": {
    "test": "mocha ./test/e2e/**/*.js"
  },
  "ionModulesDependencies": {
    "registry": "1.27.1",
    "geomap": "1.5.0",
    "portal": "1.3.0",
    "report": "1.9.2",
    "ionadmin": "1.4.0",
    "dashboard": "1.1.0",
    "rest": "1.1.2",
    "gantt-chart": "0.8.0"
  },
  "ionMetaDependencies": {
    "viewlib": "0.9.1"
  }
}


```
## Field description

| Field            | Name | Description                                                                                                                                                                                                                                                                                  |
|:----------------|:----------------------|:--------------------------------|
| `"name"`       | **Name**      | Project name.  |
| `"description"`| **Description** | Project description. |
| `"version"`    | **Version**   | Number of a current version. |
| `"homepage"`   | **Home page** | Link to the already built project on the docker. |
|    `"bugs"`     |   **Bugs**           | Specifies the link to the application project in GitLab, where issues about bugs are collected.|
| `"repository"` | **Repository**  | Сonsists of "type" and "url" fields. Indicates the type of repository and a link to it.                                                                                                                                                                                                                  |
| `"engines"`    | **Core**     | Number of a core version. |
| `"scripts"`    | **Scripts**  | Script to build meta from different groups and different url.
| `"ionModulesDependencies"`        | **Dependencies of ion modules**               | Specifies the modules and their versions used in the application. The project includes the following modules: •  "**ionadmin**" – administration module •  "**registry**" – registry module •  "**report**" – report module •  "**rest**": "- REST module •  "**dashboard**" – dashboard module •  "**geomap**" - geo module •  "**gantt-chart**" – gantt chart module •  "**portal**" – portal module                                                                                                                                    |
| `"ionMetaDependencies"`       | **Dependencies of ion metadata**        | Additional applications to operate the system.                                                                                                                                                                                                       |                                                                                                                                                                                                                                                                                                                                                                                              
| `"dependencies"`   | **Dependencies**      |  Other project dependencies.


### The next page: [Configuration parameters - ini-files](ini_files.md)

--------------------------------------------------------------------------  


 #### [Licence](/LICENSE) &ensp;  [Contact us](https://iondv.com/portal/contacts) &ensp;  [Russian](/docs/ru/2_system_description/platform_configuration/package.md)   &ensp;  
 
 --------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.  
All rights reserved. 