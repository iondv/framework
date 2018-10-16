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

* package [node-gyp] (<https://github.com/nodejs/node-gyp>) `npm install -g node-gyp`. For the Windows operating system, it is additionally necessary to install the windows-build-tools package `npm install -g --production windows-build-tools`
* [Gulp] installation package (<http://gulpjs.com/>) `npm install -g gulp`
* package manager of frontend libraries [Bower] (<https://bower.io>) `npm install -g bower`

### Core, modules and application
Dependencies are listed in the `package.json` file.
* `engines": "ion": 1.8.49` - core
* `ionModulesDependencies` - modules
* `ionMetaDependencies` - metadata

You need to clone the app and its components. You clone the core repository and modules. Also clone the dependencies in `ionMetaDependencies`, in particular` viewlib` - a library of views. Now, you can deploy the app with modules.
### Building, configuring and deploying the application
Create the configuration file `setup.ini` to set the main parameters of the application environment.  

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
Set the `NODE_PATH` environment variable. The `npm install` command installs the key dependencies. Further, write the `gulp assemble` command to build the app.
### Running
Add a new user in `Mongo Compass` and run the app, using the `npm start` command.
## Documentation 
The IONDV.Framework documentation is available in two languages - [english](/docs/en/index.md) and [russian](/docs/ru/index.md).  

## Links
Some handy links to learn more information on developing applications using IONDV.Framework.
* [User manual](/docs/en/manuals/user_manual.md)
* [Developer manual](/docs/en/manuals/dev_manual.md)
* [Homepage](<https://iondv.com/>)  
* Questions on [stack overflow](https://stackoverflow.com/search?q=iondv)


--------------------------------------------------------------------------  


 #### [Licence](LICENCE.md)&ensp;  [Contact us](https://iondv.ru/index.html) &ensp;  [Russian](/docs/ru/readme.md)   &ensp; [FAQs](/faqs.md)          



--------------------------------------------------------------------------  

Copyright © 2018 **IONDV.Framework**.  
All rights reserved.  

