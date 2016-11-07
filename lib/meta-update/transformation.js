/**
 * Created by akumidv on 22.09.2016.
 * Класс с фугкциями для трансформации метаданных (meta, views) из предыдущей версии в заданную. Соответствие фуннкций версиям
 * задается в файле конвертации меты meta-version.json в свойстве transformateMetaDataFunctionName.
 * Формат metaData
 * {Object} metaData - объект метаданных
 * {Object} metaData.meta - класс
 * {Object} metaData.views - объект с представлениями
 * {Object} metaData.views.create - представление создания
 * {Object} metaData.views.item - представление формы
 * {Object} metaData.views.list - представление списка
 */

'use strict';

var MetaDataTransformation = {

  verR2F0P0: function (metaApp) { // Версия 2.0.0
    let metaVer = '2.0.0';
    /**
     * Функция конвертации объекта представления в соответствии с метой класса для данного представления
     * @param {String} metaName - имя класса и тип
     * @param {Object} classObject - класс с метаданными
     * @param {Object} viewObject - объект для конвертации
     * @returns {*}
     */
    function convertObjectProperties(metaName, classObject, viewObject) {
      let attributeList = viewObject.tabs ? viewObject.tabs[0].fullFields : viewObject.columns;
      if(attributeList) {
        console.log('Конвертиурем представление', metaName);
        for (var i = 0; i < attributeList.length; i++) {
          if (attributeList[i].fields.length) {
            for (var k = 0; k < attributeList[i].fields.length; k++) {
              console.log('Атрибут таблицы', attributeList[i].fields[k].property);
              attributeList[i].fields[k] = convertViewFields(attributeList[i].fields[k], classObject);
            }
          } else {
            console.log('Атрибут', attributeList[i].property);
            attributeList[i] = convertViewFields(attributeList[i], classObject);
          }
        }
        if (viewObject.columns) {
          viewObject.columns = attributeList;
        } else {
          viewObject.tabs[0].fullFields = attributeList;
        }
      } else {
        console.warn('Отсутствует tabs[0].fullFields или columns в представлении', metaName);
      }

      return viewObject;
    }

    /**
     * Функция конвертации атрибутов представления в соответствии с метаданными классов
     * @param {Object} attribute - объект, представляющий набор параметров отдельного атрибута представления
     * @param {Object} metaClass - объект, представляющий набор свойств метаданных отдельного класса
     * @returns {*}
     */
    function convertViewFields(attribute, metaClass) {
      let arrType = [1,7,8,17,13,11,14,14,15,6,4,12,1,2,3,10,2,17]; // Таблица соответствия типов класса и типов представления
      arrType[60] = 60;
      arrType[50] = 50;
      arrType[53] = 53;
      arrType[24] = 24;
      arrType[100] = 100;
      arrType[101] = 101;
      arrType[110] = 110;
      arrType[120] = 120;
      arrType[130] = 130;
      arrType[140] = 140;
      arrType[1000] = 1000;
      let typesToConvert = ['caption','type','orderNumber'];
      let metaProperty;
      let metaPropertyExists = false;

      for (var i = 0; i < metaClass.properties.length; i++) {
        if (metaClass.properties[i].name === attribute.property) {
          metaProperty = metaClass.properties[i];
          metaPropertyExists = true;
          break;
        }
      }

      if (metaPropertyExists) {
        for (var j = 0; j < typesToConvert.length; j++) {
          if (attribute.hasOwnProperty(typesToConvert[j]) && metaProperty.hasOwnProperty(typesToConvert[j])) {
            if (typeof attribute[typesToConvert[j]] === 'string' && attribute[typesToConvert[j]].length === 0 ||
              attribute[typesToConvert[j]] === null) {
              console.log('Заменяем ', typesToConvert[j], 'с', attribute[typesToConvert[j]],
                'на',  (typesToConvert[j] === 'type' ? arrType[metaProperty[typesToConvert[j]]] :
                  metaProperty[typesToConvert[j]]));
              attribute[typesToConvert[j]] = typesToConvert[j] === 'type' ? arrType[metaProperty[typesToConvert[j]]] :
                metaProperty[typesToConvert[j]];
            }
          }
        }
      }
      return attribute;
    }

    /**
     * Функционя распарсивания и обновления свойств объекта
     * @param {String} metaName - имя класса и тип
     * @param {String} textMetaObject - обновляемый объект в текстовом формате
     * @param {Object} textViewObject - объект представления
     * @return {String} textViewObject - текстовое значение объекта
     */
    function objectUpdateProperty(metaName, textMetaObject, textViewObject) {
      let metaObject;
      let viewsObject;
      try {
        metaObject = JSON.parse(textMetaObject);
      } catch (e) {
        console.error('Ошибка конвертации данных класса', metaName + '\n', textMetaObject + '\n' + e);
      }
      try {
        viewsObject = JSON.parse(textViewObject);
      } catch (e) {
        console.error('Ошибка конвертации данных представления', metaName + '\n', textViewObject + '\n' + e);
      }
      try {
        viewsObject = convertObjectProperties(metaName, metaObject, viewsObject);
      } catch (e) {
        console.error('Ошибка конвертации типов представления', metaName + '\n', textViewObject + '\n' + e);
      }
      try {
        textViewObject = JSON.stringify(viewsObject, null, 2);
      } catch (e) {
        console.error('Ошибка конвертации данных представления в текст', metaName + '\n', metaObject + '\n' + e);
      }
      return textViewObject;
    }

    console.info('Трансформируем мету и представления до версии 2.0.0');
    if (metaApp.meta) {
      for (let key in metaApp.meta) { // Обновляем мету
        if (metaApp.meta.hasOwnProperty(key)) {
          if (metaApp.meta[key].cls && metaApp.meta[key].cls.text) { // Но может не быть текстовых, например есть представление, но нет класса
            // Избыточная проверка, т.к. всегда есть эти объекты.
            if (metaApp.meta[key].vwCreate && metaApp.meta[key].vwCreate.text) { // Конвертор для объектов представления создания
              let textMetaVersion = searchMinVersion(metaApp.meta[key].vwCreate);
              if (compareSemVer(textMetaVersion, metaVer) <= 0) { // <== 0 - т.к. в предыдущих шагах указали текущую версию(!)
                metaApp.meta[key].vwCreate.text = objectUpdateProperty('Представление создания ' + key,
                  metaApp.meta[key].cls.text, metaApp.meta[key].vwCreate.text);
              }
            }
            if (metaApp.meta[key].vwItem && metaApp.meta[key].vwItem.text) { // Конвертор для объектов представления создания
              let textMetaVersion = searchMinVersion(metaApp.meta[key].vwItem);
              if (compareSemVer(textMetaVersion, metaVer) <= 0) {
                metaApp.meta[key].vwItem.text = objectUpdateProperty('Представление редактирования ' + key,
                  metaApp.meta[key].cls.text, metaApp.meta[key].vwItem.text);
              }
            }
            if (metaApp.meta[key].vwList && metaApp.meta[key].vwList.text) { // Конвертор для объектов представления создания
              let textMetaVersion = searchMinVersion(metaApp.meta[key].vwList);
              if (compareSemVer(textMetaVersion, metaVer) <= 0) {
                metaApp.meta[key].vwList.text = objectUpdateProperty('Представление списка ' + key,
                  metaApp.meta[key].cls.text, metaApp.meta[key].vwList.text);
              }
            }
          } else {
            console.log('Некорректная структура в сформированной мете', key, '\n', metaApp.meta[key]);
          }
        }
      }
    }
    return metaApp;
  }
};

