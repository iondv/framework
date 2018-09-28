/**
 * Created by IVAN KUZNETSOV{piriflegetont@gmail.com} on 28.09.2018.
 */
let execSync = require('child_process').execSync;
const path = require('path');
//execSync(`npm i git-semver`, {cwd: __dirname});
const fs = require('fs');
const gitRemoteSemver = require('@absolunet/git-remote-semver');
var semver_tags = require('semver-tags');

function doit() {
  let missingPath =  path.join(__dirname, 'missing.json');
  let missing = fs.readFileSync(missingPath);
  missing = JSON.parse(missing);
  for (let key in missing) {
    let url = missing[key].split('#')[0];
    let version = missing[key].split('#')[1];
    try {
      execSync(`git clone ${url} ${key}`, {cwd: path.join(__dirname, 'test'), stdio: 'ignore'});
    } catch (err) {
      console.warn(err.message);
    }
    semver_tags({
      repoType: 'git', // 'git' or 'svn', Will attemp to to auto detect if omitted
      repoPath:  path.join(__dirname, 'test', key),
      satisfies: version
    }, function(err, tags) {
      execSync(`git checkout -b ${tags[tags.length -1]}`, {cwd: path.join(__dirname, 'test', key), stdio: 'ignore'});
      console.log(key, version, tags);
    });
  }
}
doit();