/**
 * Created by kras on 18.07.16.
 */
'use strict';

var contexts = {};

// jshint maxstatements: 30, maxcomplexity: 30
/**
 * @param {{}} options
 * @param {{}} scope
 * @param {{}} components
 * @param {Array} init
 */
function processOptions(options, scope, components, init) {
  if (options) {
    var nm, i, result;
    if (typeof options === 'string') {
      if (options.substr(0, 6) === 'ion://') {
        nm = options.substr(6);
        if (scope.hasOwnProperty(nm)) {
          return scope[nm];
        }
        if (components.hasOwnProperty(nm)) {
          return loadComponent(nm, components[nm], scope, components, init);
        }
        throw new Error('Не найден компонент с именем ' + nm + '.');
      }
      return options;
    } else if (options instanceof Array) {
      result = [];
      for (i = 0; i < options.length; i++) {
        result.push(processOptions(options[i], scope));
      }
      return result;
    } else if (options instanceof Object) {
      if (typeof options.name !== 'undefined' && typeof options.module !== 'undefined') {
        return loadComponent(options.name, options, scope, components, init);
      } else {
        result = {};
        for (nm in options) {
          if (options.hasOwnProperty(nm)) {
            result[nm] = processOptions(options[nm], scope);
          }
        }
        return result;
      }
    }
  }
  return options;
}

/**
 * @param {String} name
 * @param {{module: String, config: {}, initMethod: String, initLevel: Number}} component
 * @param {{}} scope
 * @param {{}} components
 * @param {Array} init
 * @returns {{}}
 */
function loadComponent(name, component, scope, components, init) {
  var constructor = require(component.module);
  var result = new constructor(processOptions(component.options, scope, components));
  scope[name] = result;
  component.name = name;
  if (component.initMethod) {
    init.push(component);
  }
  return result;
}

function componentInitConstructor(component, method) {
  return function () {
    return method.apply(component);
  };
}

function levelConstructor(initLoaders) {
  return function () {
    var promises = [];
    for (var i = 0; i < initLoaders.length; i++) {
      promises.push(initLoaders[i]());
    }
    return Promise.all(promises);
  };
}

function diInit(levels, level) {
  return function () {
    return new Promise(function (resolve, reject) {
      if (level < levels.length) {
        resolve();
        return;
      }

      levels[level]().then(diInit(levels, level + 1)).
      then(resolve).
      catch(reject);
    });
  };
}

/**
 * @param {String} context
 * @param {{}} components
 * @param {{}} [presets]
 * @param {String} [parentContext]
 * @returns {Promise}
 */
function di(context, components, presets, parentContext) {
  var nm, pc;
  var scope = presets || {};
  if (parentContext && contexts.hasOwnProperty(parentContext)) {
    pc = contexts[parentContext];
    for (nm in pc) {
      if (pc.hasOwnProperty()) {
        scope[nm] = pc[nm];
      }
    }
  }

  var init = [];

  for (nm in components) {
    if (components.hasOwnProperty(nm)) {
      loadComponent(nm, components[nm], scope, components, init);
    }
  }

  init.sort(function (a, b) {
    var lvl0 = a.initLevel || 0;
    var lvl1 = b.initLevel || 0;
    return lvl0 - lvl1;
  });

  contexts[context] = scope;

  var initLevels = [];
  var initLevel = [];
  for (var i = 0; i < init.length; i++) {
    initLevel.push(componentInitConstructor(scope[init[i].name], scope[init[i].name][init[i].initMethod]));
    if (i < init.length - 1) {
      if (init[i + 1].initLevel > init[i].initLevel) {
        initLevels.push(levelConstructor(initLevel));
        initLevel = [];
      }
    } else {
      initLevels.push(levelConstructor(initLevel));
    }
  }

  return new Promise(function (resolve, reject) {
    diInit(initLevels, 0, scope).then(
      function () {
        resolve(scope);
      }).
    catch(reject);
  });
}

module.exports = di;
