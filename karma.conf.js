var config = require('./gulptask.conf.js');
var join = require('path').join;

var filesFE = [join(config.path._srcFE, config.folder._js, '**/*')];
var fileTestsFE = join(config.path._testFE, '**/*.spec.js');

module.exports = function (conf) {
  conf.set({
    // Base path, that will be used to resolve files and exclude
    // basePath: '',
    frameworks: ['mocha','chai'],

    // List of files / patterns to load in the browser
    files: filesFE.concat(fileTestsFE),
    // Пример задания файлов явно
    // [
    //      'app/**/*.js',
    //      'test/**/*.test.js'
    //      {pattern: './app/**/*.js', included: true},
    //      {pattern: './test/**/*.js', included: false},
    //      {pattern: './node_modules/should/should.js', included: false}
    //     'sqrt.js',
    //     'test/frontend/**/*.js'
    //    ],
    // List of files to exclude
    exclude: [join(config.path._srcFE, config.folder._js, 'scripts.js')],
    // use dots reporter, as travis terminal does not support escaping sequences
    // possible values: 'dots', 'progress', 'junit', 'teamcity'
    // coverage reporter generates the coverage
    reporters: ['progress', 'coverage'],
    // Source files, that you wanna generate coverage for
    // do not include tests or libraries
    // (these files will be instrumented by Istanbul)

    preprocessors: {'./frontend/src/js/**/*.js': ['coverage'] },//'*.js'

    // Web server port
    port: 9876,

    // Cli runner port
    // runnerPort: 9100,

    // Enable / disable colors in the output (reporters and logs)
    colors: true,
    // Level of logging. possible values: LOG_DISABLE || LOG_ERROR || LOG_WARN || LOG_INFO || LOG_DEBUG
    logLevel: conf.LOG_INFO,
    // Enable / disable watching file and executing tests whenever any file changes
    // autoWatch: true,
    // Start these browsers, currently available:
    // - Chrome
    // - ChromeCanary
    // - Firefox
    // - Opera
    // - Safari (only Mac)
    // - PhantomJS
    // - IE (only Windows)
    browsers: ['PhantomJS'],

    // Optionally, configure the reporter
    coverageReporter: {
      type: 'html',
      dir: './test/.coverage/FE'
    },
    // Auto run tests on start (when browsers are captured) and exit
    singleRun: true,
    // Report which specs are slower than 500ms
    reportSlowerThan: 500
  });
};
