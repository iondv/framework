/**
 * Тестируем достижимость класса из навигации
 * Таск https://ion-dv.atlassian.net/browse/IONCORE-412
 */

const path = require('path');

const getDirList = require('test/lib/get-meta').getDirList;
const getMetaFiles = require('test/lib/get-meta').getMetaFiles;


describe('# Проверка достижимости классов из навигации', function () {
  this.timeout(120000);
  const pathApplications = path.join(__dirname, '../../applications');
  const appList = getAppList(pathApplications);
  appList.forEach((pathApp)=> {
    checkMetaLinks(pathApplications, pathApp);
  })
});

function checkMetaLinks(pathApplications, pathApp) {
  describe(`Проверка достижимости классов из навигации в приложении ${pathApp}`, () => {
    let meta = {};
    let navigation = {};
    let workflow = {};
    let metaLink = {};
    let metaCheckLink = [];
    before('Инициализация меты', () => {
      meta = getMetaFiles(path.join(pathApplications, pathApp, 'meta'));
      navigation = getMetaFiles(path.join(pathApplications, pathApp, 'navigation'));

      try { // Отсутствие папки бизнес-процессов допустимо
        workflow = getMetaFiles(path.join(pathApplications, pathApp, 'workflows'));
      } catch (e) {
        console.warn (e.message);
      }
    });
    it('Связываем классы по навигации и что такие классы есть в мете', () => {
      let errMeta = [];
      let startingMetaLink = Object.keys(metaLink).length;
      Object.keys(navigation).forEach((navItem)=> { // Отбираем классы по навигации
        if (meta[navigation[navItem].classname]) {
          if (navigation[navItem].type === 1) {
            metaLink[navigation[navItem].classname] = true;
            metaCheckLink.push(navigation[navItem].classname);
          }
        } else if (navigation[navItem].type === 1) {
          console.error(`В навигации ${navItem} ссылка на отсутствующий калсс ${navigation[navItem].classname}`);
          errMeta.push(navigation[navItem].classname);
        }
      });
      if (errMeta.length) {
        throw (new Error (`В файлах метаданных ссылки на некоректные классы ${errMeta}`));
      }
      console.info('При анализе навигации добавлено ссылок на мету', Object.keys(metaLink).length - startingMetaLink);
    });
    it.skip('Связываем классы по ссылкам и коллекциям и что такие классы естьв  мете', () => {

    });

    it('Проверяем связанные классы по иерархии наследования и проверяем что такие классы есть в мете', () => {
      let startingMetaLink = Object.keys(metaLink).length;
      let childFailedLink = checkAncestor(Object.keys(meta),meta, metaLink, metaCheckLink);
      if (Object.keys(childFailedLink.ancestor).length) {
        console.warn('Классы проверенные от навигации, через ссылки и коллекции и иерархию наследования ' +
          'по которым нет связей в мете',
          Object.keys(childFailedLink.ancestor));
        // Не является ошибкой, т.к. классы могут быть throw (new Error ('В файлах метаданных есть классы в иерархии, которые нигде не используются'));
      }
      if (Object.keys(childFailedLink.errNames).length) {
        throw (new Error
          (`В иерархии наследованиия, некорректные родительские классы ${Object.keys(childFailedLink.errNames)}`));
      }
      console.info('При анализе наследования добавлено ссылок на мету', Object.keys(metaLink).length - startingMetaLink);
    });
    it('Проверка представлений, для которых нет классов', () => {
      let errViews = [];
      let view = [];
      try {
        view = getDirList(path.join(pathApplications, pathApp, 'views')).dirList;
      } catch (e) {
        console.warn (e.message);
      }
      view.forEach((viewName)=> {
        if (!meta[viewName] && viewName !== 'workflows') {
          errViews.push(viewName);
          console.error(`Для представления ${viewName} отсутствует мета класса`);
        }
      });
      if (errViews.length) {
        throw (new Error (`Представления для отстутствующих классов ${errViews}`));
      }
    });
    it('Проверка бизнес-процессов, для которых нет классов', () => {
      let errWF = [];
      Object.keys(workflow).forEach((wfItem)=> { // Отбираем классы по бизнес-процессам
        if (! meta[workflow[wfItem].wfClass]) {
          console.error(`В бизнес-процессе ${wfItem} ссылка на отсутствующий калсс ${workflow[wfItem].wfClass}`);
          errWF.push(workflow[wfItem].wfClass);
        }
      });
      if (errWF.length) {
        throw (new Error (`В файлах метаданных ссылки на некоректные классы ${errWF}`));
      }
    });
    it('Проверка лишних бизнес-процессов в представлениях', () => {
      let errViews = [];
      let view = [];
      try {
        view = getDirList(path.join(pathApplications, pathApp, 'views/workflows')).dirList;
      } catch (e) {
        console.warn (e.message);
      }
      view.forEach((viewName)=> {
        if (!workflow[viewName]) {
          errViews.push(viewName);
          console.error(`Для представления бизнес-процесса ${viewName} отсутствует бизнес-процесс`);
        }
      });
      if (errViews.length) {
        throw (new Error (`Представления для отстутствующих классов ${errViews}`));
      }
    });
  });
  it.skip('Проверка лишних статутусов и классов представлений, по которым нет меты в бизнес-процессах', () => {
    let errState = [];
    let errViews = [];
    let view = [];
    try {
      view = getDirList(path.join(pathApplications, pathApp, 'views/workflows')).dirList;
    } catch (e) {
      console.warn (e.message);
    }
    view.forEach((viewName)=> {
      if (!meta[viewName] && viewName !== 'workflows') {
        errViews.push(viewName);
        console.error(`Для представления ${viewName} отсутствует мета класса`);
      }
    });
    if (errViews.length) {
      throw (new Error (`Представления для отстутствующих классов ${errViews}`));
    }

  });
}

