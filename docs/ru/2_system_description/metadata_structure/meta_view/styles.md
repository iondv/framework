#### [Оглавление](/docs/ru/index.md)

### Назад: [Мета представлений - общая часть](meta_view_main.md)

# Выделение цветом строк в списке

Условия **выделение цветом** строк в списке задаются с помощью формулы. 

Список поддерживаемых функций можно посмотреть [здесь](/docs/ru/2_system_description/metadata_structure/meta_class/atr_formula.md). Настройка задается в общей части меты представления списка и выглядит следующим образом:

```
"styles": {
    "css-class": "формула"
  }
```

где, `"css-class"` - класс доступных тем оформления, а `"формула"` - формула с условием для применения выделения цветом строк в списке.

#### Доступные темы оформления `"css-class"`

* `attention-1` - red
* `attention-2` - yellow
* `attention-3` - orange
* `attention-4` - gray
* `attention-5` - blue
* `attention-6` - green

#### Назначение

При открытии формы представления списка объектов, в соответствии с условиями формулы и класса темы оформления - строки таблицы выделяются цветом.

#### Пример

```json
"styles": {
    "attention-1": "lt($real, 0)"
  },
```

`$real` - любое целое число. Если $real - меньше 0, то столбец выделяется красным цветом.

--------------------------------------------------------------------------  


 #### [Licence](/LICENSE) &ensp;  [Contact us](https://iondv.com/portal/contacts) &ensp;  [English](/docs/en/2_system_description/metadata_structure/meta_view/styles.md)   &ensp;
<div><img src="https://mc.iondv.com/watch/local/docs/framework" style="position:absolute; left:-9999px;" height=1 width=1 alt="iondv metrics"></div>         



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.  
All rights reserved. 