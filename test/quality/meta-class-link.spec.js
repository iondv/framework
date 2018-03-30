/**
 * Тестируем достижимость класса из навигации
 * Таск https://ion-dv.atlassian.net/browse/IONCORE-412
 */

const path = require('path');

const getDirList = require('test/lib/get-meta').getDirList;
const getMetaFiles = require('test/lib/get-meta').getMetaFiles;
const getViewsList = require('test/lib/get-meta').getViewsList;
const nz = require('test/lib/get-meta').normilizeNamespase;

const TIMEOUT = 120000;
const NAV_TYPE_LIST_CLASS = 1;
const ARR_NOTFOUND = -1;

describe('# Проверка достижимости классов из навигации', function () {
  this.timeout(TIMEOUT);
  const pathApplications = path.join(__dirname, '../../applications');
  const appList = getDirList(pathApplications).dirList;
  let meta = {}; // Мета
  appList.forEach((pathApp) => {
    if (pathApp !== 'viewlib') {
      meta = getMetaFiles(path.join(pathApplications, pathApp, 'meta'), meta);
    }
  });

  appList.forEach((pathApp) => {
    if (['viewlib', 'fias'].indexOf(pathApp) === ARR_NOTFOUND) {
      checkMetaLinks(pathApplications, pathApp, meta);
    }
  });
});

function checkMetaLinks(pathApplications, ns, meta) {
  describe(`Проверка достижимости классов из навигации в приложении ${ns}`, () => {
    let navigation = {}; // Мета навигации
    let workflow = {};  // Мета БП
    let viewList = []; // Список представлений
    const metaLink = {}; // Объект с элементами из названий классов меты провенный по связям
    const metaCheckLink = []; // Массив названий классов для проверки
    let viewWfList = []; // Папки представлений бизнес-процессов
    before('Инициализация меты', () => {
      navigation = getMetaFiles(path.join(pathApplications, ns, 'navigation'));
      try { // Отсутствие папки бизнес-процессов, представлений допустимо
        viewList = getViewsList(path.join(pathApplications, ns, 'views'), 'workflows');
        workflow = getMetaFiles(path.join(pathApplications, ns, 'workflows'));
        viewWfList = getViewsList(path.join(pathApplications, ns, 'views/workflows'));
      } catch (err) {
        console.warn(err.message);
      }
    });
    it('Связываем классы по навигации и что такие классы есть в мете', () => {
      const errMeta = [];
      const startingMetaLink = Object.keys(metaLink).length;
      Object.keys(navigation).forEach((navItem) => { // Отбираем классы по навигации
        if (navigation[navItem].type === NAV_TYPE_LIST_CLASS) {
          const className = nz(navigation[navItem].classname, ns);
          if (meta[className]) {
            metaLink[className] = true;
            metaCheckLink.push(className);
          } else {
            console.error(`В навигации ${navItem} ссылка на отсутствующий класс ${className}`);
            errMeta.push(className);
          }
        }
      });
      if (errMeta.length) {
        throw (new Error(`В файлах метаданных ссылки на некоректные классы ${errMeta}`));
      }
      console.info('При анализе навигации добавлено ссылок на мету', Object.keys(metaLink).length - startingMetaLink);
    });
    it.skip('Связываем классы по ссылкам и коллекциям и что такие классы естьв  мете', () => {

    });

    it('Проверяем связанные классы по иерархии наследования и проверяем что такие классы есть в мете', () => {
      const startingMetaLink = Object.keys(metaLink).length;
      const childFailedLink = checkAncestor(Object.keys(meta), meta, metaLink, metaCheckLink);
      if (Object.keys(childFailedLink.ancestor).length) {
        /*
        * Не является ошибкой, т.к. классы могут быть на будующее
        * throw (new Error ('В файлах метаданных есть классы в иерархии, которые нигде не используются'));
        */
        console.warn('Классы проверенные от навигации, через ссылки и коллекции и иерархию наследования ' +
          'по которым нет связей в мете',
        Object.keys(childFailedLink.ancestor));
      }
      if (Object.keys(childFailedLink.errNames).length) {
        throw (new
          Error(`В иерархии наследованиия, некорректные родительские классы ${Object.keys(childFailedLink.errNames)}`));
      }
      console.info('При анализе наследования добавлено ссылок на мету',
        Object.keys(metaLink).length - startingMetaLink);
    });
    it('Проверка представлений, для которых нет классов', () => {
      const errViews = [];
      viewList.forEach((viewName) => {
        if (!meta[viewName]) {
          errViews.push(viewName);
          console.error(`Для представления ${viewName} отсутствует мета класса`);
        }
      });
      if (errViews.length) {
        throw (new Error(`Представления для отстутствующих классов ${errViews}`));
      }
    });
    it.skip('Проверка бизнес-процессов, для которых нет классов', () => {
      const errWf = [];
      Object.keys(workflow).forEach((wfItem) => { // Отбираем классы по бизнес-процессам
        if (!meta[workflow[wfItem].wfClass]) {
          console.error(`В бизнес-процессе ${wfItem} ссылка на отсутствующий калсс ${workflow[wfItem].wfClass}`);
          errWf.push(workflow[wfItem].wfClass);
        }
      });
      if (errWf.length) {
        throw (new Error(`В файлах метаданных ссылки на некоректные классы ${errWf}`));
      }
    });
    it.skip('Проверка лишних бизнес-процессов в представлениях', () => {
      const errViews = [];
      viewWfList.forEach((viewName) => {
        if (!workflow[viewName]) {
          errViews.push(viewName);
          console.error(`Для представления бизнес-процесса ${viewName} отсутствует бизнес-процесс`);
        }
      });
      if (errViews.length) {
        throw (new Error(`Представления для отстутствующих классов ${errViews}`));
      }
    });
    it.skip('Проверка лишних статутусов и классов представлений, по которым нет меты в бизнес-процессах', () => {
      const errState = [];
      const errViews = [];
      viewWfList.forEach((viewName) => {
        if (!meta[viewName] && viewName !== 'workflows') {
          errViews.push(viewName);
          console.error(`Для представления ${viewName} отсутствует мета класса`);
        }
      });
      if (errViews.length) {
        throw (new Error(`Представления для отстутствующих классов ${errViews}`));
      }
    });
  });
}

