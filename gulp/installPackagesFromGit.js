const execSync = require('child_process').execSync;
const path = require('path');
const fs = require('fs');
const fx = require('mkdir-recursive');
const os = require('os');
const semverTags = require('semver-tags');
const rmDir = require('rmdir-recursive').sync;
const wrench = require('wrench');
const util = require('util');

function checkVersion(options) {
  return new Promise((reslove, reject) => {
    semverTags(options, function(err, tags) {
      if (err) {
        console.log('err ', err);
        reject(err);
      }
      reslove(tags);
    });
  })
}

(async function () {
  let key;
  let nodeModulesFolder = path.join(process.cwd(), 'node_modules');
  process.on('exit', () => {
    if(key) {
      if (fs.existsSync(path.join(nodeModulesFolder, key, '.git')))
        rmDir(path.join(nodeModulesFolder, key, '.git'));
    }
  });
  let missingPath =  path.join(process.cwd(), 'missing.json');
  if (!fs.existsSync(missingPath)) {
    console.warn(`Can't install, folder ${missingPath} didn't exist!`);
    return;
  }
  let missing;
  try {
    missing = fs.readFileSync(missingPath);
    missing = JSON.parse(missing);
  } catch (err) {
    console.warn(err);
    return;
  }
  if (!fs.existsSync(nodeModulesFolder))
    fx.mkdirSync(nodeModulesFolder);
  for (key in missing) {
    if (missing.hasOwnProperty(key)) {
      try {
        if (!fs.existsSync(path.join(nodeModulesFolder, key))) {
          let url = missing[key].split('#')[0];
          let version = missing[key].split('#')[1];
          if (fs.existsSync(path.join(nodeModulesFolder, key))) {
            wrench.rmdirSyncRecursive(path.join(nodeModulesFolder, key));
          }
          if (fs.existsSync(path.join(os.tmpdir(), 'bowerAway', key)))
            wrench.copyDirSyncRecursive(path.join(os.tmpdir(), 'bowerAway', key), path.join(nodeModulesFolder, key));
          else
            execSync(`git clone ${url} ${key}`, {cwd: nodeModulesFolder, stdio: 'ignore'});

          let tags = await checkVersion({
            repoType: 'git',
            repoPath:  path.join(nodeModulesFolder, key),
            satisfies: version
          });
          if (Array.isArray(tags) && tags.length > 0) {
            let checkout = execSync(`git checkout tags/${tags[tags.length -1]} -b ${tags[tags.length -1]}`,
              {cwd: path.join(nodeModulesFolder, key), stdio: 'ignore', encoding: 'utf-8'});
            if (checkout && checkout.indexOf('error') !== -1 )
              console.warn(checkout);
            console.log(key, tags[tags.length -1]);
          } else if (version === '*') {
            //TODO Проверка на ветку
            console.log(key, 'master');
          } else {
            console.warn(`Не найдена подходящая версия ${key}`);
          }
          rmDir(path.join(nodeModulesFolder, key, '.git'));
          if (fs.existsSync(path.join(nodeModulesFolder, key, 'package.json'))) {
            let dep = fs.readFileSync(path.join(nodeModulesFolder,key, 'package.json'));
            dep = JSON.parse(dep);
            dep = dep.dependencies;
            let peerDep  = dep.peerDependencies;
            dep = Object.assign(dep, peerDep);
            for (let pack in dep) {
              if (dep.hasOwnProperty(pack) && !fs.existsSync(path.join(nodeModulesFolder, pack))) {
                console.log(`npm i ${pack}@${dep[pack]} in ${process.cwd()}`);
                try {
                  execSync(`npm i ${pack}@${dep[pack]}`, {cwd: process.cwd(), stdio: 'ignore'});
                } catch (err) {
                  if (err.error) {
                    console.warn(err.message);
                  }
                }
              }
            }
          }
        }
      } catch (err) {
        if (fs.existsSync(path.join(nodeModulesFolder, key, '.git')))
          rmDir(path.join(nodeModulesFolder, key, '.git'));
        console.warn(key, JSON.stringify(err, null, '\t'));
      }
    }
  }
})();