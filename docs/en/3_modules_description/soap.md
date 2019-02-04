#### [Content](/docs/en/index.md)

### Back: [Modules](/docs/en/3_modules_description/modules.md)

# The Soap module

NB. Soap module does not support GET requests for services.
Partly because a SOAP request is transmitted in the request body, and the GET request does not have a body (if you can put it that way). For this reason, you need to send a POST request. 

This can be done using the SOAP-UI utility (you can do it also in the browser, but in the request body you need to write a SOAP request that is WSDL-based and quite heavy).


## Crud service data structure settings

The `types` option contains a mapping between a class (full name) and a map of published attributes of this class. In the map, the attribute name is the key, and the value is either a string alias or a Boolean value indicating whether the attribute is included in the schema or not. That means if an alias is specified, then the attribute appears in the schema under this alias, in all other cases except for specifying the `false` attribute appears under its name.

This setting is used when class parsing when creating a service data schema, as well as parsing incoming messages and generating responses. By replacing "normalize" with a function which puts the data to the schema.

### For collections and references

If the values of collections and links also need to be parsed in another way, the objects that are in these properties can also be described by the map in `deploy.json` as follows:

```
"property_name": {
  "name": "new_name(the field is optional)",
 "types": {
 //property description
 }
}
```

### Example

```json
  "petitionExperts": {
            "module": "modules/soap/service/crud",
            "options": {
              "dataRepo": "ion://dataRepo",
              "metaRepo": "ion://metaRepo",
              "keyProvider": "ion://keyProvider",
              "namespace": "khv-gosekspertiza",
              "className": "petitionExpert",
              "types": {
                "petitionExperts@khv-gosekspertiza":{
                  "property1":"new_property_name",
                  "property2":true
                  }
                }
              }
            }
```
## Setting that removes system attributes from a request

```
let gosEkspRemPetNew = normalize(e.item, null, {skipSystemAttrs: true});
```

## Oauth2 token authentication in the SOAP module

Login-password and login-token authentication is applied by default for all services. Add the `WSSecurity` security header to the message to authenticate soap requests. To authenticate REST services, add standard HTTP `authentication headers`.

Set the type of verification - by password or token (pwd/token) in deploy.json file by setting the `authMode` in the corresponding module:

### Example

```json
"soap": {
      "globals": {
        "authMode": {
          "petitionExperts": "none",
          "petitionEstimated": "none",
          "gosEkspContract": "none",
          "bankAccounts": "none",
          "resolution": "none"
        }
```

By default, all services are authenticated by passwords. The admin panel has a special form to generate a user token. So, configure the `authMode` for the service in token, go to the admin, generate a token, use it instead of the password in the headers.

--------------------------------------------------------------------------  


 #### [Licence](/LICENCE.md)&ensp;  [Contact us](https://iondv.ru/index.html) &ensp;  [Russian](/docs/ru/3_modules_description/soap.md) &ensp; [FAQs](/faqs.md)          



--------------------------------------------------------------------------  

Copyright (c) 2018 LLC "ION DV".  
All rights reserved.