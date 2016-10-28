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
    console.info('Трансформируем мету и представления до версии 2.0.0');
    return metaApp;
  }
};

module.exports = MetaDataTransformation;

