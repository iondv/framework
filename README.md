<h1 align="center"> <a href="https://www.iondv.com/"><img src="/docs/en/images/ION_logo_black_mini.png" alt="IONDV. Framework logo" width="600" align="center"></a>
</h1>  

<h4 align="center">JS framework for rapid business application development</h4>
  
<p align="center">
<a href="http://www.apache.org/licenses/LICENSE-2.0"><img src="https://img.shields.io/badge/license-Apache%20License%202.0-blue.svg?style=flat" alt="license" title=""></a>
</p>

<div align="center">
  <h3>
    <a href="https://www.iondv.com/" target="_blank">
      Website
    </a>
    <span> | </span>
    <a href="https://www.iondv.com/portal/get-it" target="_blank">
      Get it Free
    </a>
    <span> | </span>
    <a href="https://github.com/iondv/framework/docs/en/index.md" target="_blank">
      Documentation
    </a>
  </h3>
</div>

<p align="center">
<a href="https://twitter.com/ion_dv" target="_blank"><img src="/docs/en/images/twitter.png" height="36px" alt="" title=""></a>
<a href="https://www.facebook.com/iondv/" target="_blank"><img src="/docs/en/images/facebook.png" height="36px" margin-left="20px" alt="" title=""></a>
<a href="https://www.linkedin.com/company/iondv/" target="_blank"><img src="/docs/en/images/linkedin.png" height="36px" margin-left="20px" alt="" title=""></a>
<a href="https://www.instagram.com/iondv/" target="_blank"><img src="/docs/en/images/Insta.png" height="36px" margin-left="20px" alt="" title=""></a> 
</p>
 

Эта страница на [Русском](/docs/ru/readme.md)

<h1 align="center"> <a href="https://www.iondv.com/"><img src="/docs/ru/images/iondv_readme1.png" height="800px" alt="IONDV. Framework in numbers: rest api, soap, json, yaml, JavaScript - free open source web business application development" align="center"></a>
</h1>  

# IONDV. Framework 