function getAppList(appSourcePath) {
  return getDirList(appSourcePath).dirList;
}

function checkAncestor(metaNames, meta, metaLink, metaCheckLink, childNotLinkLen = 0) {
  let checked = {ancestor:{}, errNames:{}};
  metaNames.forEach((className)=> {
    if (meta[className]) { // Класс есть в мете
      if (meta[className].ancestor) { // Есть родитель?
        if (meta[meta[className].ancestor]) { // Родитель есть в классе меты
          if (metaLink[meta[className].ancestor]) { // Родитель уже есть среди ссылочных объектов, значит достижим от навигации, добавляем наследника
            metaLink[meta[className].name] = true;
            metaCheckLink.push(meta[className].name);
          } else if (metaLink[meta[className].name]) { // Наследник уже есть среди ссылочных объектов, значит достижим от навигации, добавляем родителя
            metaLink[meta[className].ancestor] = true;
            metaCheckLink.push(meta[className].ancestor);
          } else {
            checked.ancestor[meta[className].name] = true;
            checked.ancestor[meta[className].ancestor] = true;
          }
        } else {
          console.error(`В классе ${className} отсутствующий в мете родительский класс ${meta[className].ancestor}`);
          checked.errNames[meta[className].ancestor] = true;
        }
      }
    } else {
      console.error(`В мете при проверке наследования, отсутствующий класс ${className}`);
      checked.errNames[className] = true;
    }
  });
  if (Object.keys(checked.ancestor).length !== 0 &&
    Object.keys(checked.ancestor).length !== childNotLinkLen) {
    let checkedNew = checkAncestor(Object.keys(checked.ancestor), meta, metaLink, metaCheckLink,
      Object.keys(checked.ancestor).length);
    checked.ancestor = checkedNew.ancestor;
    Object.keys(checkedNew.errNames).forEach((errName)=> {
      checked.errNames[errName] = checkedNew.errNames[errName];
    })
  }
  return checked;
}