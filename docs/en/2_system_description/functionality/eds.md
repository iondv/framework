#### [Content](/docs/en/index.md)

### Back: [Functionality](/docs/en/2_system_description/functionality/functionality.md)

# Electronic-numerical signature 

## Description

**Electronic-numerical signature (EDS)** - refers to data in electronic form, which is logically associated with other data in electronic form and which is used by the signatory to sign. It is designed to protect this electronic document from forgery, obtained as a result of cryptographic transformation of information using the private key of an electronic digital signature. It allows you to identify the owner of the certificate key signature and establish that there is no distortion of information in the electronic document.

## Purpose of use

In the application the EDS is used for:

- Data integrity 
- Data authorship

There are three types of digital signatures that differ in their use:

- Simple digital signature
    - to determine the authorship of the data
    - created using codes, passwords or other instruments
- Reinforced unqualified digital signature
    - to check data integrity
    - to determine the data authorship
    - created using electronic signature tools
- Reinforced qualified digital signature
    - to check data integrity
    - to determine the data authorship
    - to create and verify electronic signatures, you should have confirmation of compliance with legal requirements

## Specificity of work

The EDS utility works on the cryptoPro basis, so it should be installed on the same computer:

- install [cryptopro](https://www.cryptopro.ru/products/csp/downloads)
- install [cryptopro plugin](https://www.cryptopro.ru/products/cades/plugin)
- issue a [certificate](https://www.cryptopro.ru/certsrv/certrqma.asp) for testing

## Implementation

EDS can be attributed to the application utilities, since its main implementation is in the application. Usually the implementation of EDS is located in the `lib/digest` application folder (the project-management app example):

- `lib/digest/digestData.js` - check the loading object form to the need for an electronic signature (_applicable) and check the signature process when performing a BP transition (_process)
- `lib/digest/signSaver.js` - attachment of the signature to the object

Add the `signedClasses` setting in the `deploy` file for the registry module, so that EDS status can be displayed.

### Example

```
"modules": {
    "registry": {
      "globals": {
         "signedClasses": [
          "class@application"
         ],
...
```

In the `workflows/indicatorValueBasic.wf.json` worflow add a transition with the `"signBefore": true` property.

### Example

```
 {
      "name": "needAppTrs_sign",
      "caption": "For approval",
      "startState": "edit",
      "finishState": "onapp",
      "signBefore": true,
      "signAfter": false,
      "roles": [],
      "assignments": [
        {
          "key": "state",
          "value": "onapp"
        }
      ],
      "conditions": []
    }
```

--------------------------------------------------------------------------  


 #### [Licence](/LICENCE.md) &ensp;  [Contact us](https://iondv.com) &ensp;  [Russian](/docs/ru/2_system_description/functionality/eds.md)   &ensp; [FAQs](/faqs.md)          



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.   
All rights reserved. 
