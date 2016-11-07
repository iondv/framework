/**
 * Created by akumidv on 22.09.2016.
 * Класс с фугкциями для трансформации метаданных (meta, views, navigation ...) из предыдущей версии в заданную. Соответствие фуннкций версиям
 * задается в файле конвертации меты meta-version.json в свойстве transformateMetaDataFunctionName.
 * {Object} metaApp - объект метаданных приложения
 * {Object} metaApp.meta - именованный массив объектов с метой и представлениями классов, имя - класс
 * {Object} metaApp.meta[].cls - класс меты
 * {Object} metaApp.meta[].cls.text - текстовое значение файла класса
 * {Object} metaApp.meta[].cls.fileName- путь к классу
 * {Object} metaApp.meta[].vwCreate - объект представления создания
 * {Object} metaApp.meta[].vwCreate.text - представление создания
 * {Object} metaApp.meta[].vwCreate.fileName - представление создания
 * {Object} metaApp.meta[].vwItem - объект представление формы
 * {Object} metaApp.meta[].vwItem.text - представление формы
 * {Object} metaApp.meta[].vwItem.fileName. - представление формы
 * {Object} metaApp.meta[].vwList - представление списка
 * {Object} metaApp.meta[].vwList.text - представление списка текст
 * {Object} metaApp.meta[].vwList.fileName - представление списка имя файла
 * {Object} metaApp.navigation - именованный массив объектос с навигацией, имя - секция
 * {Object} metaApp.navigation[].section - объект секции
 * {Object} metaApp.navigation[].section.text - текстовые файлы навигации
 * {Object} metaApp.navigation[].section.fileName - путь к файлу секции
 * {Object} metaApp.navigation[].menu - именованный маасив значений меню секции, имя код меню
 * {Object} metaApp.navigation[].menu[].text - текстовое значение файла меню
 * {Object} metaApp.navigation[].menu[].fileName - путь к файлу меню
 */

'use strict';

// Уточняем параметры jsHint.
// maxcomplexity - цикломатическая сложность функций разбора по типам 25 (вложенные свитчи и кейсы), а не 10ть из-за архитектуры и упрощения чтения
// jshint maxcomplexity: 25, maxstatements: 25

let searchMinVersion = require('./meta-utils').searchMinVersion;
let compareSemVer = require('./meta-utils').compareSemVer;

const MetaDataTransformation = {

  verR2F0P0: function (metaApp) { // Версия 2.0.0
    const metaVer = '2.0.0';
    /**
     * Функция конвертации объекта представления в соответствии с метой класса для данного представления
     * @param {String} metaName - имя класса и тип
     * @param {Object} classObject - класс с метаданными
     * @param {Object} viewObject - объект для конвертации
     * @returns {*}
     */
    function convertObjectProperties(metaName, classObject, viewObject) {
      let attributeList = viewObject.tabs ? viewObject.tabs[0].fullFields : viewObject.columns;
      if (attributeList) {
        // 4debug console.log('Конвертиурем представление', metaName);
        for (let i = 0; i < attributeList.length; i++) {
          if (attributeList[i].fields.length) {
            for (let k = 0; k < attributeList[i].fields.length; k++) {
              // 4debug console.log('  Атрибут таблицы', attributeList[i].fields[k].property);
              attributeList[i].fields[k] = convertViewFields(attributeList[i].fields[k], classObject);
            }
          } else {
            // 4debug console.log('  Атрибут', attributeList[i].property);
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
              // 4debug console.log('    Заменяем ', typesToConvert[j], 'с', attribute[typesToConvert[j]],
              //  'на',  typesToConvert[j] === 'type' ? arrType[metaProperty[typesToConvert[j]]] :
              //    metaProperty[typesToConvert[j]]);
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
        console.error('Ошибка конвертации данных класса', metaName + '\n', textMetaObject + '\n' + e + '\n' + e.stack);
      }
      try {
        viewsObject = JSON.parse(textViewObject);
      } catch (e) {
        console.error('Ошибка конвертации данных представления', metaName + '\n', textViewObject + '\n' + e+ '\n' + e.stack);
      }
      try {
        viewsObject = convertObjectProperties(metaName, metaObject, viewsObject);
      } catch (e) {
        console.error('Ошибка конвертации типов представления', metaName + '\n', textViewObject + '\n' + e + '\n' + e.stack);
      }
      try {
        textViewObject = JSON.stringify(viewsObject, null, 2);
      } catch (e) {
        console.error('Ошибка конвертации данных представления в текст', metaName + '\n', metaObject + '\n' + e + '\n' + e.stack);
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
              const textMetaVersion = searchMinVersion(metaApp.meta[key].vwCreate);
              if (compareSemVer(textMetaVersion, metaVer) <= 0) { // <== 0 - т.к. в предыдущих шагах указали текущую версию(!)
                metaApp.meta[key].vwCreate.text = objectUpdateProperty('Представление создания ' + key,
                  metaApp.meta[key].cls.text, metaApp.meta[key].vwCreate.text);
              }
            }
            if (metaApp.meta[key].vwItem && metaApp.meta[key].vwItem.text) { // Конвертор для объектов представления создания
              const textMetaVersion = searchMinVersion(metaApp.meta[key].vwItem);
              if (compareSemVer(textMetaVersion, metaVer) <= 0) {
                metaApp.meta[key].vwItem.text = objectUpdateProperty('Представление редактирования ' + key,
                  metaApp.meta[key].cls.text, metaApp.meta[key].vwItem.text);
              }
            }
            if (metaApp.meta[key].vwList && metaApp.meta[key].vwList.text) { // Конвертор для объектов представления создания
              const textMetaVersion = searchMinVersion(metaApp.meta[key].vwList);
              if (compareSemVer(textMetaVersion, metaVer) <= 0) {
                metaApp.meta[key].vwList.text = objectUpdateProperty('Представление списка ' + key,
                  metaApp.meta[key].cls.text, metaApp.meta[key].vwList.text);
              }
            }
          } else {
            console.warn('Некорректная структура в сформированной мете', key, '\n', metaApp.meta[key]);
          }
        }
      }
    }
    return metaApp;
  }
};

module.exports = MetaDataTransformation;
