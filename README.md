# IONDV. Framework 
![logoIONdv](https://jobfilter.ru/uploaded_files/images/2017/01/24/159101/sm_U5eOsz95kjNWf_I7.png)

Эта страница на [Русском](/docs/ru/readme.md) 
## Description  
IONDV.Framework - is a low-code framework for creating high-level web applications based on metadata. Moreover, the framework allows to change functionality with the additional components, suck as modules or writing your own. Typical applications:
* project management system;
* accounting and data processing registers based on workflows;
* CRM.
The main advantages of IONDV.Framework are open source software in Java Script and open structure of metadata in human-readable JSON files.

## Functionality  

* creation of arbitrary multi-user system of data recording
* allocation of access and data security
* data management based on workflows
* generation of reports and analytics
* ability to visualize data on geolayer
* possibility of arbitrary presentation of data in portal forms
* easy data integration with REST and SOAP 

## Quick start with the repository
You can get an access to the already built applications deployed on cloud or explore the different ways on the [IONDV.Framework site](https://iondv.com), for example:  
* installer for windows operating system
* archive with the built application
* docker-container with the built application

### System environment

Install [Node.js](<https://nodejs.org/en/>) runtime and npm package manager to run the IONDV.Framework. Version 8.x.   

Install and run the [MongoDB](https://www.mongodb.org/) DBMS to store the data. Verified version [3.4].  

### Global dependencies

To build all components and libraries you need to install globally the following components:

* package [node-gyp](<https://github.com/nodejs/node-gyp>) `npm install -g node-gyp`. For the Windows operating system, it is additionally necessary to install the windows-build-tools package `npm install -g --production windows-build-tools`
* [Gulp](<http://gulpjs.com/>) installation package `npm install -g gulp`
* package manager of frontend libraries [Bower](<https://bower.io>) `npm install -g bower`

### Core, modules and application
Consider the example of the `develop-and-test` application. Find the application in the repository.

The dependencies are listed in the `package.json` file.

```
 "engines": {
    "ion": "1.15.0"
  },
  "ionModulesDependencies": {
    "registry": "1.20.6",
    "geomap": "1.3.7",
    "graph": "1.3.2",
    "portal": "1.3.0",
    "report": "1.6.0",
    "ionadmin": "1.2.14",
    "dashboard": "1.1.0",
    "lk": "1.0.1",
    "soap": "1.0.12",
    "gantt-chart": "0.3.2"
  },
  "ionMetaDependencies": {
    "viewlib": "0.7.1"
```
* Install the core, the version is specified in the `engines": "ion": 1.8.49` parameter. Copy the the URL of the core repository and execute the `git clone https://[адрес репозитория]/platform.git` in the command line.
* `ionModulesDependencies` - the module parameter. Consider the example of the key module - registry. Navigate to the module folder executing the `cd modules` command. Clone modules from the ` ionModulesDependencies` list executing the `git clone https://[адрес репозитория]/registry.git` command. Repeat for each module.  
* If you're still in the module folder, execute the `cd ..\applications` command to go to the application folder. 
Clone the path to repository by `git clone https://[адрес репозитория]/develop-and-test.git`command.  

Also clone the dependencies in `ionMetaDependencies`, in particularly ` viewlib` - a library of views. Execute the `git clone https://[адрес репозитория]/viewlib.git` to clone to the `applications` folder.   
 
### Building, configuring and deploying the application
Building the application provides installation of all libraries, importing data into the database and preparing the application for launch.  

Create the configuration file `setup.ini` in the  `dnt\config` folder to set the main parameters of the application environment.  

```
auth.denyTop=false
auth.registration=false
auth.sessionLifeTime=30m
db.uri=mongodb://127.0.0.1:27017/ion-dnt
db.user=
db.pwd=
server.ports[]=8888
server.ports[]=8889
server.ports[]=3000
module.default=registry
fs.storageRoot=./files
fs.urlBase=/files
jobs.enabled=true

```
Open the file and paste the text above. The main parameter is `db.uri=mongodb://127.0.0.1:27017/ion-dnt`. It shows the base name that we use for the application. The DB will be created automatically. 

Set the `NODE_PATH` environment variable which is equal to the application path. For Windows the command is `set NODE_PATH=c:\workspace\dnt`, for Linux - `export NODE_PATH=/workspace/dnt`. `workspace` is the app directory.   

The `npm install` command installs the key dependencies. Further, write the `gulp assemble` command to build the app.
### Running
Add a new user in `Mongo Compass` and run the app, executing the `npm start` command.
## Documentation 
The IONDV.Framework documentation is available in two languages - [english](/docs/en/index.md) and [russian](/docs/ru/index.md).  

## Links
Some handy links to learn more information on developing applications using IONDV.Framework.
* [User manual](/docs/en/manuals/user_manual.md)
* [Developer manual](/docs/en/manuals/dev_manual.md)
* [Homepage](<https://iondv.com/>)  
* Questions on [stack overflow](https://stackoverflow.com/search?q=iondv)


--------------------------------------------------------------------------  


 #### [Licence](/LICENCE.md) &ensp;  [Contact us](https://iondv.ru/index.html) &ensp;  [Russian](/docs/ru/readme.md)   &ensp; [FAQs](/faqs.md)          



--------------------------------------------------------------------------  

Copyright (c) 2018 **IONDV LLC**.  
All rights reserved.  

