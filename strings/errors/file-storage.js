/**
 * Created by krasilneg on 25.04.17.
 */
'use strict';
const codes = require('core/errors/file-storage');
const {t} = require('core/i18n');

module.exports = {
  [codes.BAD_DATA]: t(`Некоррекный формат данных.`),
  [codes.NO_DIR]: t(`Директория '%dir' не найдена.`),
  [codes.NO_FILE]: t(`Файл '%file' не найден.`)
};
