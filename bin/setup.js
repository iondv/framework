'use strict';
/* eslint no-process-exit:off */
/**
 * Created by kras on 22.08.16.
 */
const worker = require('../lib/deploy');
const config = require('../config');
const di = require('core/di');
const path = require('path');
const errorSetup = require('core/error-setup');
const alias = require('core/scope-alias');
const path = require('path');
const extend = require('extend');
const i18n = require('core/i18n');
i18n.default(config.lang);
const t = msg => i18n.t(msg)({lang, domain: 'bg'});
errorSetup();

var IonLogger = require('core/impl/log/IonLogger');

var sysLog = new IonLogger({});

if (process.argv.length > 2) {
  let app = process.argv[2];
  let resetSettings = false;
  let overrideArrays = false;
  let preserveModifiedSettings = false;
  for (let i = 3; i < process.argv.length; i++) {
    switch (process.argv[i]) {
      case '--reset':
        resetSettings = true;
        break;
      case '--rwa':
        overrideArrays = true;
        break;
      case '--sms':
        preserveModifiedSettings = true;
        break;
      default:
        break;
    }
  }

  i18n.load(path.normalize(path.join(__dirname, '..', 'i18n')))
    .then(di('boot', config.bootstrap, {sysLog: sysLog}, null, ['rtEvents']))
    .then(scope =>
      di(
        'app',
        extend(true, config.di, scope.settings.get('plugins') || {}),
        {},
        'boot',
        ['auth', 'background', 'sessionHandler', 'scheduler', 'application']
      )
    )
    .then(scope => alias(scope, scope.settings.get('di-alias')))
    .then(scope =>
      worker(
        path.join(__dirname, '..', 'applications', app),
        {resetSettings, overrideArrays, preserveModifiedSettings, settings: scope.settings}
      ).then(() => scope)
    )
    .then(scope => scope.dataSources.disconnect())
    .then(() => {
      console.info(t('Setup complete.'));
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(130);
    });
}
