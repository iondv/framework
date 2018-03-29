/**
 * Тестируем достижимость класса из навигации
 * Таск https://ion-dv.atlassian.net/browse/IONCORE-412
 */

const path = require('path');

const getaDirList = require('test/lib/get-meta').getDirList;
const getMetaFiles = require('test/lib/get-meta').getMetaFiles;


describe('# Проверка достижимости классов из навигации', function () {
  this.timeout(120000);
  const pathApplications = path.join(__dirname, '../../applications');
  const appList = getaAppList(pathApplications);
  appList.forEach((pathApp)=> {
    checkMetaLinks(pathApplications, pathApp);
  })
});

function checkMetaLinks(pathApplications, pathApp) {
  it(`Проверка достижимости классов из навигации в приложении ${pathApp}`, (done) => {
    let meta = getMetaFiles(path.join(pathApplications, pathApp, 'meta'));
    let navigation = getMetaFiles(path.join(pathApplications, pathApp, 'navigation'));

    let metaLink = {};
    let metaCheckLink = [];
    Object.keys(navigation).forEach((navItem)=> {
      if (navigation[navItem].type === 1) {
        metaLink[navigation[navItem].classname] = true;
        metaCheckLink.push(navigation[navItem].classname);
      }
    });
    let childNotLink = [];
    Object.keys(meta).forEach((metaClassName)=> {  // TODO как-то не так работает, не должны  childNotLink быть в metaLink - а project добавляется
      if (meta[metaClassName].ancestor) {
        if (metaLink[meta[metaClassName].ancestor]) { // Родитель уже есть среди ссылочных объектов, значит достижим от навигации, добавляем
          console.log('@@', meta[metaClassName].ancestor, meta[metaClassName].name);
          metaLink[meta[metaClassName].name] = true;
          metaCheckLink.push(meta[metaClassName].name);
        } else {
          childNotLink.push(meta[metaClassName].name);
        }
      }
    });
    let childNotLink2 = [];
    childNotLink.forEach((metaClassName)=> {  // TODO как-то не так работает, после второго прохода должны были уменьшится
      if (meta[metaClassName].ancestor) {
        if (metaLink[meta[metaClassName].ancestor]) { // Родитель уже есть среди ссылочных объектов, значит достижим от навигации, добавляем
          console.log('@@', meta[metaClassName].ancestor, meta[metaClassName].name);
          metaLink[meta[metaClassName].name] = true;
          metaCheckLink.push(meta[metaClassName].name);
        } else {
          childNotLink2.push(meta[metaClassName].name);
        }
      }
    });
    console.log('childNotLink', childNotLink);
    console.log('childNotLink2', childNotLink2);
    // Проверка на родителя и доформирование metaCheckLink
    // Проверяем все связи по свойствам
    // metaCheckLink.forEach((className)=> {

    //});
    console.log('#', Object.keys(metaLink));




    done();

/*    if (errFiles.length) {
      done(new Error ('В файлах метаданных и данных ошибка в формате JSON'));
    } else {
      console.info('Проверенно JSON файлов', filesList.length);
      done();
    }*/
  });
}

function getaAppList(appSourcePath) {
  return getaDirList(appSourcePath).dirList;
}

