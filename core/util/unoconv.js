'use strict';

const childProcess = require('child_process');
const mime = require('mime');
const {Readable} = require('stream');

const unoconv = exports = module.exports = {};
/*
  Let stderr = [];

  cp.stdout.on('data', (data) => {
    console.log(data);
    rs.push(data);
  });

  cp.stderr.on('data', (data) => {
    console.log('err', data);
    stderr.push(data);
  });

  cp.on('exit', () => {
    if (stderr.length) {
      console.log(Buffer.concat(stderr).toString());
      return rs.emit('error', new Error(Buffer.concat(stderr).toString()));
    }
    rs.push(null);
  });*/
function readStream(cp) {
  let missedErrors = [];
  let stderr = [];

  function onMissedError(err) {
    missedErrors.push(err);
  }

  function onStdErr(chunk) {
    stderr.push(chunk);
  }

  cp.stdout.on('error', onMissedError);
  cp.stdout.on('data', (data) => {console.log(data);});
  cp.stderr.on('data', onStdErr);

  return function () {
    return new Promise((resolve, reject) => {
      let error = missedErrors.shift();
      if (error) {
        cp.stdout.removeListener('error', onMissedError);
        return reject(error);
      };
      if (stderr.length) {
        cp.stderr.removeListener('data', onStdErr);
        return reject(new Error(Buffer.concat(stderr).toString()));
      }

      cp.stdout.on('data', ondata);
      cp.stdout.on('error', onerror);
      // Cp.stdout.on('end', onend);
      cp.stdout.resume();

      function ondata(chunk) {
        console.log('ondata', chunk);
        cp.stdout.pause();
        cleanup();
        resolve(chunk);
      }

      function onend() {
        cleanup();
        resolve(null);
      }

      function onerror(err) {
        cp.stdout.removeListener('error', onMissedError);
        cleanup();
        reject(err);
      }

      function cleanup() {
        cp.stdout.removeListener('data', ondata);
        cp.stdout.removeListener('error', onerror);
        // Cp.stdout.removeListener('end', onend);
      }
    });
  };

}

function stdoutStream(cp) {
  let rs = Readable();
  let reader = readStream(cp);

  rs._read = function () {
    console.log('reading');
    reader()
      .then(chunk => {
        console.log(chunk);
        this.push(chunk);
      })
      .catch(err => this.emit('error', err));
  };

  return rs;
}

function stdoutString(cp) {
  return new Promise(function (resolve, reject) {
    let stdout = [];
    let stderr = [];

    cp.stdout.on('data', (data) => {
      stdout.push(data);
    });

    cp.stderr.on('data', (data) => {
      stderr.push(data);
    });

    cp.on('exit', () => {
      if (stderr.length) {
        return reject(new Error(Buffer.concat(stderr).toString()));
      }

      resolve(Buffer.concat(stdout));
    });
  });
}

/**
* @param {String} file
* @param {String} outputFormat
* @param {Object} options
*/
unoconv.convert = function (file, outputFormat, options) {
  return new Promise(function (resolve, reject) {
    options = options || {};
    let bin = 'unoconv';

    let args = ['-f' + outputFormat, '--stdout'];

    if (options && options.port) {
      args.push('-p' + options.port);
    }

    if (typeof file === 'string') {
      args.push(file);
    } else {
      return reject(new Error('wrong file'));
    }

    if (options && options.bin) {
      bin = options.bin;
    }

    let child = childProcess.spawn(bin, args);

    if (options.returnStream) {
      return resolve(stdoutStream(child));
    }

    stdoutString(child).then(out => resolve(out)).catch(reject);
  });
};

/**
* Start a listener.
*
* @param {Object} options
* @return {ChildProcess}
*/
unoconv.listen = function (options) {
  let bin = 'unoconv';
  let args = ['--listener'];

  if (options && options.port) {
    args.push('-p' + options.port);
  }

  if (options && options.bin) {
    bin = options.bin;
  }

  return childProcess.spawn(bin, args);
};

/**
* Detect supported conversion formats.
*
* @param {Object|Function} options
*/
unoconv.detectSupportedFormats = function (options) {
  return new Promise(function (resolve, reject) {
    let bin = 'unoconv';

    if (options && options.bin) {
      bin = options.bin;
    }

    childProcess.execFile(bin, ['--show'], function (err, stdout, stderr) {
      if (err) {
        return reject(err);
      }

      // For some reason --show outputs to stderr instead of stdout
      let lines = stderr.split('\n');
      let detectedFormats = {
        document: [],
        graphics: [],
        presentation: [],
        spreadsheet: []
      };
      let docType = null;
      lines.forEach(function (line) {
        if (line === 'The following list of document formats are currently available:') {
          docType = 'document';
        } else if (line === 'The following list of graphics formats are currently available:') {
          docType = 'graphics';
        } else if (line === 'The following list of presentation formats are currently available:') {
          docType = 'presentation';
        } else if (line === 'The following list of spreadsheet formats are currently available:') {
          docType = 'spreadsheet';
        } else {
          var format = line.match(/^(.*)-/);
          if (format) {
            format = format[1].trim();
          }

          var extension = line.match(/\[(.*)\]/);
          if (extension) {
            extension = extension[1].trim().replace('.', '');
          }

          var description = line.match(/-(.*)\[/);
          if (description) {
            description = description[1].trim();
          }

          if (format && extension && description) {
            detectedFormats[docType].push({
                format: format,
                extension: extension,
                description: description,
                mime: mime.lookup(extension)
              });
          }
        }
      });

      if (detectedFormats.document.length < 1 &&
          detectedFormats.graphics.length < 1 &&
          detectedFormats.presentation.length < 1 &&
          detectedFormats.spreadsheet.length < 1) {
        return reject(new Error('Unable to detect supported formats'));
      }

      resolve(detectedFormats);
    });
  });
};