function checkAncestor(metaNames, meta, metaLink, metaCheckLink, childNotLinkLen = 0) {
  const checked = {
    ancestor: {},
    errNames: {}
  };
  metaNames.forEach((className) => {
    if (meta[className]) { // Класс есть в мете
      if (meta[className].ancestor) { // Есть родитель?
        const ancestorName = nz(meta[className].ancestor,
          meta[className].namespace || className.substr(className.search('@')));
        if (meta[ancestorName]) { // Родитель есть в классе меты
          if (metaLink[ancestorName]) { // Родитель уже есть среди ссылочных объектов, значит достижим от навигации, добавляем наследника
            metaLink[className] = true;
            metaCheckLink.push(className);
          } else if (metaLink[className]) { // Наследник уже есть среди ссылочных объектов, значит достижим от навигации, добавляем родителя
            metaLink[ancestorName] = true;
            metaCheckLink.push(ancestorName);
          } else {
            checked.ancestor[className] = true;
            checked.ancestor[ancestorName] = true;
          }
        } else {
          console.error(`В классе ${className} отсутствующий в мете родительский класс ${ancestorName}`);
          checked.errNames[ancestorName] = true;
        }
      }
    } else {
      console.error(`В мете при проверке наследования, отсутствующий класс ${className}`);
      checked.errNames[className] = true;
    }
  });
  if (Object.keys(checked.ancestor).length &&
    Object.keys(checked.ancestor).length !== childNotLinkLen) {
    const checkedNew = checkAncestor(Object.keys(checked.ancestor), meta, metaLink, metaCheckLink,
      Object.keys(checked.ancestor).length);
    checked.ancestor = checkedNew.ancestor;
    Object.keys(checkedNew.errNames).forEach((errName) => {
      checked.errNames[errName] = checkedNew.errNames[errName];
    });
  }
  return checked;
}
