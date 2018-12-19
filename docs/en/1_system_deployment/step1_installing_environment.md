### The previous page: [Content](docs/en/index.md)

# Step 1 Installing the environment

The environment - is a list of programs needed to run a platform:

* DBMS [MongoDb](https://www.mongodb.org/), 3.6 version.
* The runtime environment [Node.js](<https://nodejs.org/en/>), 10.x.x version.

## DBMS

1. Install the DBMS [MongoDB](https://www.mongodb.org/). Verified version -`3.6.9`. 

2. Next create the `data` folder on the C: drive and create a subfolder `db` there.

3. Go to the `MongoDB` folder, then to the `server\bin` folder and run the `mongod.exe` file to run the app. If you need to use the other database folder than `c:\data\db`, then you must run the `mongod.exe` file
with the `--dbpath` parameter, after which you should specify the database path.

## Node.js - the runtime environment

Node.js - is the runtime environment for implementing the components. 

1. Install the runtime environment [Node.js](https://nodejs.org/). Node.JS verified version - `10.14.2`.

2. By default, the installer registers the paths to Node.JS in PATH, and sets the `npm` Package Manager.

## Installing the global dependencies

Install the global dependencies in the command prompt `cmd.exe` run as administrator, after installing the `node.js`.

**NB:** the `node -v` command - indicates the node.js version.

### Installing the build environment on Windows

1. Install globally [node-gyp](<https://github.com/nodejs/node-gyp>) by the `npm install -g node-gyp` command. It is necessary for building the various libraries.

2. For the Windows operating system, it is additionally necessary to install the windows-build-tools package `npm install -g --production windows-build-tools`.

### The project build-tool

Use the [Gulp](http://gulpjs.com/) app to organize testing and building of distributions. Install globally by the `npm install -g gulp@3.9.1` command. `3.9.1` -  supported version of `Gulp`. 

### The installer of frontend dependencies

To install the frontend libraries, you should install [bower](https://bower.io) globally, by the `npm install -g bower` command. 


### The next page: [Step 2 Core, modules and application](docs/en/1_system_deployment/step2_project_with_modules.md)  

--------------------------------------------------------------------------  


 #### [Licence](/LICENCE.md) &ensp;  [Contact us](https://iondv.ru/index.html) &ensp;  [Russian](/docs/ru/1_system_deployment/step1_installing_environment.md)    &ensp; [FAQs](/faqs.md)          



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.  
All rights reserved.  

 