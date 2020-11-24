/**
 * Created by kras on 18.07.16.
 */
'use strict';
const contexts = {};
const clone = require('clone');
const {format} = require('util');
const {t} = require('core/i18n');

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
        if (!nm || skip && skip.indexOf(nm) >= 0) {
          return null;
        }
        if (scope.hasOwnProperty(nm)) {
          return scope[nm];
        }
        if (components.hasOwnProperty(nm)) {
          return loadComponent(nm, components[nm], scope, components, init, skip, cwd);
        }
        throw new Error(format(t('Component %s not found.'), nm));
      } else if (options.substr(0, 7) === 'lazy://') {
        let nm = options.substr(7);
        if (!nm && skip && skip.indexOf(nm) >= 0) {
          return null;
        }
        if (components.hasOwnProperty(nm)) {
          return createProxy(scope, options.substr(7));
        }
        throw new Error(format(t('Component %s not found.'), nm));
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
    } else {
      throw new Error(format(t('Component %s has a cyclic reference to another component.'), name));
    }
  }

  let result = null;
  let modulePath = component.module || component.executable;
  if (modulePath) {
    if (modulePath.indexOf('./') === 0) {
      modulePath = (cwd ? cwd + '/' : '') + modulePath.substr(2);
    }
    component.loaded = true;
    let F = require(modulePath);
    let opts = processOptions(component.options, scope, components, init, skip, cwd);
    if (component.module) {
      result = new F(opts || {});
    } else {
      result = function () {
        return F.call(scope, opts || {});
      };
      if (component.initMethod) {
        if (typeof F[component.initMethod] != 'function') {
          throw new Error(format(t('Method %s of component %s not found.'), component.initMethod, name));
        }
        result[component.initMethod] = F[component.initMethod];
      } else if (typeof F._initialization === 'function') {
        result._initialization = F._initialization;
      }
    }
    scope[name] = result;
    component.name = name;
    if (component.initMethod) {
      init.push(component);
    } else if (typeof result._initialization === 'function') {
      component.initLevel = component.initLevel || Infinity;
      init.push(component);
    }
  }
  return result;
}

/**
 * @param {String} context
 * @param {{}} struct
 * @param {{}} [presets]
 * @param {String} [parentContext]
 * @param {Array} [skip]
 * @param {String} cwd
 * @returns {Promise}
 */
function di(context, struct, presets, parentContext, skip, cwd) {
  let components = clone(struct, false);
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

  init.sort((a, b) => (a.initLevel || 0) - (b.initLevel || 0));

  contexts[context] = scope;

  let p = Promise.resolve();
  init.forEach((initiator) => {
    if (scope[initiator.name]) {
      const c = scope[initiator.name];
      const im = initiator.initMethod || '_initialization';
      if (typeof c[im] == 'function') {
        p = p.then(() => c[im].call(c, scope));
      } else {
        return Promise.reject(new Error(format(t('Method %s of component %s not found.'), im, initiator.name)));
      }
    } else {
      return Promise.reject(new Error(format(t('Component %s not found.'), initiator.name)));
    }
    p = p.then();
  });

  return p.then(() => scope);
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

function recCopyOption (v, src, dest) {
  let ref = false;
  if (!v) {
    return;
  } else if (typeof v === 'string') {
    if (v.substr(0, 6) === 'ion://') {
      v = v.substr(6);
      ref = true;
    } else if (v.substr(0, 7) === 'lazy://') {
      v = v.substr(7);
      ref = true;
    }
    if (ref) {
      recCopy(v, src, dest);
    }
  } else if (Array.isArray(v)) {
    v.forEach(v1 => recCopyOption(v1, src, dest));
  } else if (typeof v === 'object') {
    if (v && v.module && v.name && v.options) {
      recCopyOptions(v.options, src, dest);
    } else {
      recCopyOptions(v, src, dest);
    }
  }
  return;
}

function recCopyOptions(options, src, dest) {
  for (let nm in options) {
    if (options.hasOwnProperty(nm)) {
      recCopyOption(options[nm], src, dest);
    }
  }
}

function recCopy(nm, src, dest) {
  let component = src[nm];
  if (component && !dest.hasOwnProperty(nm)) {
    dest[nm] = clone(component, false);
    if (component.options) {
      recCopyOptions(component.options, src, dest);
    }
  }
}

function extract(nm, src) {
  let result = {};
  if (Array.isArray(nm)) {
    nm.forEach((nm1) => {
      recCopy(nm1, src, result);
    });
  } else if (typeof nm === 'string') {
    recCopy(nm, src, result);
  }
  return result;
}

module.exports.extract = extract;