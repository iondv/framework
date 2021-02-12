/**
 * Testing the compliance of meta files with the format JSON
 */
const path = require('path');

const processDir = require('core/util/read').processDir;

describe('# Checking whether metadata files match the formats', function () {
  this.timeout(120000);
  const pathApp = path.join(__dirname, '../../applications');
  it('Checking for format compliance JSON in ' + pathApp, (done) => {
    let filesList = [];
    let errFiles = [];
    processDir(pathApp,
      (nm) => {return nm.substr(-5) === '.json';},
      (fn) => {if (fn.indexOf('node_modules') === -1) {
        filesList.push(fn);
        try {
          require(fn);
        } catch (err) {
          errFiles.push(fn);
          console.error('Error in', err.message);
        }
      }},
      (err) => {console.error('File reading error', err);});
    if (errFiles.length) {
      done(new Error ('There is an error in the format in the metadata and data files JSON'));
    } else {
      console.info('Verified JSON files', filesList.length);
      done();
    }
  });
});
