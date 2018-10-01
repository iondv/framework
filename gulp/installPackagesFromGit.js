const execSync = require('child_process').execSync;
const path = require('path');
const fs = require('fs');
const semverTags = require('semver-tags');

function checkVersion(options) {
  return new Promise((reslove, reject) => {
    semverTags(options, function(err, tags) {
      if (err)
        reject(err);
      reslove(tags);
    });
  })
}

(async function () {
  let missingPath =  path.join(process.cwd(), 'missing.json');
  if (!fs.existsSync(missingPath)) {
    console.warn(`Can't install, folder ${missingPath} didn't exist!`);
  }
  return;
  let missing;
  try {
    missing = fs.readFileSync(missingPath);
    missing = JSON.parse(missing);
  } catch (err) {
    console.warn(err);
    return;
  }
  for (let key in missing) {
    if (missing.hasOwnProperty(key)) {
      try {
        let url = missing[key].split('#')[0];
        let version = missing[key].split('#')[1];
        let nodeModulesFolder = path.join(process.cwd(), 'node_modules');
        execSync(`git clone ${url} ${key}`, {cwd: nodeModulesFolder, stdio: 'ignore'});
        let tags = await checkVersion({
          repoType: 'git',
          repoPath:  path.join(__dirname, 'test', key),
          satisfies: version
        });
        execSync(`git checkout -b ${tags[tags.length -1]}`, {cwd: path.join(nodeModulesFolder, key), stdio: 'ignore'});
        console.log(key, tags[tags.length -1]);
      } catch (err) {
        console.warn(key, err.message);
      }
    }
  }
})();