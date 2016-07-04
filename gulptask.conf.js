'use strict';
var portalURL;

if (process.env.NODE_ENV === 'development') {
  portalURL = 'http://localhost:3000/';
} else {
  portalURL = 'http://localhost:8888/';
}

/* Paths */
module.exports = {
  path: {
    _src: './src/',
    _srcFE: './src/frontend/',
    _distr: './distr/',
    _docker: './docker/',
    _public: './public/',
    _private: './private/',
    _tmp: './.tmp',
    _bower: './src/vendor/', // 2del - не используется
    _app: './app/',
    _meta: './metadata/',
    _core: './core/',
    _modules: './modules/',
    _init: './app/init',
    _bin: './bin/',
    _nodeModules: './node_modules/',
    _nmDebuglog: './node_modules/debug-log/',
    _nmMysqlext: './node_modules/mysql-utilities-ext/',
    _test: './test/',
    _gulp: './gulp/',
    _coverage: './test/.coverage',
    _testBE: './test/backend/',
    _testFE: './test/frontend/',
    _testME: './test/middleware/',
    _testSlow: './test/slow/',
    _testE2E: './test/e2e/',
    _testCORE:'./test/core/',
    _root: './'
  },
  folder: {
    _templates: 'templates/',
    _config: 'config/',
    _nodeModules: 'node_modules/',
    _initdata: 'init-data/',
    _vendor: 'vendor/',
    _js: 'js/',
    _less: 'less/',
    _sass: 'sass/',
    _css: 'css/',
    _img: 'img/',
    _html: 'html/',
    _fonts: 'fonts/',
    _gulpdevel: 'devel/'
  },
  file: {
    mainJS: 'main.js',
    // 2del        main_min_js:'main.min.js',
    // 2del       main_css:   'main.css',
    mainSass: 'main.scss',
    // 2del       main_min_css:'main.min.css',
    // 2del       index_html: 'index.html',
    yslowJS: 'yslow.js'
  },
  url: {
    portal: portalURL
  }
};