IONDV. Framework - is a node.js open source framework for developing accounting applications
or microservices based on metadata and individual modules. Framework is a part of 
instrumental digital platform to create enterprise 
(ERP) apps. This platform consists of the following open-source components: the [IONDV. Framework](https://github.com/iondv/framework), the
[modules](https://github.com/topics/iondv-module) and ready-made applications expanding its
functionality, as well as the [Studio](https://github.com/iondv/studio) [open source](https://github.com/iondv/studio) visual development environment to create metadata for the app. The UML-scheme modeled applications can be launched in [80 seconds](https://youtu.be/s7q9_YXkeEo).


## Description  

**IONDV. Framework** — is a tool for creating high-level web applications based on metadata. You can change the system by adding the additional components to change functionality. There are ready-made modules, but nothing limits you to create new ones to personalize the application. Moreover, it's a low-code framework.

The main purpose is the implementation of complex data registry systems. The functional base is the data registry - the Registry module. This is a key module designed specifically to work with data based on metadata structures - including the management of projects, programs, activities, etc.

The Framework is suitaible for creating systems for big data accumulation and processing and for artificial intelligence. A special module [Artificial Intelligence Bus](https://github.com/iondv/aib) and demonstration applications, such as [TensorFlow models](https://github.com/iondv/tensorflow-dataset) data markup and training, are being developed for these purposes.

**IONDV. Framework** is an open source software in JavaScript with open metadata structure in human-readable JSON files.

## How to design an application?

**What?**
Business application of any class.

**How?**
Describe the data and apply ready-made modules that you can adjust for specific tasks.

`core + metadata + modules = application`

<h1 align="center"> <a href="https://www.iondv.com/"><img src="/docs/ru/images/app_structure1.png" height="500px" alt="Application structure - core, metadata, modules" align="center"></a>
</h1>  

In the square frames  - *ioncore*, *meta class*, *meta view*, *meta navigation* и *registry module* - are the base of the simplest application. Below are additional types of meta and modules. They represent additional functionality and could be applied in accordance with the application. Look for the application dependencies in the `package.json` file.

### Typical applications

We give you a frame for creating applications in JavaScript, both enterprise level and highly functional - from the portal to analytics:

- Document Management;
- Accounting and Reporting;
- Enterprise Resource Management;
- Workflow Management and Project Activities;
- Data Capture;
- Business Analytics;
- System Integration.

### Free Demos

For now, we have three demos to show you:

* [Studio](https://studio.iondv.com/index) - is an IONDV. Framework specialized IDE that helps you to speed and simplify the development of applications on the IONDV. [GitHub Repo](https://github.com/iondv/studio/tree/master/tutorial/en/index.md). [Tutorial "How to create an app in IONDV. Studio"](https://github.com/iondv/nutrition-tickets/blob/master/tutorial/en/index.md)
* [DNT](https://dnt.iondv.com/auth) - is our application for development and testing, on the basis of which new meta components are implemented and tested. So almost all elements of the system are in the DNT app.[GitHub Repo](github.com/iondv/develop-and-test).
* [War Archive](https://war-archive.iondv.com/portal/index) - is the IONDV. Framework web-application designed to store, group and demonstrate the data based on archival documents about Great Patriotic War (World War II). [GitHub Repo](https://github.com/iondv/war-archive).
* [Project Management](https://pm-gov-ru.iondv.com) - is a web enterprise application based on IONDV. Framework. Project management system allows you to organize project activities: to monitor the results, to comply with and reduce the deadlines, to use effectively temporary, human and financial resources, making timely and informed management decisions. [GitHub Repo](https://github.com/iondv/pm-gov-ru)
* [Telecom](https://telecom-ru.iondv.com) - is a web application based on IONDV. Framework. It is used as a registry to account, store, and present the data on the
availability of communication services (Internet, mobile communications, television, mail, etc.) in populated areas of the region. [GitHub Repo](https://github.com/iondv/telecom-ru)
* CRM - *coming soon on GitHub*.

The login for access is - demo and the password is - ion-demo. No registration required.

## Top features  

**IONDV. Framework** provides the following functionality:

- descriptive metadata into the data storage structure in the DBMS;
- functionality to work with various DBMS (ORM technology);
- authorization in a system with different policies, by default oath2, with an open, configurable API for connecting passport library authorization modules which provides up to 500 different authorization policies;
- securing access to data - static securing to data types, to navigation, to stages of business processes, to actions on a form; dynamic securing- through the conditions in the data that the profile of the current user must correspond to (belonging to the unit or organization specified in the object, group or other conditions); through url; providing exceptions in authorization and security by url or for a special user;
- connection of modules providing additional functionality and implemented through access to the kernel interfaces (APIs);
- providing import, export of data in the system, metadata, security from files;
- providing interaction with the file system for storing data, including external file storages, such as nextcloud;
- calculating values with formulas and caching this data;
- providing eager loading and data filtering in connected collections;
- caching requests and sessions in memcached, redis;
- scheduled tasks;
- notification of users by events.

You can find out [more](/docs/en/key_features.md) about the functionality of the framework and its modules.

## Quick start 

You can get access to the already built applications deployed on Cloud servers or explore the different ways on the [IONDV.Framework site](https://iondv.com), for example:  
* gitclone with this repository
* installer for linux operating system
* docker-container with the already built application
* archive with the already built application

### Software requirements

Install [Node.js](<https://nodejs.org/en/>) runtime and npm package manager to run the IONDV.Framework. Version 10.x.x.   

Install and run the [MongoDB](https://www.mongodb.org/) DBMS to store the data. Version 3.6.  

### Installer

You can use IONDV. Framework apps installer, requiring installed node.js, mongodb and git. During the installation, all other dependencies will be checked and installed, and the application itself will be built and run.

Install in one command:

```
bash <(curl -sL https://raw.githubusercontent.com/iondv/iondv-app/master/iondv-app) -q -i -m localhost:27017 develop-and-test
```
Where  `localhost: 27017` is the MongoDB address, and `develop-and-test` is the app name.

Also the other way is to clone - (`git clone https://github.com/iondv/iondv-app.git`) and install the app by using the `bash iondv-app -m localhost:27017 develop-and-test` command.

<details>
  <summary> 
    <h3> 
      Gitclone with repository
    </h3> 
  </summary>
  
### Global dependencies

To build all components and libraries, you need to install the following components globally:

* package [node-gyp](<https://github.com/nodejs/node-gyp>) `npm install -g node-gyp`. For the Windows operating system, it is additionally necessary to install the windows-build-tools package `npm install -g --production windows-build-tools`
* [Gulp](<http://gulpjs.com/>) installation package `npm install -g gulp@4.0`. `4.0` - supported version of `Gulp`
* package manager of frontend libraries [Bower](<https://bower.io>) `npm install -g bower`

  
### Core, modules and application

The [IONDV. Develop-and-test](https://github.com/iondv/develop-and-test) is an example application.

The dependencies are listed in the [`package.json`](https://github.com/iondv/develop-and-test/blob/master/package.json) file.

```
  "engines": {
    "ion": "3.0.0"
  },
  "ionModulesDependencies": {
    "registry": "3.0.0",
    "geomap": "1.5.0",
    "portal": "1.4.0",
    "report": "2.0.0",
    "ionadmin": "2.0.0",
    "dashboard": "1.1.0",
    "soap": "1.1.2"
  },
  "ionMetaDependencies": {
    "viewlib": "0.9.1"
  }
```
* Install the core, its version is specified in the `engines": "ion": 3.0.0` parameter. Copy the URL of the core repository
 and execute the command `git clone https://github.com/iondv/framework.git dnt`, where `dnt` is a application name, for 
 example full path is `/workspace/dnt'. Go to 
 the core folder and switch the tag of  the version number `git checkout tags/3.0.0`.
* Further, install the modules listed in the `ionModulesDependencies` parameter. Navigate to the module folder executing 
the `cd modules` command. Clone modules from the `ionModulesDependencies` list, for the registry module the command is 
`git clone https://github.com/iondv/registry.git`. Go to the folder of the installed module and switch the tag of the 
version number `git checkout tags/3.0.0`. Repeat for each module.  
* To install the application, go to the application folder executing the `cd ..\applications` command, if you're in the module folder. 
Clone the path to repository by `git clone https://github.com/iondv/develop-and-test.git`command. Go to the folder of 
installed application and switch the tag of the version number `git checkout tags/2.0.0`. 
* Finally, install all necessary applications listed in the `ionMetaDependencies` parameter in the `applications` folder. 
Make sure that you're inside this folder. Clone the dependencies in `ionMetaDependencies`, in particularly ` viewlib` - 
a additional application - library of views templates. Execute the `git clone https://github.com/iondv/viewlib.git` to 
clone to the `applications` folder. Go to the folder of installed application and switch to the tag of the version 
number `git checkout tags/0.9.1`. Repeat for each application. 
 
#### Building, configuring and deploying the application

Building the application provides installation of all dependent libraries, importing data into the database and preparing 
the application for launch.  

Create the configuration file `setup.ini` in the `/config` folder of the core to set the main parameters of the 
application environment.  

```
auth.denyTop=false 
auth.registration=false 
auth.exclude[]=/files/**
auth.exclude[]=/images/**
db.uri=mongodb://127.0.0.1:27017/iondv-dnt-db
server.ports[]=8888
module.default=registry
fs.storageRoot=./files
fs.urlBase=/files
```

Open the file and paste the text above. The main parameter is `db.uri=mongodb://127.0.0.1:27017/iondv-dnt-db`. It shows the 
base name that we use for the application. The DB will be created automatically. 

Set the `NODE_PATH` environment variable which is equal to the path of the application core. For Windows the command 
is `set NODE_PATH=c:\workspace\dnt`, for Linux - `export NODE_PATH=/workspace/dnt`, where `/workspace/dnt` is the directory of 
the application.   

The `npm install` installs all key dependencies, including locally the `gulp` build-tool. Please make sure that the Gulp 
version - is `4.0`. 

Further, execute the `gulp assemble` command to build and deploy the application.

If you want to import data into your project, check the demo data in the `data` folder of the application and run the command:
`node bin/import-data --src ./applications/develop-and-test --ns develop-and-test`

Add the admin user with the 123 password executing the `node bin/adduser.js --name admin --pwd 123` command. 

Add admin rights to the user executing the `node bin/acl.js --u admin@local --role admin --p full` command.

#### Running

Run the app, executing the `npm start` or `node bin/www` command. 

Open this link `http://localhost:8888` in a browser and log in. `8888` —  is a port in the `server.ports` parameter.
 </details>


### Docker
Follow these steps to deploy docker container on the example of the `develop-and-test` application:

1. Run mongodb DBMS: `docker run --name mongodb -v mongodb_data:/data/db -p 27017:27017 -d mongo`
2. Run IONDV. develop-and-test `docker run -d -p 80:8888 --link mongodb iondv/dnt`.
3. Open the `http://localhost` link in the browser in a minute (it takes time to initialize the data). For back office login: **demo**, password: **ion-demo**


## Documentation 

The IONDV.Framework documentation is available in two languages —  [english](/docs/en/index.md) and [russian](/docs/ru/index.md).  

## Links

Some handy links to learn more information on developing applications using IONDV.Framework.
* [User manual](/docs/en/manuals/user_manual.md)
* [Developer manual](/docs/en/manuals/dev_manual.md)
* [Homepage](<https://iondv.com/>)  
* Questions on [stack overflow](https://stackoverflow.com/questions/tagged/iondv)


--------------------------------------------------------------------------  


#### [Licence](/LICENCE) &ensp;  [Contact us](https://iondv.com/portal/contacts) &ensp;  [Russian](/docs/ru/readme.md)   &ensp;           
<div><img src="https://mc.iondv.com/watch/github/docs/framework" style="position:absolute; left:-9999px;" height=1 width=1 alt="iondv metrics"></div>


--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.  
All rights reserved.  
