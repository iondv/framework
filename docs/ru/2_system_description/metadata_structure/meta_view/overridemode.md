#### [Оглавление](/docs/ru/index.md)

### Назад: [Мета представлений - общая часть](meta_view_main.md)

# Режим наложения

Поле **Режим наложения** - `"overrideMode"` позволяет задать два значения `"Перекрыть"` и `"Переопределить"`.

Настройка режимов наложения в мете представления:

**Тип 1** - `"Переопределить"` - переопределяет стандартный способ отображения соответствующих атрибутов заданных в мете представления класса. Атрибуты, которые не заданы в мете представления класса, отображаются стандартным образом на форме согласно заданной очередности по умолчанию.

**Тип 2** - `"Перекрыть"` - выводятся только атрибуты заданные в мете представления.

### Пример

```
  "actions": null,
  "siblingFixBy": null,
  "siblingNavigateBy": null,
  "historyDisplayMode": 0,
  "collectionFilters": null,
  "version": null,
  "overrideMode": 1, 
  "commands": [

```
--------------------------------------------------------------------------  


 #### [Licence](/LICENSE) &ensp;  [Contact us](https://iondv.com/portal/contacts) &ensp;  [English](/docs/en/2_system_description/metadata_structure/meta_view/overridemode.md)   &ensp;
<div><img src="https://mc.iondv.com/watch/local/docs/framework" style="position:absolute; left:-9999px;" height=1 width=1 alt="iondv metrics"></div>         



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.  
All rights reserved. 