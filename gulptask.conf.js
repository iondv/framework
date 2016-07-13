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
    applications: './applications/',
    distr: './distr/',
    docker: './docker/',
    tmp: './.tmp',
    core: './core/',
    modules: './modules/',
    init: './app/init',
    bin: './bin/',
    nodeModules: './node_modules/',
    lib: './lib/',
    test: './test/',
    gulp: './gulp/',
    coverage: './test/.coverage',
    schema: './test/',
    testBE: './test/backend/',
    testFE: './test/frontend/',
    testME: './test/middleware/',
    testSlow: './test/slow/',
    testE2E: './test/e2e/',
    testCore: './test/core/',
    root: './'
  },
  folder: {
    templates: 'templates/',
    config: 'config/',
    nodeModules: 'node_modules/',
    initdata: 'init-data/',
    vendor: 'vendor/',
    js: 'js/',
    less: 'less/',
    sass: 'sass/',
    css: 'css/',
    img: 'img/',
    html: 'html/',
    fonts: 'fonts/',
    gulpdevel: 'devel/'
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
