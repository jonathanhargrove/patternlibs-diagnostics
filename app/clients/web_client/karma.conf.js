// Karma configuration
// Generated on Wed Oct 19 2016 14:03:57 GMT-0600 (MDT)
var webpackConfig = require('./webpack.config')('test');

// This prevents karma-webpack from trying to emit in-memory files for
// additional entry chunks
// See: https://github.com/webpack-contrib/karma-webpack/issues/173
delete webpackConfig.entry;

module.exports = function (config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '.',

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine'],

    // list of files / patterns to load in the browser
    files: specFiles().concat(cssFiles()),

    // list of files to exclude
    exclude: [
    ],

    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      'src/js/spec/**/*.+(js)': ['webpack', 'sourcemap'],
      'src/fonts/icomoon.*': ['webpack']
    },

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: [process.env.KARMA_REPORTER || 'dots'],

    specReporter: {
      maxLogLines: 10,
      suppressErrorSummary: false,
      suppressFailed: false,
      suppressPassed: false,
      suppressSkipped: true,
      showSpecTiming: false,
      failFast: false
    },

    // web server port
    port: 9876,

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_ERROR,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,

    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: [process.env.KARMA_BROWSER || 'Chrome'],
    browserNoActivityTimeout: 100000,

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false,

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: Infinity,

    webpack: webpackConfig,
    webpackMiddleware: {
      stats: 'errors-only'
    },

    customLaunchers: {
      'IE10': {
        base: 'VirtualBoxBrowser',
        config: {
          vm_name: 'IE10 - Win7'
        }
      },
      'IE11': {
        base: 'VirtualBoxBrowser',
        config: {
          vm_name: 'IE11 - Win7'
        }
      },
      'MSEdge': {
        base: 'VirtualBoxBrowser',
        config: {
          vm_name: 'MSEdge - Win10'
        }
      },
      DockerChrome: {
        base: 'Chrome',
        flags: ['--no-sandbox']
      }
    }
  });
};

function specFiles () {
  if (process.env.KARMA_SPEC_FILES) {
    return process.env.KARMA_SPEC_FILES.split(',');
  } else {
    return ['src/js/spec/index.js'];
  }
}

function cssFiles () {
  return ['bin/styles/main.bundle.css'];
}
