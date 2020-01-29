# Утилиты для печатных форм
Назад: [Функциональные утилиты приложения](./readme.md)   

Утилиты для печатных форм (инжекторы) предназначены для обработки выводимых в шаблон данных, в том числе проведения промежуточных расчетов и форматирования.  
Печатную форму для которой будет использоваться инжектор необходимо определить в deploy.json, например:
```
"registry": {
    "globals": {
        "di": {
            "pmListToDocx": {
                "module": "modules/registry/export/listToDocx",
                "initMethod": "init",
                "initLevel": 0,
                "options": {
                    "tplDir": "applications/khv-ticket-discount/export/list",
                    "log": "ion://sysLog",
                }
                ...
            }
            ...
        }
        ...
    }
    ...
}
```
В данном случае используется модуль listToDocx, следовательно в печатную форму будет выгружен список всех объектов определенного класса.  
Для каждого такого класса в tplDir нужно создать папку с названием пространства имен, в которую затем поместить файл с названием нужного для выгрузки класса из этого пространства имен, например:
```
...\applications\khv-ticket-discount\export\list\khv-ticket-discount\ticketYear.docx
```
Таким образом в документ будет выгружен список всех объектов класса ticketYear@khv-ticket-discount.

Сама утилита представляет собой .js скрипт, подключаемый к приложению в формате модуля в deploy.json, например так:
```
"registry": {
    "globals": {
        "di": {
            "weekTicketStatsInjector": {
                "module": "applications/khv-ticket-discount/export/injectors/monthTicketStats",
                "options": {
                "dataRepo": "ion://dataRepo"
                }
                ...
            }
            ...
        }
        ...
    }
    ...
}
```
.js файл здесь находится по пути "module".

После подключения утилиту необходимо включить в опции печатной формы:
```
"registry": {
    "globals": {
        "di": {
            "pmListToDocx": {
                "module": "modules/registry/export/listToDocx",
                "initMethod": "init",
                "initLevel": 0,
                "options": {
                    "tplDir": "applications/khv-ticket-discount/export/list",
                    "log": "ion://sysLog",
                    "injectors": [
                        "ion://monthTicketStatsInjector"
                    ]
                }
                ...
            }
            ...
        }
        ...
    }
    ...
}
```

Скрипт инжектора составляется в формате модуля, с тем условием, что он должен содержать функцию this.inject, в параметр которой будет передан объект с вложенным в него списком объектов заданного ранее класса, для примера из этой справки:
```
ticketYear@khv-ticket-discount
```

Пример файла monthTicketStats.js:
```
function monthTicketStatsInjector() {
  this.inject = function (value) {
    if (value && value.className === "ticketYear") {
      let expValueList = [];
      const periodBegF = value.periodBegF;
      const periodEndF = value.periodEndF;
      const areaF = value.areaF;
      let i = 0;
      value.list.forEach((vectorparams) => {
        if (vectorparams.person.area.code === areaF && vectorparams.dateAirGo >= periodBegF && vectorparams.dateAirGo <= periodEndF && ((vectorparams.state !== "canceled") && (vectorparams.state !== "returned"))) {
          expValueList[i++] = vectorparams;
        }
      });
      value.list = expValueList;
    }
    return value;
  };
}

module.exports = monthTicketStatsInjector;
```

Пример конфигурации экспорта для данной формы в deploy.js:
```
"registry": {
    "globals": {
        "di": {
            "export": {
                "options": {
                    "configs": {
                        "ticketYear@khv-ticket-discount": {
                            "pmListToDocx": {
                                "type": "list",
                                "caption": "Ежемесячный отчет",
                                "mimeType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                                "extension": "docx",
                                "params": {
                                    "periodBegF": {
                                    "caption": "Период с",
                                    "type": "date"
                                },
                                "periodEndF": {
                                    "caption": "по",
                                    "type": "date"
                                },
                                "areaF": {
                                    "caption": "Район",
                                    "type": "reference",
                                    "className": "area@khv-ticket-discount"
                                }
                            },
                            "preprocessor": "ion://pmListToDocx",
                            "eagerLoading": [
                                "person",
                                "person.documents",
                                "person.area",
                                "route.pointDeparture",
                                "route.pointArrival",
                                "route.flight"
                            ],
                            "fileNameTemplate": "Ежемесячный отчет"
                        }
                    }
                }
            }
            ...
        }
        ...
    }
    ...
}
```
Здесь следует обратить внимание на поле params - в нем можно указать параметры, доступные в форме экспорта в веб сервисе приложения, по состоянию на 24.12.2019 возможны следующие типы параметров:  
"string" - строка для ввода текста,  
"date" - интерактивный календарь, в котором можно выбрать интересующую дату  
"reference" - ссылка на класс, в данном случае в окне экспорта будет отображен выпадающий список всех объектов класса.  
Переданные параметры будут доступны в скрипте через параметр функции this.inject.