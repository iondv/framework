[1_System deployment](/docs/en/1_system_deployment/)
# Installing the desktop environment
### The previous page: [Contents](docs/en/index.md)  

The environment is a list of programs needed to run a platform:  
* DBMS
* node.JS with libraries
* node Global Libraries  

## DBMS
You need to install DBMS [MongoDB](https://www.mongodb.org/). Version [3.6]. 

![image](/uploads/99b07b8afaace3465f4c60446e9704ca/image.png)

Next, create a folder `data` on the C: drive and create a subfolder `db` there.

![image](/uploads/51236d63714a6da80eb8cb87646fb633/image.png)

Go to the mongoDB folder, then to the `server\bin` folder and run the `mongod.exe` file to run the app

![image](/uploads/a406c381a4d3eaceb91ee489b01b21e4/image.png)

If you need to use the other database folder than `c:\data\db`, then you must run the `mongod.exe` file
with the `--dbpath` parameter, after which you should specify the database path

Usually, there is nothing more you need to do, but if necessary, see the setup of MongoDB. 

## The runtime of node.js
Node.js - is the runtime environment for implementing the components. The link to download 
[node.js](https://nodejs.org/). The current version node.JS is `8.xx.xx LTS`.

By default, the installer registers the paths to Node.JS in PATH, and sets the `npm` Package Manager.

![image](/uploads/e7b999db3036b531316c11dbea1fc81f/image.png)

## Installing the Global Libraries
All installations should be done on an admin-level from a command prompt, AFTER installation of node.js. Press the `windows + s` combination to open the search bar. In the popup window, type cmd.exe and in a list box, choose the "command prompt" with a right mouse-click. Select "Run as administrator".

![image](/uploads/7454ebc549bf684fe0eb3cbaa2299194/image.png)

Check if the node is available, by running the `node -v` command and as a result you will see the node.js version.

![image](/uploads/0700d79fc60fbd9c15f4b8c696c56585/image.png)

Further, the command like `node -v` will indicate the execution of the `node` command with the `-v` parameter in the command prompt. It is recommended  to learn more  about the `command prompt in Windows` (Yandex and Google), for example https://studfiles.net/preview/1926314/

To accelerate the work, you can copy the commands to the clipboard (Ctrl + C) and paste into the command prompt (right mouse-click or Ctrl+V).

The installation is successful, if no errors appear, i.e. the red message `Error`. If the error appears, please ask your colleagues for help - not closing the window with errors.

### The installation of the build environment on Windows
You can find the full instruction on the [node-gyp page](https://github.com/tootallnate/node-gyp), which is used for building and compiling of code. Generally, it is enough to install the 
`npm install -g --production windows-build-tools`

### The node-gyp module build-tool for node.js
The [node-gyp](https://github.com/tootallnate/node-gyp) module and all its environment are necessary for building the various libraries. 

Use the `npm install -g node-gyp` command to install.

### The project build-tool
When developing, we use the [Gulp](http://gulpjs.com/) app to organize testing and building of distributions. Therefore, you need to install the app, by using the `npm install -g gulp` command.

### The installer of frontend dependencies
To install the frontend libraries, you should install [bower](https://bower.io) globally, using the `npm install -g bower` command. 

### The following page: [forming the project with modules](docs/en/1_system_deployment/step2_project_with_modules.md)

--------------------------------------------------------------------------  


 #### [Licence](/LICENCE.md) &ensp;  [Contact us](https://iondv.ru/index.html) &ensp;  [Russian](/docs/ru/1_system_deployment/step1_installing_environment.md)   &ensp; [FAQs](/faqs.md)          




--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.  
All rights reserved.    
