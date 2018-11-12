[System deployment ](/docs/ru/1_system_deployment/)  
# Step 3 Building and running
### Previous page: [Step 2 Deploying project with modules](/docs/en/1_system_deployment/step2_project_with_modules.md)

For all further commands, run the command line, selecting "Run as administrator". Go to the `cd c:\workspace\dnt` application folder (dnt - example from the previous step) and set the `NODE_PATH` environment variable that is equal to the following command  `set NODE_PATH=c:\workspace\dnt`.

![image](/uploads/5c227620ef05f77df9e9531c29b30b7b/image.png)

## Building the app
Building the application includes the installation of all libraries, import of all data to the DB and preparation to launch the app.  

When first launching, write the `npm install` command - it will install all key dependencies, including the gulp builder (installation command `npm install gulp`). This command installs all lybraries from the `dependencies` characteristic in the `package.json` list.   

After `npm install` command, the following message can pop up. It notifies you that dependencies consist of modules that can be potentionally dangerous for the project. Just ignore this notification.

NB! **The following message is NOT an error**

> audited 2716 packages in 6.508s
   found 5 vulnerabilities (1 low, 4 high)
   run npm audit fix to fix them, or npm audit for details

Always make sure that the `NODE_PATH` environment variable is set, the MongoDB is ready for use and the `Path` is leading to the Git (example `C:\Program Files\Git\bin`).

![image](/uploads/fa3614243213775760dcd6dc2ae30b4a/image.png)

Before launching the app add a new user. Open `Mongo Compass` and find the `ino-user` table in the DB. Delete all entries you'll see. Further, `returne to the console` and run the following command.

```
node bin\adduser.js --name admin --pwd 123
node bin\acl.js --u admin@local --role admin --p full
```

## Running the app 
When building is over you can run the app. Please make sure that the `NODE_PATH` environment variable is set. Without it, the system will display an error that some components are missing.  

The `npm start` command launches the system. The alternative is `node bin\www` command.  

When you'll see the message that you're running the system on port `8888`, you can open the browser and type the system adress - `http://localhost:8888`.  

### Next page: [System description](/docs/en/2_system_description) 
--------------------------------------------------------------------------  


 #### [Licence](/LICENCE.md) &ensp;  [Contact us](https://iondv.ru/index.html) &ensp;  [Russian](/docs/ru/1_system_deployment/step3_building_and_running.md)   &ensp; [FAQs](/faqs.md)          




--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.  
All rights reserved.   
