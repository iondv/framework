#### [Content](/docs/en/index.md)

### Back: [Meta report](/docs/en/2_system_description/metadata_structure/meta_report/meta_report.md)

### Example of a simple full report 

```
name: support
caption: Report on technical support requests
sources:
  - name: task
    caption: Request
    load:
      - className: task
        results:
          - field: id
            expr: $id
          - field: date
            expr: $dateCreate
          - field: typeComunication
            expr:
              if:
                - eq:
                  - $typeComunication
                  - call
                - 'Phone call'
                - if:
                  - eq:
                    - $typeComunication
                    - metting
                  - 'Metting'
                  - if:
                    - eq:
                      - $typeComunication
                      - letter
                    - 'Letter'
                    - if:
                      - eq:
                        - $typeComunication
                        - mail
                      - 'E-mail'
                      - ' '
          - field: typeTask
            expr:
              if:
                - eq:
                  - $typeTask
                  - question
                - 'Advice'
                - if:
                  - eq:
                    - $typeTask
                    - problem
                  - 'Incident'
                  - if:
                    - eq:
                      - $typeTask
                      - offer
                    - 'Offer'
                    - ' '
          - field: predmetSupport
            expr: $support.name
          - field: temaTask
            expr: 
              if:
                - nempty:
                  - $supportScenario0
                - $supportScenario0.name
                - ' '
          - field: nameClassification
            expr:
              if:
                - nempty:
                  - $supportScenario1
                - $supportScenario1.name
                - if:
                  - nempty:
                    - $supportScenario2
                  - $supportScenario2.name
                  - if:
                    - nempty:
                      - $supportScenario3
                    - $supportScenario3.name
                    - if:
                      - nempty:
                        - $supportScenario4
                      - $supportScenario4.name
                      - if:
                        - nempty:
                          - $supportScenario5
                        - $supportScenario5.name
                        - if:
                          - nempty:
                            - $supportScenario6
                          - $supportScenario6.name
                          - ' '
          - field: coment
            expr: $comment
    index:
      - id
  - name: support
    caption: Technical support requests
    load:
      - source: task
        joins:
          - table: date
            alias: da
            left: id
            right: id
          - table: typeComunication
            alias: comun
            left: id
            right: id
          - table: typeTask
            alias: ta
            left: id
            right: id
          - table: predmetSupport
            alias: sup
            left: id
            right: id
          - table: coment
            alias: com
            left: id
            right: id
        results:
          - field: id
            expr: $id
          - field: date
            expr: $date
          - field: typeComunication
            expr: $typeComunication
          - field: typeTask
            expr: $typeTask
          - field: predmetSupport
            expr: $predmetSupport
          - field: temaTask
            expr: $temaTask
          - field: nameClassification
            expr: $nameClassification
          - field: coment
            expr: $coment
reports:
  - name: technicalSupport
    caption: TS requests
    sheets:
      - name: technicalSupport
        caption: Technical support requests
        type: aggregation
        source: support
        fetch:
          date: $date
          typeComunication: $typeComunication
          typeTask: $typeTask
          predmetSupport: $predmetSupport
          temaTask: $temaTask
          nameClassification: $nameClassification
          coment: $coment
        rangeFilters:
          date:
            caption:  for the period from|to
            format: date
            inclusive: both
        columns:
          - field: date
            caption: Creation date
          - field: typeComunication
            caption: Communication type
          - field: typeTask
            caption: Request type
          - field: predmetSupport
            caption: Support subject
          - field: temaTask
            caption: Request theme
          - field: nameClassification
            caption: Classification name
          - field: coment
            caption: Comment
            
```

--------------------------------------------------------------------------  


 #### [Licence](/LICENCE.md) &ensp;  [Contact us](https://iondv.com) &ensp;  [English](/docs/en/2_system_description/metadata_structure/meta_report/example.md)   &ensp; [FAQs](/faqs.md) 
 
 --------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.  
All rights reserved. 
