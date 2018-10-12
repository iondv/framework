[System deployment](/docs/en/1_system_deployment/)  
# Step 2 Deploying project with modules
### Previous page: [Step 1 Installing the environment](docs/en/1_system_deployment/step1_installing_environment.md)  
## Deployment guidelines
**Attention**
* no spaces should be in the path
* create the `workspace` folder in the `c: \ workspace` to host the application

### Cloning the application and its components
We are going to consider the deployment of project with modules using the develop-and-test example. The application is in the [gitlab repository](https://git.iondv.ru/dashboard/activity). Type the desired application `develop-and-test` in the search box and click the link.  

![image](/uploads/1b9bf52d24eaf8100cb254adeaebf152/image.png)

Jump to the repository and choose the `develop` branch.

![image](/uploads/c86b66e40ce30345a16b21802db5b00a/image.png)

Open the package.json file to see all the dependencies.

![image](/uploads/d260a01594567e6f03b89f77f6089f65/image.png)  

1. `engines": "ion": 1.8.49` - core version `1.8.49`.
2. `ionModulesDependencies` - list of modules and its versions. 
3. `ionMetaDependencies` - list of other metadata necessary for the project, the only exception is `viewlib` -  View Library.

#### Cloning the core repository  
The core is located in the [`platform`](https://git.iondv.ru/ION/platform) repository. On the main page, in the box you will see the path of the git repository.  

![image](/uploads/f1f838515b040d2a51b933381b320bc1/image.png)

Copy this address, open the command line and in the `workspace` folder (`cd c:\workspace` command) write the `git clone https://git.iondv.ru/ION/platform.git` command. This command creates the `platfform` folder. Сlone the repository in this folder. If you have several applications, it is recommanded to clone in the destination folder of your app, in this case the `dnt` folder. Considering all information above, the repository clonning command will be - `git clone https://git.iondv.ru/ION/platform.git dnt`.


![image](/uploads/d98115b31f107d56f2e6252cec7792f4/image.png)

When cloning, the system will request a GitLab account.  
Write the `dir` command (list of derictories) to verify the folder. Further, write the `cd dnt` command to open the created folder.

> NB! When typing the `cd d` command If you'll click `Tab` the system  will automatically continue the name that starts with `d`. It is really convenient when working with long names. If you click `Tab` several times, the system will continue to substitute the corresponding names from the list of directories or files.

#### Cloning the modules
Open the folder with modules by using the `cd modules` command. For each modules from the package.json list in the `ionModulesDependencies` characteristic - find the module repository [here](https://git.iondv.ru/ION-MODULES) and clone it. For example, the path for the registry module will be - `git clone https://git.iondv.ru/ION-MODULES/registry.git`. Do not modify the destination folder. Repeat for all modules. 

![image](/uploads/ad26180dc09ba123b5595ce04d853492/image.png)

#### Cloning the application
Open the application folder. If you're in the module folder just write the `cd ..\applications` command (you can write `cd ..\a` and click `Tab`).  
Return to our `develop-and-test` model in the repository description page, copy the path to the repository and clone it `git clone https://git.iondv.ru/ION-APP/develop-and-test.git`. Do not modify the destination folder.  
If there are any dependencies in `ionMetaDependencies` - find them in the gitlab and clone these repositories in the `applications` folder, in particular, clone `viewlib` (located [here](https://git.iondv.ru/ION-METADATA/viewlib)), using the `git clone https://git.iondv.ru/ION-METADATA/viewlib.git` command.

![image](/uploads/7f01a3c9ff89d8f4d7b5b162194e5a03/image.png)

Our application is ready for building. It is recommended to create a project in IDE, e.g. Visual Studio Code and there create a configuration file.  


## Configuration file
The configuration file is used to set the basic parameters of the application environment and configure advanced parameters to run a platform.  
You can create a configuration file by right-clicking in the `config` folder and choose `create text document ` - do not forget to change the   file name extension from text to **ini**. The full path will be - `c:\workspace\dnt\config\setup.ini`.  

![image](/uploads/85aceca6619de495c1b6dbfd1edafc40/image.png)

Open the file and paste the content below. The most important parameter is `db.uri=mongodb://127.0.0.1:27017/ion-dnt`. It shows the the DB name which we are going to use for our application. The DB will be created automatically.  

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
The example of the `setup.ini` file (located in the `platform\config` file) requires to delete all comments, starting with `//` symbols.

### Next page: [Step 3 Building and running](/docs/en/1_system_deployment/step3_building_and_running.md)

--------------------------------------------------------------------------  


 #### [Licence](platform/licence.md)&ensp;  [Contact us](https://iondv.ru/index.html) &ensp;  [RUS](/docs/ru/1_system_deployment/step2_project_with_modules.md)   &ensp; [FAQs](/faqs.md)          



--------------------------------------------------------------------------  

 Copyright (c) **IONDV**. All rights reserved. 
