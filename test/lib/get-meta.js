const fs = require('fs');
const path = require('path');
const processDir = require('core/util/read').processDir;

function getDirList(sourcePath) {
  let fileList = [];
  let dirList = [];
  try {
    fs.accessSync(sourcePath, fs.constants.F_OK);
    let files = fs.readdirSync(sourcePath);
    for (let i = 0; i < files.length; i++) {
      let stat = fs.lstatSync(path.join(sourcePath, files[i]));
      if (stat.isDirectory()) {
        dirList.push(files[i]);
      } else {
        fileList.push(files[i]);
      }
    }
  } catch (e) {
    throw e;
  }
  return {dirList, fileList};
}
module.exports.getDirList = getDirList;

function getMetaFiles(pathMeta) {
  let metaType = path.basename(pathMeta);
  let meta = {};
  processDir(pathMeta,
    (nm) => {return nm.substr(-5) === '.json';},
    (fn) => {
      try {
        tempMetaClass = require(fn);
        if (metaType === 'meta') {
          meta[tempMetaClass.name] = tempMetaClass;
        } else if (metaType === 'navigation') {
          meta[tempMetaClass.code] = tempMetaClass;
        } else {
          console.error('Необрабатываемый тип меты', metaType);
        }
      } catch (err) {
        console.error('Ошибка в', err.message);
      }
    },
    (err) => {console.error('Ошибка считывания файлов', err);});
  return meta;
}

module.exports.getMetaFiles = getMetaFiles;