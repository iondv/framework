const url = require('url');

function urlResolver(uri) {
  if (arguments.length > 1) {
    let result = uri;
    for (let i = 1; i < arguments.length; i++) {
      let tmp = arguments[i];
      if (tmp) {
        if (tmp[0] === '/') {
          tmp = tmp.substr(1);
        }
        result = url.resolve(result, tmp);
      }
    }
    return result;
  }
  return uri;
}

exports.urlResolver = urlResolver;

function slashChecker(path) {
  if (path && path.slice(-1) !== '/') {
    return path + '/';
  }
  return path || '';
}

exports.slashChecker = slashChecker;

function ensureDirSep(dir) {
  if (typeof dir === 'string') {
    return dir.replace('\\', '/');
  }
  return dir;
}

exports.ensureDirSep = ensureDirSep;
