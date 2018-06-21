/**
 * Created by kras on 18.07.16.
 */
'use strict';
var contexts = {};

// jshint maxstatements: 35, maxcomplexity: 30, maxparams: 15

function createProxy(scope, name) {
  return new Proxy({}, {
    get: function (target, property) {
      return scope[name][property];
    },
    set: function (target, property, value) {
      scope[name][property] = value;
    },
    getPrototypeOf: function () {
      return Object.getPrototypeOf(scope[name]);
    }
  });
}

/**
 * @param {{}} options
 * @param {{}} components
 */
function normalizeOptions(options, components) {
  if (options) {
    let result;
    if (options instanceof Array) {
      result = [];
      for (let i = 0; i < options.length; i++) {
        result.push(normalizeOptions(options[i], components));
      }
      return result;
    } else if (options instanceof Object) {
      if (typeof options.module !== 'undefined') {
        result = options;
        if (options.name) {
          components[options.name] = options;
          result = 'ion://' + options.name;
          delete options.name;
        }
        if (options.options) {
          options.options = normalizeOptions(options.options, components);
        }
        return result;
      } else {
        result = {};
        for (let nm in options) {
          if (options.hasOwnProperty(nm)) {
            result[nm] = normalizeOptions(options[nm], components);
          }
        }
        return result;
      }
    }
  }
  return options;
}

/**
 * @param {{}} options
 * @param {{}} scope
 * @param {{}} components
 * @param {Array} init
 * @param {Array} skip
 * @param {String} cwd
 */
function processOptions(options, scope, components, init, skip, cwd) {
  if (options) {
    let result;
    if (typeof options === 'string') {
      if (options.substr(0, 6) === 'ion://') {
        let nm = options.substr(6);
        if (!nm) {
          return null;
        }
        if (scope.hasOwnProperty(nm)) {
          return scope[nm];
        }
        if (components.hasOwnProperty(nm)) {
          return loadComponent(nm, components[nm], scope, components, init, skip, cwd);
        }
        if (skip && skip.indexOf(nm) === -1) {
          throw new Error('Не найден компонент с именем ' + nm + '.');
        } else {
          return null;
        }
      } else if (options.substr(0, 7) === 'lazy://') {
        return createProxy(scope, options.substr(7));
      }
      return options;
    } else if (options instanceof Array) {
      result = [];
      for (let i = 0; i < options.length; i++) {
        result.push(processOptions(options[i], scope, components, init, skip, cwd));
      }
      return result;
    } else if (options instanceof Object) {
      if (typeof options.name !== 'undefined' && typeof options.module !== 'undefined') {
        return loadComponent(options.name, options, scope, components, init, skip, cwd);
      } else {
        result = {};
        for (let nm in options) {
          if (options.hasOwnProperty(nm)) {
            result[nm] = processOptions(options[nm], scope, components, init, skip, cwd);
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
 * @param {{}} component
 * @param {String} [component.module]
 * @param {String} [component.executable]
 * @param {{}} [component.config]
 * @param {String} [component.initMethod]
 * @param {Number} [component.initLevel]
 * @param {{}} scope
 * @param {{}} components
 * @param {Array} init
 * @param {Array} skip
 * @param {String} cwd
 * @returns {*}
 */
function loadComponent(name, component, scope, components, init, skip, cwd) {
  if (skip && skip.indexOf(name) !== -1) {
    return null;
  }

  if (component.loaded) {
    if (scope.hasOwnProperty(name)) {
      return scope[name];
    }
  }

  let result = null;
  let modulePath = component.module || component.executable;
  if (modulePath) {
    if (modulePath.indexOf('./') === 0) {
      modulePath = (cwd ? cwd + '/' : '') + modulePath.substr(2);
    }

    let F = require(modulePath);
    let opts = processOptions(component.options, scope, components, init, skip, cwd);
    if (component.module) {
      result = new F(opts);
    } else {
      result = function () {
        return F.call(scope, opts);
      };
      if (component.initMethod) {
        result[component.initMethod] = F[component.initMethod];
      }
    }
    scope[name] = result;
    component.name = name;
    component.loaded = true;
    if (component.initMethod) {
      init.push(component);
    }
  }
  return result;
}

function componentInitConstructor(component, method, scope) {
  return function () {
    return method.apply(component, [scope]);
  };
}

function levelConstructor(initLoaders) {
  return function () {
    let p;
    for (let i = 0; i < initLoaders.length; i++) {
      if (p) {
        p = p.then(initLoaders[i]);
      } else {
        p = initLoaders[i]();
      }
    }
    if (p) {
      return p;
    }
    return Promise.resolve();
  };
}

function diInit(levels) {
  let p;
  for (let i = 0; i < levels.length; i++) {
    if (p) {
      p = p.then(levels[i]);
    } else {
      p = levels[i]();
    }
  }

  if (p) {
    return p;
  }

  return Promise.resolve();
}

/**
 * @param {String} context
 * @param {{}} components
 * @param {{}} [presets]
 * @param {String} [parentContext]
 * @param {Array} [skip]
 * @param {String} cwd
 * @returns {Promise}
 */
function di(context, components, presets, parentContext, skip, cwd) {
  let scope = presets || {};
  if (parentContext && contexts.hasOwnProperty(parentContext)) {
    let pc = contexts[parentContext];
    for (let nm in pc) {
      if (pc.hasOwnProperty(nm)) {
        scope[nm] = pc[nm];
      }
    }
  }

  let init = [];

  let norm = {};
  for (let nm in components) {
    if (components.hasOwnProperty(nm) && components[nm].options) {
      normalizeOptions(components[nm], norm);
    }
  }

  let src = {};
  for (let nm in components) {
    if (components.hasOwnProperty(nm)) {
      src[nm] = components[nm];
    }
  }

  for (let nm in norm) {
    if (norm.hasOwnProperty(nm)) {
      src[nm] = norm[nm];
    }
  }

  for (let nm in src) {
    if (src.hasOwnProperty(nm)) {
      loadComponent(nm, src[nm], scope, src, init, skip, cwd);
    }
  }

  init.sort(function (a, b) {
    return (a.initLevel || 0) - (b.initLevel || 0);
  });

  contexts[context] = scope;

  let initLevels = [];
  let initLevel = [];
  for (let i = 0; i < init.length; i++) {
    initLevel.push(componentInitConstructor(scope[init[i].name], scope[init[i].name][init[i].initMethod], scope));
    if (i < init.length - 1) {
      if (init[i + 1].initLevel > init[i].initLevel) {
        initLevels.push(levelConstructor(initLevel));
        initLevel = [];
      }
    } else {
      initLevels.push(levelConstructor(initLevel));
    }
  }

  return diInit(initLevels)
    .then(
      function () {
        return Promise.resolve(scope);
      }
    );
}

module.exports = di;

/**
 * @param {String} name
 * @returns {*}
 */
module.exports.context = function (name) {
  if (contexts.hasOwnProperty(name)) {
    return contexts[name];
  }
  return {};
};
