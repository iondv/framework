/**
 * Created by IVAN KUZNETSOV{piriflegetont@gmail.com} on 19.09.2018.
 */

const path = require('path');
const fs = require('fs');
const fx = require('mkdir-recursive');
let execSync = require('child_process').execSync;
const os = require('os');
const rmDir = require('rmdir-recursive').sync;
const ARRNOTFOUND = -1;
const FIRST = 0;

function GetPackFromRemote() {
  this.directory = '';
  this.createTemp();
}
GetPackFromRemote.prototype = {
  createTemp: function (){
    this.directory = path.join(os.tmpdir(), 'bowerAway');
    fx.mkdirSync(this.directory);
    console.log(this.directory);
  },
  getName: function (name, remote) {
    try {
      if (fs.existsSync(path.join(this.directory, name))) {
        rmDir(path.join(this.directory, name));
      }
      execSync(`git clone ${remote} ${name}`, {cwd: this.directory, stdio: 'ignore'});
      if (fs.existsSync(path.join(this.directory, name, 'package.json'))) {
        let file = fs.readFileSync(path.join(this.directory, name, 'package.json'));
        file = JSON.parse(file);
        return file;
      } else {
        return void 0;
      }
    } catch (err) {
      console.warn(err.message);
      return void 0;
    }
  },
  clear: function () {
    rmDir(this.directory);
  }
};

