const _          = require('underscore');

module.exports = function (grunt) {
  'use strict';

  const env = grunt.option('env') || process.env.GRUNT_ENV || 'development';

  let webpackConfig = require('./webpack.config')(env);
  let webpackConfigWithWatch = _.defaults({ watch: true, keepalive: true, failOnError: false }, webpackConfig);

  // Project configuration.
  grunt.initConfig({
    meta: {
      bin: {
        coverage: 'bin/coverage'
      },
      coverageBaseUrl: 'bin/coverage/bin/js/'
    },

    clean: {
      build: ['<%= meta.bin.coverage %>'],
      bin: ['bin']
    },
    // Instrument the files for coverage
    instrument: {
      files: 'bin/js/**/*.js',
      options: {
        basePath: '<%= meta.bin.coverage %>'
      }
    },
    reloadTasks: {
      rootPath: '<%= meta.bin.coverageBaseUrl %>'
    },
    storeCoverage: {
      options: {
        dir: '<%= meta.bin.coverage %>'
      }
    },
    makeReport: {
      src: '<%= meta.bin.coverage %>/*.json',
      options: {
        type: 'cobertura',
        dir: '<%= meta.bin.coverage %>'
      }
    },
    copy: {
      main: {
        files: [{
          expand: true,
          cwd: 'src/',
          src: ['img/**'],
          dest: 'bin/'
        }]
      }
    },
    gruntWatch: {
      assets: {
        files: ['src/img/**'],
        tasks: 'copy:main'
      }
    },
    webpack: {
      options: {
        stats: (env === 'development'),
        progress: (env === 'development')
      },

      build: webpackConfig,
      watch: webpackConfigWithWatch
    },
    concurrent: {
      watch: {
        tasks: ['gruntWatch', 'webpack:watch'],
        options: {
          logConcurrentOutput: true
        }
      }
    },
    checkDependencies: {
      this: {}
    }
  });

  grunt.loadNpmTasks('grunt-cache-busting');
  grunt.loadNpmTasks('grunt-check-dependencies');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-karma');
  grunt.loadNpmTasks('grunt-newer');
  grunt.loadNpmTasks('grunt-webpack');
  grunt.loadNpmTasks('grunt-concurrent');

  /** Grunt Tasks **/

  // Instrument JS and run tests to get a coverage report
  grunt.registerTask('coverage', ['clean', 'instrument', 'reloadTasks', 'jasmine:coverage', 'storeCoverage', 'makeReport']);

  // Default task.
  grunt.registerTask('default', ['build']);

  grunt.renameTask('watch', 'gruntWatch');
  grunt.registerTask('watch', ['checkDependencies', 'concurrent:watch']);

  // needed to make grunt-istanbul storeReport
  grunt.event.on('jasmine.coverage', function (coverage) {
    global.__coverage__ = coverage;
  });

  var buildTasks = [
    'checkDependencies',
    'copy',
    // We must specify the specific webpack subtask so that all of them don't
    // run and we don't watch when we just want to build
    'webpack:build'
  ];

  grunt.registerTask('build', buildTasks);
};
