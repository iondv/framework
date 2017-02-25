/**
 * Created by Vasiliy Ermilov (ermilov.work@yandex.ru) on 2/25/17.
 */
const SortingModes = require('core/SortingModes');

module.exports = function sortParser(sorting) {
  if (!sorting) {
    return {};
  }
  let sort = typeof sorting === 'string' ? JSON.parse(sorting) : sorting;
  let result = {};
  for (let i = 0; i < sort.length; i++) {
    result[sort[i].property] = parseInt(sort[i].mode) === SortingModes.DESC ? -1 : 1;
  }
  return result;
};
