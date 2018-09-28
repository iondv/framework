/**
 * Created by IVAN KUZNETSOV{piriflegetont@gmail.com} on 19.09.2018.
 */

const path = require('path');
const {readFilesDir} = require('../lib/fileSystem');
const fs = require('fs');
const fx = require('mkdir-recursive');


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

function processBower() {
  let files = readFilesDir(process.cwd(), ['vendor', '.git', '.idea', 'node_modules']);
  files = files.filter(file => path.basename(file) === 'bower.json');
  console.log(`${files.length} bower files`);
  let missing = fs.readFileSync(path.join(__dirname, 'missing.json'));
  let existEqual = fs.readFileSync(path.join(__dirname, 'existEqual.json'));
  let existNotEqual = fs.readFileSync(path.join(__dirname, 'existNotEqual.json'));
  missing = JSON.parse(missing);
  existEqual = JSON.parse(existEqual);
  existNotEqual = JSON.parse(existNotEqual);
  files.forEach((file, index, array) => {
    console.log(file.replace(`${process.cwd()}${path.delimiter}`, ''));
    if (fs.existsSync(file)){
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
          newDependencies[key] = existEqual[key].version;
        }
      }
      for (let key in existNotEqual) {
        if (dependencies[key]) {
          newDependencies[key] = `${existNotEqual[key].repository}#${existNotEqual[key].version}`;
        }
      }
      bowerjson.dependencies = newDependencies;
      let folder = path.dirname(file);
      fs.writeFileSync(path.join(folder, `package.json`), JSON.stringify(bowerjson, null, '\t'));
    }
  });
}

function checkVersions() {
  try {
    let existEqual = fs.readFileSync(path.join(__dirname, 'existEqual.json'));
    existEqual = JSON.parse(existEqual);
    let missingVersion = {};
    for (let key in existEqual) {
      let exexc = execSync(`npm view ${key}@${existEqual[key].version}`, {cwd: path.join(__dirname, 'packages'), encoding: 'utf-8'});
      if (typeof exexc === 'undefined') {
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

module.exports.makeMigrationDict = makeMigrationDict;
module.exports.checkVersions = checkVersions;
module.exports.processBower = processBower;