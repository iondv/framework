/**
 * Created by IVAN KUZNETSOV{piriflegetont@gmail.com} on 19.09.2018.
 */

const path = require('path');
const {readFilesDir} = require('../lib/fileSystem');
const fs = require('fs');
const fx = require('mkdir-recursive');
let fixed = false;
let execSync = require('child_process').execSync;
const os = require('os');
const rmDir = require('rmdir-recursive').sync;

function GetPackFromRemote() {
  this.directory = '';
  this.createTemp();
}
GetPackFromRemote.prototype = {
  createTemp: function (){
    if (this.directory && this.directory.length > 0)
      this.clear();
    let tempName = new Date();
    tempName = tempName.getTime() + '';
    this.directory = path.join(os.tmpdir(), tempName);
    fx.mkdirSync(this.directory);
    console.log(this.directory);
    execSync('git init', {cwd: this.directory});
  },
  getName: function (remote) {
    try {
      //console.log(`git fetch ${remote}`);
      try {
        execSync(`git fetch ${remote}`, {cwd: this.directory, stdio: 'ignore'});
        //console.log('git checkout');
        execSync(`git checkout FETCH_HEAD -- package.json`, {cwd: this.directory, stdio: 'ignore'});
        let file = fs.readFileSync(path.join(this.directory, 'package.json'));
        file = JSON.parse(file);
        return file;
      } catch (err) {
        return void 0;
      }
    } catch (err) {
      throw err;
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
          if (existEqual[key] || existNotEqual[key] || missing[key])
            continue;
          console.log('\t', key);
          if (bowerjson['dependencies'][key].indexOf('git') !== -1) {
            url = bowerjson['dependencies'][key];
            let gitVersion = void 0;
            if (url.indexOf('#') !== -1 ){
              gitVersion = url.split('#')[1];
              url = url.split('#')[0];
            }
            packageJson = localTempGit.getName(url);
            if (packageJson && packageJson.name === key)
              existEqual[key] = {version: gitVersion || '*', repository: bowerjson['dependencies'][key], data: packageJson};
            else if (packageJson && packageJson.name !== key)
              existNotEqual[key] = {version: gitVersion || '*', repository: bowerjson['dependencies'][key], data: packageJson};
            else
              missing[key] = bowerjson['dependencies'][key].indexOf('git');
            fs.writeFileSync(path.join(__dirname, 'packages', `${key}.json`), JSON.stringify(packageJson, null, '\t'));
          } else if (bowerjson['dependencies'][key].indexOf('#') !== -1) {
            let info = execSync(`bower info ${bowerjson['dependencies'][key]} --config.registry "https://registry.bower.io"`, bowerInfoOptions);
            url = info.split('\n')[0].match(/https:\/\/[^\n\r#]+/)[0];
            packageJson = localTempGit.getName(url);
            if (packageJson && packageJson.name === key)
              existEqual[key] = {repository: url, version: bowerjson['dependencies'][key].split('#')[1], data: packageJson};
            else if (packageJson && packageJson.name !== key)
              existNotEqual[key] = {repository: url, version: bowerjson['dependencies'][key].split('#')[1], data: packageJson};
            else
              missing[key] = `${url}#${bowerjson['dependencies'][key].split('#')[1]}`;
            fs.writeFileSync(path.join(__dirname, 'packages', `${key}.json`), JSON.stringify(packageJson, null, '\t'));
          } else {
            let info = execSync(`bower info ${key}#${bowerjson['dependencies'][key]} --config.registry "https://registry.bower.io"`, bowerInfoOptions);
            url = info.split('\n')[0].match(/https:\/\/[^\n#\r]+/)[0];
            packageJson = localTempGit.getName(url);
            if (packageJson && packageJson.name === key)
              existEqual[key] = {repository: url, version: bowerjson['dependencies'][key], data: packageJson};
            else if (packageJson && packageJson.name !== key)
              existNotEqual[key] = {repository: url, version: bowerjson['dependencies'][key], data: packageJson};
            else
              missing[key] = `${url}#${bowerjson['dependencies'][key]}`;
            fs.writeFileSync(path.join(__dirname, 'packages', `${key}.json`), JSON.stringify(packageJson, null, '\t'));
          }
        }
      }
    });
    fs.writeFileSync(path.join(__dirname, 'existEqual.json'), JSON.stringify(existEqual, null, '\t'));
    fs.writeFileSync(path.join(__dirname, 'existNotEqual.json'), JSON.stringify(existNotEqual, null, '\t'));
    fs.writeFileSync(path.join(__dirname, 'missing.json'), JSON.stringify(missing, null, '\t'));
  } catch (err) {
    console.warn(err);
  } finally {
    localTempGit.clear()
  }
}

function checkVersions() {
  try {
    let existEqual = fs.readFileSync(path.join(__dirname, 'existEqual.json'));
    existEqual = JSON.parse(existEqual);
    let missingVersion = {};
    for (let key in existEqual) {
      let exexc = execSync(`npm view ${key}@${existEqual[key].version}`, {cwd: path.join(__dirname, 'packages'), encoding: 'utf-8'});
      if (typeof exexc === 'undefined' || exexc.length === 0) {
        console.warn(`Can't view ${key}@${existEqual[key].version}`);
        missingVersion[key] = existEqual[key];
        delete existEqual[key];
      } else {
        console.log(`${key}@${existEqual[key].version}`);
      }
    }
    fs.writeFileSync(path.join(__dirname, 'existEqual.json'), JSON.stringify(existEqual, null, '\t'));
    fs.writeFileSync(path.join(__dirname, 'missingVersion.json'), JSON.stringify(missingVersion, null, '\t'));
  } catch (err) {
    console.log(err.message);
  }
}

function processBower() {
  let files = readFilesDir(process.cwd(), ['vendor', '.git', '.idea', 'node_modules']);
  files = files.filter(file => path.basename(file) === 'bower.json');
  console.log(`${files.length} bower files`);
  let missing = fs.readFileSync(path.join(__dirname, 'missing.json'));
  let existEqual = fs.readFileSync(path.join(__dirname, 'existEqual.json'));
  let existNotEqual = fs.readFileSync(path.join(__dirname, 'existNotEqual.json'));
  let missingVersion = fs.readFileSync(path.join(__dirname, 'missingVersion.json'));
  missing = JSON.parse(missing);
  existEqual = JSON.parse(existEqual);
  existNotEqual = JSON.parse(existNotEqual);
  missingVersion = JSON.parse(missingVersion);
  files.forEach((file, index, array) => {
    let folder = path.dirname(file);
    console.log(file.replace(`${process.cwd()}${path.delimiter}`, ''));
    if (fs.existsSync(file)){
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
          let version;
          if (dependencies[key].indexOf('#') !== -1) {
            version = dependencies[key].split('#')[1]
          } else if(dependencies[key].indexOf('.git') !== -1) {
            version = '*'
          } else {
            version = dependencies[key];
          }
          newDependencies[key] = version;
        }
      }
      for (let key in existNotEqual) {
        if (dependencies[key]) {
          let version;
          if (dependencies[key].indexOf('#') !== -1) {
            version = dependencies[key].split('#')[1]
          } else if(dependencies[key].indexOf('.git') !== -1) {
            version = '*'
          } else {
            version = dependencies[key];
          }
          console.log(key, dependencies[key].indexOf('#') !== -1, version);
          missingHere[key] = `${existNotEqual[key].repository}#${version}`;
        }
      }
      bowerjson.dependencies = newDependencies;
      let npmignore = '';
      let oldignore = '';
      if (fs.existsSync(path.join(folder, `.npmignore`))) {
        oldignore = fs.readFileSync(path.join(folder, `.npmignore`));
      }
      for (let key in missing) {
        if (dependencies[key]) {
          missingHere[key] = missing[key];
          if (oldignore.indexOf('node_modules/' + key + '\n') === -1) {
            npmignore = npmignore + '\nnode_modules/' + key;
          }
        }
      }
      if (npmignore.length > 0) {
        oldignore = oldignore[oldignore.length-1] === '\n' ? oldignore.splice(oldignore.length-1, 1) : oldignore;
        npmignore = oldignore + npmignore + '\n';
        fs.writeFileSync(path.join(folder, `.npmignore`), npmignore);
      }
      for (let key in missingVersion) {
        if (dependencies[key]) {
          let version;
          if (dependencies[key].indexOf('#') !== -1) {
            version = dependencies[key].split('#')[1];
          } else if(dependencies[key].indexOf('.git') !== -1) {
            version = '*'
          } else {
            version = dependencies[key];
          }
          missingHere[key] = `${missingVersion[key].repository}#${version}`;
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


module.exports.makeMigrationDict = makeMigrationDict;
module.exports.checkVersions = checkVersions;
module.exports.processBower = processBower;
module.exports.bower = function () {
  makeMigrationDict();
  checkVersions();
  processBower();
};