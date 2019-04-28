#### [Content](/docs/en/index.md)

### The previous page: [Meta report](/docs/en/2_system_description/metadata_structure/meta_report/meta_report.md)

# Configuration file - `deploy.json`

**Configuration file - deploy.json** - is a file that describes the structure of the parameters of the software system and its specific configuration.

## Structure of the deploy.json file: 

|   Field        |   Name    | Description      |
|:-------------|:--------|:-------------|
| `"namespace":`   |  **Project name**  | The project namespace.  |
| `"parametrised": true,`| **Parameterization**   | The parameterization settings. Set the "true" value to spesify the parameters to which, the system transfers the variables defined in ini-files or variables of the project environment when building the application.     |
| `"globals": {`     |  [**Global settings**](/docs/en/2_system_description/platform_configuration/deploy_globals.md)  | Global configuration settings.   |
| `"deployer": "built-in"`    | **Builds**   | The built configuration parameter. Currently, it is the only one.  |
| `"modules"`     |  [**Modules settings**](/docs/en/2_system_description/platform_configuration/deploy_modules.md)  | Module configuration settings.  |

## The [full example](/docs/en/2_system_description/platform_configuration/deploy_ex.md) of the "deploy.json" file

### The next page: [Dependencies in package.json](/docs/en/2_system_description/platform_configuration/package.md)

--------------------------------------------------------------------------  


 #### [Licence](/LICENSE) &ensp;  [Contact us](https://iondv.com) &ensp;  [Russian](/docs/ru/2_system_description/platform_configuration/deploy.md)   &ensp; [FAQs](/faqs.md) 
 
 --------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.  
All rights reserved. 