module.exports = MetaDataTransformation;

// TODO в отдельную библиотеку и подключа в мета-апдейт тоже - т.к. дублируют
/**
 * Функция сравнения версий в формате semVer
 * @param {String} semver1 - версия в формате semver
 * @param {String} semver2 - версия в формате semver
 * @return {Number} - 0 равны; -1 semver1 меньше semver2; 1 semver1 больше semver2
 */
function compareSemVer(semver1, semver2) {
  if (semver1 === semver2) {
    return 0;
  } else {
    const arrSemVer1 = semver1.split('.');
    const arrSemVer2 = semver2.split('.');
    if (arrSemVer1[0] < arrSemVer2[0] ||
      arrSemVer1[0] === arrSemVer2[0] && arrSemVer1[1] < arrSemVer2[1] ||
      arrSemVer1[0] === arrSemVer2[0] && arrSemVer1[1] === arrSemVer2[1] && arrSemVer1[2] < arrSemVer2[2]) {
      return -1;
    } else {
      return 1;
    }
  }
}
/**
 * Функция поиска минимального значения версии
 * @param {Object} structureOfMeta - структура данных в формате metaApp
 * @returns {String} - минимальное значение версии, если в каком-то объекте версий не было найдено, то вернет '0.0.0'
 */
function searchMinVersion(structureOfMeta) {
  let minMetaVersion;
  for (let key in structureOfMeta) {
    if (structureOfMeta.hasOwnProperty(key)) {
      if (key === 'text') {
        let result = structureOfMeta.text.match(/\"metaVersion\"(|\s):(|\s)\"\d*\.\d*\.\d*\"/);
        if (result === null) {
          minMetaVersion = '0.0.0'; // Нет версии, прекращаем поиск
          // 4debug console.info('В файле %s, нет версии меты. Принимаем за мин. версию %s', structureOfMeta.fileName, minMetaVersion);
          break;
        }
        let version = result[0].match(/\d*\.\d*\.\d*/)[0];
        if (!minMetaVersion || compareSemVer(minMetaVersion, version) === 1) {
          minMetaVersion = version;
        }
      } else if (key !== 'fileName' && key !== 'obj') {
        let version = searchMinVersion(structureOfMeta[key]);
        if (version) { // Если версия не определена - в ветке metaApp не было никаких ключей
          if (version === '0.0.0') {
            minMetaVersion = version;
            break;
          } else if (!minMetaVersion || compareSemVer(minMetaVersion, version) === 1) {
            minMetaVersion = version;
          }
        }
      }
    }
  }
  return minMetaVersion;
}
