/**
 * Тестируем достижимость класса из навигации
 * Таск https://ion-dv.atlassian.net/browse/IONCORE-412
 */

const path = require('path');

const getDirList = require('test/lib/get-meta').getDirList;
const getMetaFiles = require('test/lib/get-meta').getMetaFiles;
const getViewsList = require('test/lib/get-meta').getViewsList;
const nz = require('test/lib/get-meta').normilizeNamespase;
const getNs = require('test/lib/get-meta').getNameSpace;

const TIMEOUT = 120000;
const NAV_TYPE_LIST_CLASS = 1;
const ARR_NOTFOUND = -1;
const PROP_TYPE_LINK = 13;
const PROP_TYPE_COL = 14;
const SKIP_NS = ['viewlib', 'fias'];

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
    if (SKIP_NS.indexOf(pathApp) === ARR_NOTFOUND) {
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
    let viewWfList = []; // Названия классов для представлений бизнес-процессов
    let viewWfListDir = []; // Папки статусов и представления бизнес-процессов
    before('Инициализация меты', () => {
      navigation = getMetaFiles(path.join(pathApplications, ns, 'navigation'));
      try { // Отсутствие папки бизнес-процессов, представлений допустимо
        viewList = getViewsList(path.join(pathApplications, ns, 'views'), 'workflows');
        workflow = getMetaFiles(path.join(pathApplications, ns, 'workflows'));
        viewWfList = getViewsList(path.join(pathApplications, ns, 'views/workflows'));
        viewWfListDir = getDirList(path.join(pathApplications, ns, 'views/workflows')).dirList;
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
          if (SKIP_NS.indexOf(getNs(className)) === ARR_NOTFOUND) {
            if (meta[className]) {
              metaLink[className] = true;
              metaCheckLink.push(className);
            } else {
              console.error(`В навигации ${navItem} ссылка на отсутствующий класс ${className}`);
              errMeta.push(className);
            }
          }
        }
      });
      if (errMeta.length) {
        throw (new Error(`В файлах метаданных ссылки на некоректные классы ${errMeta}`));
      }
      console.info('При анализе навигации добавлено ссылок на мету', Object.keys(metaLink).length - startingMetaLink);
    });
    it('Связываем классы по ссылкам и коллекциям и что такие классы есть в мете', () => {
      const errMeta = [];
      const startingMetaLink = Object.keys(metaLink).length;
      Object.keys(meta).forEach((className) => { // Отбираем классы по мете
        meta[className].properties = meta[className].properties || [];
        if (SKIP_NS.indexOf(getNs(className)) === ARR_NOTFOUND) {
          meta[className].properties.forEach((propItem) => {
            if (propItem.type === PROP_TYPE_LINK || propItem.type === PROP_TYPE_COL) {
              const propClassName = propItem.type === PROP_TYPE_LINK ?
                nz(propItem.refClass, ns) :
                nz(propItem.itemsClass, ns);
              if (meta[propClassName]) { // Родитель есть в классе меты
                if (!metaLink[propClassName]) { // Родитель уже есть среди ссылочных объектов, значит достижим от навигации, добавляем наследника
                  metaLink[propClassName] = true;
                  metaCheckLink.push(propClassName);
                }
              } else {
                console.error(`В классе ${className} отсутствующий в мете связанный класс ${propClassName}`);
                errMeta[propClassName] = true;
              }
            }
          });
        }
      });
      if (errMeta.length) {
        throw (new Error(`В ссылочных атрибутах указаны отсутствующие в мете классы ${errMeta}`));
      }
      console.info('При анализе ссылочных полей меты добавлено ссылок на мету', Object.keys(metaLink).length - startingMetaLink);
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
    it('Проверка бизнес-процессов, для которых нет классов', () => {
      const errWf = [];
      Object.keys(workflow).forEach((wfItem) => { // Отбираем классы по бизнес-процессам
        const wfClassName = nz(workflow[wfItem].wfClass, ns);
        if (!meta[wfClassName]) {
          console.error(`В бизнес-процессе ${wfItem} ссылка на отсутствующий калсс ${wfClassName}`);
          errWf.push(wfClassName);
        }
      });
      if (errWf.length) {
        throw (new Error(`В файлах метаданных ссылки на некоректные классы ${errWf}`));
      }
    });
    it('Проверка групп(папок) статусов и представлений для отсутствующих бизнес-процессов', () => {
      const errViews = [];
      viewWfList.forEach((viewName) => {
        if (!workflow[viewName]) {
          errViews.push(viewName);
          console
            .error(`Для группы (папки) представления/статусов бизнес-процесса ${viewName} отсутствует бизнес-процесс`);
        }
      });
      if (errViews.length) {
        console.log('##', Object.keys(workflow));
        throw (new Error(`Группы (папки) представления/статусов для отстутствующих бизнес процессов ${errViews}`));
      }
    });
    it('Проверка лишних статутусов и классов представлений, по которым нет меты в бизнес-процессах', () => {
      const errState = [];
      const errViews = [];
      viewWfListDir.forEach((wfViewDirName) => {
        const wfName = nz(wfViewDirName, ns);
        const stateWfDir = getDirList(path.join(pathApplications, ns, 'views/workflows', wfViewDirName)).dirList;
        stateWfDir.forEach((wfState) => {
          let stateFound = false;
          workflow[wfName].states.forEach((stateItem) => {
            if (stateItem.name === wfState) {
              stateFound = true;
            }
          });
          if (!stateFound) {
            errState.push(`${wfViewDirName}.${wfState}`);
            console.error(`Отсутствует статус ${wfState} в БП  ${wfName} отсутствует мета класса`);
          }
          const viewsWfOnState = getDirList(path.join(pathApplications,
            ns, 'views/workflows', wfViewDirName, wfState)).fileList;
          viewsWfOnState.forEach((viewClassName) => {
            viewClassName = nz(viewClassName.substr(0, viewClassName.length - '.json'.length), ns);
            if (!meta[viewClassName]) {
              errViews.push(`${wfViewDirName}.${wfState}:${viewClassName}`);
              console
                .error(`Отсутствует класс меты по представлению ${viewClassName} для статуса ${wfState} БП ${wfName}`);
            }
          });
        });
      });
      let errMessage = errState.length ?
        `Папки состояния с представлениями в бизнес-процессах не соотствуют статусам ${errState}` : '';
      errMessage = errViews.length ?  errMessage + '\n' +
        `Представления по папкам состояния в бизнес-процессах для отсутствюущих классов ${errViews}` : errMessage;
      if (errMessage) {
        throw (new Error(errMessage));
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
    if (SKIP_NS.indexOf(getNs(className)) === ARR_NOTFOUND) {
      if (meta[className]) { // Класс есть в мете
        if (meta[className].ancestor) { // Есть родитель?
          const ancestorName = nz(meta[className].ancestor,
            meta[className].namespace || className.substr(className.search('@') + 1));
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