function makeMigrationDict() {
  let localTempGit = new GetPackFromRemote();
  try {
    let files = readFilesDir(process.cwd(), ['vendor', '.git', '.idea', 'node_modules']);
    files = files.filter(file => path.basename(file) === 'bower.json');
    console.log(`${files.length} bower files`);
    let missing = {};
    let existEqual = {};
    let existNotEqual = {};
    files.forEach((file, index, array) => {
      console.log(file.replace(`${process.cwd()}${path.delimiter}`, ''));
      if (fs.existsSync(file)){
        let bowerjson = fs.readFileSync(file);
        bowerjson = JSON.parse(bowerjson);
        let bowerInfoOptions = {encoding: 'utf-8'};
        let url;
        let packageJson;
        for (let key in bowerjson['dependencies']) {
          url = void 0;
          packageJson = void 0;
          let gitVersion = void 0;
          if (existEqual[key] || existNotEqual[key] || missing[key])
            continue;
          process.stdout.write('\t' + key + ' ');
          if (bowerjson['dependencies'][key].indexOf('.git') !== -1) {
            url = bowerjson['dependencies'][key];
            if (url.indexOf('#') !== -1 ){
              gitVersion = url.split('#')[1];
              url = url.split('#')[0];
            } else {
              gitVersion = '*'
            }
            packageJson = localTempGit.getName(key, url);
          } else if (bowerjson['dependencies'][key].indexOf('#') !== -1) {
            let info = execSync(`bower info ${bowerjson['dependencies'][key]} --config.registry "https://registry.bower.io"`, bowerInfoOptions);
            url = info.split('\n')[0].match(/https:\/\/[^\n\r#]+/)[0];
            gitVersion = bowerjson['dependencies'][key].split('#')[1];
            packageJson = localTempGit.getName(key, url);
          } else {
            let info = execSync(`bower info ${key}#${bowerjson['dependencies'][key]} --config.registry "https://registry.bower.io"`, bowerInfoOptions);
            url = info.split('\n')[0].match(/https:\/\/[^\n#\r]+/)[0];
            packageJson = localTempGit.getName(key, url);
            gitVersion = bowerjson['dependencies'][key];
          }
          if (packageJson && packageJson.name === key) {
            process.stdout.write('names equal\n');
            existEqual[key] = {version: gitVersion || '*', repository: url, data: packageJson};
          }
          else if (packageJson && packageJson.name !== key) {
            process.stdout.write('names NOT equal\n');
            existNotEqual[key] = {version: gitVersion || '*', repository: url, data: packageJson};
          }
          else {
            process.stdout.write('there is no package.json\n');
            missing[key] = {version: gitVersion || '*', repository: url, data: packageJson};
          }
        }
      }
    });
    let missingVersion = {};
    for (let key in existEqual) {
      let exexc = execSync(`npm view ${key}@${existEqual[key].version}`, {cwd: path.join(localTempGit.directory, key), encoding: 'utf-8'});
      if (typeof exexc === 'undefined' || exexc.length === 0) {
        console.warn(`Can't view ${key}@${existEqual[key].version}`);
        missingVersion[key] = existEqual[key];
        delete existEqual[key];
      } else {
        console.log(`${key}@${existEqual[key].version}`);
      }
    }
    if (!fs.existsSync(path.join(__dirname, 'bowerPackagesInfo')))
      fx.mkdirSync(path.join(__dirname, 'bowerPackagesInfo'));
    fs.writeFileSync(path.join(__dirname, 'bowerPackagesInfo', 'existEqual.json'), JSON.stringify(existEqual, null, '\t'));
    fs.writeFileSync(path.join(__dirname, 'bowerPackagesInfo', 'existNotEqual.json'), JSON.stringify(existNotEqual, null, '\t'));
    fs.writeFileSync(path.join(__dirname, 'bowerPackagesInfo', 'missing.json'), JSON.stringify(missing, null, '\t'));
    fs.writeFileSync(path.join(__dirname, 'bowerPackagesInfo', 'missingVersion.json'), JSON.stringify(missingVersion, null, '\t'));
  } catch (err) {
    console.warn(err);
  }
}

function parseVersion(value) {
  let version = void 0;
  if (value.indexOf('git') !== -1) {
    if (value.indexOf('#') !== -1 ){
      version = value.split('#')[1];
    } else {
      version = '*'
    }
  } else if (value.indexOf('#') !== -1) {
    version = value.split('#')[1];
  } else {
    version = value;
  }
  return version;
}

function processBower() {
  let files = readFilesDir(process.cwd(), ['vendor', '.git', '.idea', 'node_modules']);
  files = files.filter(file => path.basename(file) === 'bower.json');
  console.log(`${files.length} bower files`);
  let missing = fs.readFileSync(path.join(__dirname, 'bowerPackagesInfo', 'missing.json'));
  let existEqual = fs.readFileSync(path.join(__dirname, 'bowerPackagesInfo', 'existEqual.json'));
  let existNotEqual = fs.readFileSync(path.join(__dirname, 'bowerPackagesInfo', 'existNotEqual.json'));
  let missingVersion = fs.readFileSync(path.join(__dirname, 'bowerPackagesInfo', 'missingVersion.json'));
  missing = JSON.parse(missing);
  existEqual = JSON.parse(existEqual);
  existNotEqual = JSON.parse(existNotEqual);
  missingVersion = JSON.parse(missingVersion);
  files.forEach((file, index, array) => {
    if (fs.existsSync(file)){
      let folder = path.dirname(file);
      let missingHere = {};
      let bowerjson = fs.readFileSync(file);
      bowerjson = JSON.parse(bowerjson);
      let {dependencies} = bowerjson;

      if (typeof dependencies === 'undefined') {
        console.warn(`${file} don't have dependencies`);
        return file;
      }
      let newDependencies = {};
      for (let key in existEqual) {
        if (dependencies[key]) {
          newDependencies[key] = parseVersion(dependencies[key]);
        }
      }
      for (let key in existNotEqual) {
        if (dependencies[key]) {
          console.log(key, dependencies[key].indexOf('#') !== -1, parseVersion(dependencies[key]));
          missingHere[key] = `${existNotEqual[key].repository}#${parseVersion(dependencies[key])}`;
        }
      }
      bowerjson.dependencies = newDependencies;
      let npmignore = '';
      if (fs.existsSync(path.join(folder, `.npmignore`))) {
        fs.unlinkSync(path.join(folder, `.npmignore`));
      }
      for (let key in missing) {
        if (dependencies[key]) {
          missingHere[key] = `${missing[key].repository}#${parseVersion(dependencies[key])}`;
          if (npmignore.indexOf('node_modules/' + key + '\n') === -1) {
            npmignore = npmignore + 'node_modules/' + key + '\n';
          }
        }
      }
      if (npmignore.length > 0) {
        fs.writeFileSync(path.join(folder, `.npmignore`), npmignore);
      }
      for (let key in missingVersion) {
        if (dependencies[key]) {
          missingHere[key] = `${missingVersion[key].repository}#${parseVersion(dependencies[key])}`;
        }
      }
      if (typeof bowerjson.scripts === 'undefined') {
        bowerjson.scripts = {};
      }
      bowerjson.scripts.preinstall = `node ${path.join(__dirname, 'installPackagesFromGit.js')}`;
      fs.writeFileSync(path.join(folder, `missing.json`), JSON.stringify(missingHere, null, '\t'));
      fs.writeFileSync(path.join(folder, `package.json`), JSON.stringify(bowerjson, null, '\t'));
    }
  });
}

/**
 * Функция преобразует массив, содержащий массивы, в один массив
 * @param {[[]]} arr исходный массив
 * @returns {[]} массив результат
 */
function joinArray(arr) {
  return Array.prototype.concat.apply([], arr);
}

/**
 * Рекурсивно прочитать все файлы в директории и вернуть массив с их путями.
 * @param {string} currentPath папка, начиная с которой будет вестись поиск файлов.
 * @param {[string]} ignore имена папок, в которых не будет вестись поиск.
 * @returns {[string]} пути ко всем файлам в директории.
 */
function readFilesDir(currentPath, ignore) {
  const result = [];
  if(!Array.isArray(ignore))
    ignore = [];
  if (ignore.indexOf(path.basename(currentPath)) !== ARRNOTFOUND) {
    result.push(currentPath);
    return result;
  }
  const stat = fs.statSync(currentPath);
  if (stat.isDirectory()) {
    let dir = fs.readdirSync(currentPath);
    dir = dir.map(item => path.join(currentPath, item));
    dir = dir.map(item => readFilesDir(item, ignore));
    dir = dir.filter(item => item.length > FIRST);
    return joinArray(dir);
  }
  result.push(currentPath);
  return result;
}

function clear(filter) {
  let files = readFilesDir(process.cwd(), ['.git', '.idea', 'node_modules', 'vendor']);
  files = files.filter(file => path.basename(file) === 'node_modules' || path.basename(file) === 'vendor' || path.basename(file) === 'resources');
  if (filter)
    files = files.filter(filter);
  files.forEach((file) => {
    try {
      rmDir(file);
      console.log('Delete ', file);
    } catch (err) {
      console.warn(err.message);
    }
  });
}

module.exports.clear = clear;

module.exports.makeMigrationDict = makeMigrationDict;
module.exports.processBower = processBower;
module.exports.bower = function () {
  makeMigrationDict();
  processBower();
};