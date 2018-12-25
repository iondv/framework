#### [Content](/docs/en/index.md)

### Back: [Functionality](/docs/en/2_system_description/functionality/functionality.md)

## Jobs in schedule

The launch of the jobs in schedule is performed in two ways.:

1. in a separate process using the `bin/schedule.js` script
2. within the ION web application process (bin / www) by specifying in the ini-file this option - `jobs.enabled=true`

In the second case, job management is possible to implement in a web application.

Jobs are configured in the `deploy.json` file of the applications in the global settings section as a jobs parameter.

### Example:

```json
    "jobs": {
      "dummy": {
        "launch": { // The frequency of launching the job
          "month": [2,5], // in February and May
          "week": 3, // every third week (month and week - mutually exclusive settings),
          "weekday": [1, 3, 5], // on Mondays, Wednesdays and Fridays
          "dayOfYear": 5, // every 5 days during the year,
          "day": 10, // every 10 days during the month
          "hour": 3, // every 3 hours
          "minute": [10, 15, 35], // on the 10th, 15th and 35th minute
          "sec": 10 // every 10 seconds
        },
        "di": { // scope of the job
          "dummy": {
            "module": "applications/develop-and-test/jobs/dummy",
            "options": {
            }
          }
        },
        "worker": "dummy", // the name of the component from the job scope that will be executed
      }
    }
```

A component can be specified as a starting job, in which case it should have the `run` method. A function can also be specified as a starting job. Шn **di** it is described in the same way as the component, but using the `executable` parameter:

```json
        "di": {
          "dummy": {
            "executable": "applications/develop-and-test/jobs/dummy",
            "options": {}
          }
        }
```

### Example
*The jobs field in the global settings.*

```json
...
"jobs": {
      "dummy": {
        "launch": {
          "sec": 30
        },
        "worker": "dummy",
        "di": {
          "dummy": {
            "executable": "applications/develop-and-test/jobs/dummy"
          }
        }
      }
...
```

--------------------------------------------------------------------------  


 #### [Licence](/LICENCE.md) &ensp;  [Contact us](https://iondv.com) &ensp;  [Russian](\docs\ru\2_system_description\functionality\schedule.md)   &ensp; [FAQs](/faqs.md)          



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.  
All rights reserved. 