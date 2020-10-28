/* eslint no-sync:off */
/**
 * Created by kras on 09.07.16.
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const {processDir} = require('core/util/read');
const i18n = require('core/i18n');
const {format} = require('util');
const t = msg => i18n.t(msg)({domain: 'import'});

function parseMeta(fn) {
  const data = fs.readFileSync(fn, {encoding: 'utf-8'});
  const meta = path.extname(fn) === '.yml' ? yaml.safeLoad(data, 'utf-8') : JSON.parse(data);
  return meta;
}

/**
 * @param {String} src
 * @param {{}} options
 * @param {DbSync} options.sync
 * @param {MetaRepository} options.metaRepo
 * @param {Logger} options.log
 * @param {String} options.namespace
 * @returns {Promise}
 */
module.exports = function (src, options) {

  const isConfig = nm => ['.json', '.yml'].includes(path.extname(nm));
  const endsWith = (nm, end) => path.basename(nm, path.extname(nm)).substr(-(end.length)) === end;

  function meta() {
    const metas = [];
    const mByName = {};

    const md = path.join(src, 'meta');
    if (fs.existsSync(md)) {
      processDir(
        md,
        nm => isConfig(nm) && endsWith(nm, '.class'),
        (fn) => {
          const cm = parseMeta(fn);
          metas.push(cm);
          mByName[cm.name + '@' + (cm.namespace || options.namespace)] = cm;
        },
        (err) => {
          options.log.error(err);
        }
      );
    }

    function calcClassLevel(cm) {
      if (cm.ancestor) {
        let ancName = cm.ancestor;
        if (ancName.indexOf('@') < 0) {
          ancName = ancName + '@' + (cm.namespace || options.namespace || '');
        }

        let anc = null;

        if (mByName.hasOwnProperty(ancName)) {
          anc = mByName[ancName];
        } else {
          anc = options.metaRepo.getMeta(ancName, cm.version || null, cm.namespace || options.namespace || '');
          if (anc) {
            anc = anc.plain;
          }
        }

        if (anc) {
          return 1 + calcClassLevel(anc);
        }
      }
      return 0;
    }

    let promiseLevels = {};
    metas.forEach((m) => {
      let lvl = calcClassLevel(m);
      if (!promiseLevels.hasOwnProperty('l' + lvl)) {
        promiseLevels['l' + lvl] = {level: lvl, promises: []};
      }
      promiseLevels['l' + lvl].promises.push(() => options.sync.defineClass(m, options.namespace));
    });

    let execLevels = [];
    for (let lvl in promiseLevels) {
      if (promiseLevels.hasOwnProperty(lvl)) {
        execLevels.push(promiseLevels[lvl]);
      }
    }

    execLevels.sort((a, b) => a.level - b.level);

    let worker = Promise.resolve();
    execLevels.forEach((lvl) => {
      worker = worker.then(() => {
        let p = Promise.resolve();
        for (let j = 0; j < lvl.promises.length; j++) {
          p = p.then(lvl.promises[j]);
        }
        return p;
      });
    });
    return worker;
  }

  const nd = path.join(src, 'navigation');
  const navNodes = {};
  function navigation() {
    let promise = Promise.resolve();
    if (fs.existsSync(nd)) {
      processDir(
        nd,
        isConfig,
        (fn) => {
          if (endsWith(fn, '.section')) {
            const s = parseMeta(fn);
            promise = promise.then(() => options.sync.defineNavSection(s, options.namespace));
          } else {
            const n = parseMeta(fn);
            const pth = path.parse(fn);
            navNodes[(n.namespace || options.namespace) + '@' + n.code] = true;
            promise = promise.then(() => options.sync.defineNavNode(n, path.relative(nd, pth.dir), options.namespace));
          }
        },
        (e) => {
          options.log.error(e);
        }
      );
    }
    return promise;
  }

  const wfNames = {};
  const wfd = path.join(src, 'workflows');
  function workflows() {
    let promise = Promise.resolve();
    if (fs.existsSync(wfd)) {
      processDir(
        wfd,
        isConfig,
        (fn) => {
          const wf = parseMeta(fn);
          const parts = path.basename(fn, path.extname(fn)).replace(/\.wf$/, '').split('@');
          if (parts.length > 1) {
            wf.namespace = wf.namespace || parts[1];
          }
          wfNames[wf.name + '@' + (wf.namespace || options.namespace)] = true;
          promise = promise.then(() => options.sync.defineWorkflow(wf, options.namespace));
        },
        (err) => {
          options.log.error(err);
        }
      );
    }
    return promise;
  }

  function defineView(fn, parts) {
    const vm = parseMeta(fn);
    const pth = path.parse(fn);
    let cn = parts[parts.length - 1];
    if (cn.indexOf('@') < 0 && options.namespace) {
      cn = cn + '@' + options.namespace;
    }
    if (parts[0].indexOf('@') < 0) {
      parts[0] = options.namespace + '@' + parts[0];
    }
    return () => options.sync.defineView(
      vm,
      cn,
      pth.name,
      parts.slice(0, parts.length - 1).join('.')
      );
  }

  function defineWorkflowView(fn, parts) {
    const vm = parseMeta(fn);
    const pth = path.parse(fn);
    let cn = pth.name;
    if (cn.indexOf('@') < 0 && options.namespace) {
      cn = cn + '@' + options.namespace;
    }
    if (parts[0].indexOf('@') < 0) {
      parts[0] = parts[0] + '@' + options.namespace;
    }
    return () => options.sync.defineView(
      vm,
      cn,
      'item',
      'workflows:' + parts.join('.')
    );
  }

  const wfvd = path.join(src, 'wfviews');
  const vd = path.join(src, 'views');

  function views() {
    let promise = Promise.resolve();
    if (fs.existsSync(vd)) {
      processDir(
        vd,
        isConfig,
        (fn) => {
          try {
            const pth = path.parse(fn);
            const parts = path.relative(vd, pth.dir).split(path.sep);
            let isWfV = false;
            if (parts[0] === 'workflows' && parts.length === 3) {
              let navNodeCode = parts.slice(0, parts.length - 1).join('.');
              if (parts[0].indexOf('@') < 0) {
                navNodeCode = options.namespace + '@' + navNodeCode;
              }
              if (!navNodes[navNodeCode] && !options.metaRepo.getNode(navNodeCode, options.namespace)) {
                let wfName = parts[1];
                if (wfName.indexOf('@') < 0) {
                  wfName = wfName + '@' + options.namespace;
                }
                let wfExists = false;
                try {
                  let wf = options.metaRepo.getWorkflow(pth.name, wfName, options.namespace);
                  wfExists = wf;
                } catch (err) {
                  wfExists = false;
                }
                if (wfNames[wfName] || wfExists) {
                  isWfV = true;
                  (options.log || console).warn(
                    format(
                      t(
                        'View model for workflow status %s.%s ' +
                        'is placed into "workflows" directory instead of "wfviews" directory. ' +
                        'That way is deprecated and will be removed later versions.'
                      ),
                      wfName,
                      parts[2]  
                    )
                  );
                } else {
                  (options.log || console).warn(format(t('Failed to interpret view model path %s!'), fn));
                  return;
                }
              }
            }
            if (isWfV) {
              promise = promise.then(defineWorkflowView(fn, parts.slice(1, parts.length)));
            } else {
              promise = promise.then(defineView(fn, parts));
            }
          } catch (e) {
            options.log.error(e);
          }
        },
        (err) => {
          options.log.error(err);
        }
      );
    }
    if (fs.existsSync(wfvd)) {
      processDir(
        wfvd,
        isConfig,
        (fn) => {
          try {
            const pth = path.parse(fn);
            const parts = path.relative(wfvd, pth.dir).split(path.sep);
            promise = promise.then(defineWorkflowView(fn, parts));
          } catch (e) {
            options.log.error(e);
          }
        },
        (err) => {
          options.log.error(err);
        }
      );
    }
    return promise;
  }

  function userTypes() {
    let promise = Promise.resolve();
    const utd = path.join(src, 'meta', 'types');
    if (fs.existsSync(utd)) {
      processDir(
        utd,
        nm => isConfig(nm) && endsWith(nm, '.type'),
        (fn) => {
          const s = parseMeta(fn);
          promise = promise.then(() => options.sync.defineUserType(s));
        },
        (err) => {
          options.log.error(err);
        }
      );
    }
    return promise;
  }

  return options.sync.init()
    .then(meta)
    .then(userTypes)
    .then(navigation)
    .then(workflows)
    .then(views);
};
