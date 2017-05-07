/**
 * Created by krasilneg on 25.04.17.
 */
'use strict';
const codes = require('core/errors/file-storage');

module.exports = {
  [codes.BAD_DATA]: `Некоррекный формат данных.`,
  [codes.NO_DIR]: `Директория '%dir' не найдена.`,
  [codes.NO_FILE]: `Файл '%file' не найден.`
};
