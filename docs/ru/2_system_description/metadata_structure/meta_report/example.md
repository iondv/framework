#### [Оглавление](/docs/ru/index.md)

### Назад: [Мета отчёта](meta_report.md)

### Пример простого полного отчета
```
name: support
caption: Отчет по заявкам в техническую поддержку
sources:
  - name: task
    caption: Заявка
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
                - 'Звонок'
                - if:
                  - eq:
                    - $typeComunication
                    - metting
                  - 'Встреча'
                  - if:
                    - eq:
                      - $typeComunication
                      - letter
                    - 'Письмо'
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
                - 'Консультация'
                - if:
                  - eq:
                    - $typeTask
                    - problem
                  - 'Инцидент'
                  - if:
                    - eq:
                      - $typeTask
                      - offer
                    - 'Предложение'
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
    caption: Заявки в техническую поддержку
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
    caption: Заявки ТП
    sheets:
      - name: technicalSupport
        caption: Заявки в техническую поддержку
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
            caption: За период с|по
            format: date
            inclusive: both
        columns:
          - field: date
            caption: Дата создания
          - field: typeComunication
            caption: Тип коммуникации
          - field: typeTask
            caption: Тип заявки
          - field: predmetSupport
            caption: Предмет поддержки
          - field: temaTask
            caption: Тема заявки
          - field: nameClassification
            caption: Наименование классификации
          - field: coment
            caption: Комментарий
            
```

--------------------------------------------------------------------------  


 #### [Licence](/LICENSE) &ensp;  [Contact us](https://iondv.com/portal/contacts) &ensp;  [English](/docs/en/2_system_description/metadata_structure/meta_report/example.md)   &ensp;
<div><img src="https://mc.iondv.com/watch/local/docs/framework" style="position:absolute; left:-9999px;" height=1 width=1 alt="iondv metrics"></div>
 
 --------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.  
All rights reserved. 
