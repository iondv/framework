# IONDV. Framework 
![logoIONdv](/docs/en/images/iondv_logo.png)

Эта страница на [Русском](/docs/ru/readme.md) 

## Description  

**IONDV.Framework** - is a low-code framework for creating high-level web applications based on metadata. Moreover, the framework allows you to change functionality with the additional components, such as ready-made modules or your new ones. 

**Typical applications**:

* project management system;
* accounting and data processing registries based on workflows;
* CRM.  

The main advantages of IONDV.Framework are open source software in JavaScript and open metadata structure in human-readable JSON files.

## Functionality  

* creation of arbitrary multi-user systems of data recording
* allocation of access and data security
* data management based on workflows
* generation of reports and analytics
* ability to visualize data on geolayer
* possibility of arbitrary data display in portal forms
* easy data integration with REST and SOAP 

## Quick start with the repository (TODO: now in development)

You can get access to the already built applications deployed on Cloud servers or explore the different ways on the [IONDV.Framework site](https://iondv.com), for example:  
* installer for windows operating system
* archive with the already built application
* docker-container with the already built application

### System environment

Install [Node.js](<https://nodejs.org/en/>) runtime and npm package manager to run the IONDV.Framework. Version 10.x.x.   

Install and run the [MongoDB](https://www.mongodb.org/) DBMS to store the data. Version 3.6.  

### Global dependencies

To build all components and libraries, you need to install the following components globally:

* package [node-gyp](<https://github.com/nodejs/node-gyp>) `npm install -g node-gyp`. For the Windows operating system, it is additionally necessary to install the windows-build-tools package `npm install -g --production windows-build-tools`
* [Gulp](<http://gulpjs.com/>) installation package `npm install -g gulp@3.9.1`. `3.9.1` - supported version of `Gulp`
* package manager of frontend libraries [Bower](<https://bower.io>) `npm install -g bower`

### Core, modules and application

The develop-and-test is an example application. Find the application in the repository https://github.com/iondv/dnt_en.

The dependencies are listed in the `package.json` file.

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
* Install the core, Its version is specified in the `engines": "ion": 1.24.1` parameter. Copy the URL of the core repository and execute the command `git clone https://github.com/iondv/framework`. Go to the core folder and switch the tag of the version number `git checkout tags/1.24.1`.
* Further, install the modules listed in the `ionModulesDependencies` parameter. Navigate to the module folder executing the `cd modules` command. Clone modules from the ` ionModulesDependencies` list, for the registry module the command is `git clone https://github.com/iondv/registry`. Go to the folder of the installed module and switch the tag of the version number `git checkout tags/1.27.1`. Repeat for each module.  
* To install the application, go to the application folder executing the `cd ..\applications` command, if you're in the module folder. 
Clone the path to repository by `git clone https://github.com/iondv/dnt_en`command. Go to the folder of installed application and switch the tag of the version number `git checkout tags/1.17.0`. 
* Finally, install all necessary applications listed in the `ionMetaDependencies` parameter in the `applications` folder. Make sure that you're inside this folder. Clone the dependencies in `ionMetaDependencies`, in particularly ` viewlib` - a library of views. Execute the `git clone https://github.com/iondv/viewlib` to clone to the `applications` folder. Go to the folder of installed application and switch to the tag of the version number `git checkout tags/0.9.1`. Repeat for each application. 
 
### Building, configuring and deploying the application

Building the application provides installation of all depended libraries, importing data into the database and preparing the application for launch.  

Create the configuration file `setup.ini` in the `config` folder of the core to set the main parameters of the application environment.  

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
Open the file and paste the text above. The main parameter is `db.uri=mongodb://127.0.0.1:27017/ion-dnt`. It shows the base name that we use for the application. The DB will be created automatically. 

Set the `NODE_PATH` environment variable which is equal to the path of the application core. For Windows the command is `set NODE_PATH=c:\workspace\dnt`, for Linux - `export NODE_PATH=/workspace/dnt`. `workspace` is the directory of the appliction.   

The `npm install` installs all key dependencies, including locally the `gulp` build-tool. Please make sure that the Gulp version - is `3.9.1`. 

Import the application meta with the command - `node bin\import --src C:\workspace\framework\applications\dnt_en --ns develop-and-test`.

Further, execute the `gulp assemble` command to build the application.

Add the admin user with the 123 password executing the `node bin\adduser.js --name admin --pwd 123` command. 

Add admin rights to the user executing the `node bin\acl.js --u admin@local --role admin --p full` command.

### Running

Run the app, executing the `npm start` command. 

Open this link `http://localhost:8888` in a browser and log in. `8888` —  is a port in the `server.ports` parameter.

## Documentation 

The IONDV.Framework documentation is available in two languages —  [english](/docs/en/index.md) and [russian](/docs/ru/index.md).  

## Links

Some handy links to learn more information on developing applications using IONDV.Framework.
* [User manual](/docs/en/manuals/user_manual.md)
* [Developer manual](/docs/en/manuals/dev_manual.md)
* [Homepage](<https://iondv.com/>)  
* Questions on [stack overflow](https://stackoverflow.com/questions/tagged/iondv)


--------------------------------------------------------------------------  


 #### [Licence](/LICENCE.md) &ensp;  [Contact us](https://iondv.ru/index.html) &ensp;  [Russian](/docs/ru/readme.md)   &ensp; [FAQs](/faqs.md)          



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.  
All rights reserved.  

