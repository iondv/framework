/**
 * Created by IVAN KUZNETSOV{piriflegetont@gmail.com} on 19.09.2018.
 */

const path = require('path');
const {readFilesDir} = require('../lib/fileSystem');
const fs = require('fs');
let fixed = false;

function makeMigrationDict() {
  let files = readFilesDir(process.cwd(), ['vendor', '.git', '.idea', 'node_modules']);
  files = files.filter(file => path.basename(file) === 'vendor');
  files.forEach((file, index, array) => {
    let packages = readFilesDir(file, ['vendor', '.git', '.idea', 'node_modules']);
    packages = packages.filter(pack => path.basename(pack) === 'bower.json');
    packages.forEach((pack, index, array) => {
      if (fs.existsSync(pack)){
        let bowerjson = fs.readFileSync(pack);
        bowerjson = JSON.parse(bowerjson);
      }
      if (fs.existsSync(path,join(path.dirname(pack), 'package.json'))) {
        let packagejson = fs.readFileSync(path,join(path.dirname(pack), 'package.json'));
        packagejson= JSON.parse(packagejson);
      }

    });
  });
}

function fixDependencies(json, bowerReference) {
  fixed =true;
  let olddependencies = json.dependencies;
  let newdependencies = {};
  for (let key in olddependencies) {
    if (bowerReference[key]) {
      newdependencies[bowerReference[key].name] = bowerReference[key].version;
    } else {
      newdependencies[key] = olddependencies[key];
    }
  }
  json.dependencies = newdependencies;
}

function convertToPackageJSON() {
  let bowerReference = fs.readFileSync(path.resolve(__dirname, '../', 'bowerref.json'));
  bowerReference = JSON.parse(bowerReference);
  let files = readFilesDir(process.cwd(), ['vendor', '.git', '.idea', 'node_modules']);
  files = files.filter(file => path.basename(file) === 'bower.json');
  files.forEach((file, index, array) => {
    let json = fs.readFileSync(file);
    json = JSON.parse(json);
    fixDependencies(json, bowerReference);
    if(fixed) {
      //console.log(path.resolve(file, '../', 'package.json'));
      fs.writeFileSync(path.resolve(file, '../', 'package.json'), JSON.stringify(json, null, '\t'));
      fixed = false;
    }
  });
}

module.exports.bower = convertToPackageJSON;


/*
*
 let was = bowerReference[0];
 let now = bowerReference[1];
 let wasArr = [];
 let nowArr = [];
 let all = {};
 for (let key in was) {
 wasArr.push({name: key, version: was[key]})
 }
 for (let key in now) {
 nowArr.push({name: key, version: now[key]})
 }
 wasArr.forEach((item, index) => {
 all[item.name] = nowArr[index];
 });
* */
