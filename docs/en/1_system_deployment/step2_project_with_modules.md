#### [Content](/docs/en/index.md)

### The previous page: [Step 1 Installing the environment](docs/en/1_system_deployment/step1_installing_environment.md)

# Step 2 Core, modules and application

## Cloning the application and its components

**NB:** no spaces should be in the path. We recommend you to host the app in the  `c:\workspace`.

We are going to use the `develop-and-test` application as an example.

1. Find the application in the github repository. Type the name of the app - `develop-and-test` in the search box and click the link. 

2. Go to the file repository on the version branch.

3. Open the `package.json` file to check all the dependencies.

```
  "engines": {
    "ion": "1.24.1"
  },
  "ionModulesDependencies": {
    "registry": "1.27.1",
    "geomap": "1.5.0",
    "graph": "1.3.2",
    "portal": "1.3.0",
    "report": "1.9.2",
    "ionadmin": "1.4.0",
    "dashboard": "1.1.0",
    "lk": "1.0.1",
    "soap": "1.1.2",
    "gantt-chart": "0.8.0"
  },
  "ionMetaDependencies": {
    "viewlib": "0.9.1"
    "viewlib-extra": "0.1.0"
```

1. `engines": "ion": 1.24.1` - core version `1.24.1`.  

2. `ionModulesDependencies` - list of modules and its versions.  

3. `ionMetaDependencies` - list of other metadata necessary for the project, the only exception is `viewlib` -  View Library.

**NB:** check the version in the  `package.json` file to switch the tag of the version number.

### Cloning the core 

The core is located in the [`framework`](https://github.com/iondv/framework) repository. On the main page, in the box you will see the path of the git repository.  

1. Run the command prompt as an administrator. 

2. Copy the adress of the repository, go to the workspace folder by the `cd c:\workspace` command and then clone the repository - `git clone https://github.com/iondv/framework`. This command creates the `framework` folder and clones the repository in it. 

### Cloning the modules

1. Go to the module folder by the `cd framework\modules` command. 

2. For each modules from the `package.json` file in the `ionModulesDependencies` property - find the module repository ` https://github.com/iondv/ION-MODULES`.

3. Clone all modules from the `ionModulesDependencies` list - `git clone https://github.com/iondv/registry`.

4. Go to the folder of the cloned module, and switch the tag of the version number `git checkout tags/v1.27.1`. For example `1.27.1` - is the version number of the `registry` module. 

5. Repeat for all modules. 

### Cloning the application

1. Go to the application folder. If you're in the module folder just write the `cd ..\applications` command.

2. Return to the `develop-and-test` repository, copy the path and clone the repository -
`git clone https://github.com/iondv/develop-and-test`. 

3. Go to the folder of the cloned application, and switch the tag of the version number `git checkout tags/v1.17.0`.

4. Istall the dependencies from the `ionMetaDependencies` list in the `applications` folder,  please make sure that you are inside the application folder. Clone the applications from the `ionModulesDependencies` property. For the `viewlib` application - `git clone https://github.com/iondv/viewlib`.  

5. Go to the folder of the cloned application, and switch the tag of the version number `git checkout tags/v0.9.1`. Repeat for all modules.

6. The application is assembled. 

**NB:** we recommend you to create a project in IDE, e.g. Visual Studio Code and there create a configuration file.    

## Configuration file

The configuration file is used to set the main parameters of the application environment.

1. Crate the configuration file `setup` with the `ini` file extension in the `config` folder. 

2. Open the file and paste the following:

```
auth.denyTop=false 
auth.registration=false 
auth.exclude[]=/files/**
auth.exclude[]=/images/**
db.uri=mongodb://127.0.0.1:27017/db
db.user=username
db.pwd=password
server.ports[]=8888
server.ports[]=8889
server.ports[]=3000
module.default=registry
module.skip[]=offline-sync
fs.storageRoot=./files
fs.urlBase=/files

```

The most important parameter is `db.uri=mongodb://127.0.0.1:27017/ion-dnt`. It indicates the the DB name used for the application. The DB will be created automatically.  

### Example of the `setup.ini` file with comments

```
auth.denyTop=false // - true if platform-level authentication is not needed, and each module will authenticate itself
auth.registration=false // if registration is not required

// Exceptions to security access checks
auth.exclude[]=/files/**
auth.exclude[]=/images/**

db.uri=mongodb://127.0.0.1:27017/db // DB URI connection
db.user=username // DB user
db.pwd=password // DB user password

// running the system on these ports
server.ports[]=8888
server.ports[]=8889
server.ports[]=3000

module.default=registry // modules by default

module.skip[]=offline-sync // disabled modules

// file storage settings
fs.storageRoot=./files // root directory of the file storage
fs.urlBase=/files // base for publishing files in http (base of URL files)
```
The example of the `setup.ini` file requires to delete all comments, starting with `//` symbols.

### The next page: [Step 3 Build, deploy and start of the application](/docs/en/1_system_deployment/step3_building_and_running.md)

--------------------------------------------------------------------------  


 #### [Licence](/LICENCE.md) &ensp;  [Contact us](https://iondv.ru/index.html) &ensp;  [Russian](/docs/ru/1_system_deployment/step2_project_with_modules.md)   &ensp; [FAQs](/faqs.md)   <div><img src="https://mc.iondv.com/watch/local/docs/framework" style="position:absolute; left:-9999px;" height=1 width=1 alt="iondv metrics"></div>       



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.  
All rights reserved.  




