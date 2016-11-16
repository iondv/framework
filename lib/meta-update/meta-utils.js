/* Утилиты для работы с методанными
 */
'use strict';

// Уточняем параметры jsHint.
// maxcomplexity - цикломатическая сложность функций разбора по типам 25 (вложенные свитчи и кейсы), а не 10ть из-за архитектуры и упрощения чтения
// jshint maxcomplexity: 25, maxstatements: 25

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
module.exports.compareSemVer = compareSemVer;

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
        const  result = structureOfMeta.text.match(/\"metaVersion\"(|\s):(|\s)\"\d*\.\d*\.\d*\"/);
        if (result === null) {
          minMetaVersion = '0.0.0'; // Нет версии, прекращаем поиск
          // 4debug console.info('В файле %s, нет версии меты. Принимаем за мин. версию %s', structureOfMeta.fileName, minMetaVersion);
          break;
        }
        const version = result[0].match(/\d*\.\d*\.\d*/)[0];
        if (!minMetaVersion || compareSemVer(minMetaVersion, version) === 1) {
          minMetaVersion = version;
        }
      } else if (key !== 'fileName' && key !== 'obj') {
        const version = searchMinVersion(structureOfMeta[key]);
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
module.exports.searchMinVersion = searchMinVersion;
