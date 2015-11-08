module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('manifest.json'),
    clean: ['build', '<%= pkg.name %>.zip'],
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %>, '
          + 'Copyright <%= grunt.template.today("yyyy") %> Steven Campbell\n'
          + '*/\n',
        mangle: false,
        preserveComments: 'some'
      },
      target: {
        files: [
          {expand: true, src: 'popups/**/*.js', dest:'build/'},
          {expand: true, src: 'background/**/*.js', dest:'build/'},
          {expand: true, src: 'services/**/*.js', dest:'build/'},
          {expand: true, src: 'options/**/*.js', dest:'build/'},
          {expand: true, src: ['*.js', '!Gruntfile.js', '!tests/*', '!bower_components/**/*'], dest:'build/'}
          ]
      }
    },
    copy: {
      bower: {
        files: [
          {expand: true, cwd: 'bower_components/Case/dist/', src: 'case.min.js', dest: 'lib/'},
          {expand: true, cwd: 'bower_components/json-formatter/dist/', src: 'json-formatter.min.js', dest: 'lib/'},
          {expand: true, cwd: 'bower_components/json-formatter/dist/', src: 'json-formatter.min.css', dest: 'lib/'},
          {expand: true, cwd: 'bower_components/angular/', src: 'angular.min.css', dest: 'lib/'},
          {expand: true, cwd: 'bower_components/angular/', src: 'angular.min.js', dest: 'lib/'},
          {expand: true, cwd: 'bower_components/angular/', src: 'angular-csp.css', dest: 'lib/'},
          {expand: true, cwd: 'bower_components/angular-animate/', src: 'angular-animate.min.js', dest: 'lib/'},
          {expand: true, cwd: 'bower_components/angular-route/', src: 'angular-route.min.js', dest: 'lib/'},
          {expand: true, cwd: 'bower_components/angular-sanitize/', src: 'angular-sanitize.min.js', dest: 'lib/'},
          {expand: true, cwd: 'bower_components/animate.css/', src: 'animate.css', dest: 'lib/'}
          ]
      }
    },
    less: {
      target: {
        options: {
          ieCompat: false,
          banner: '/*! <%= pkg.name %>, '
            + 'Copyright <%= grunt.template.today("yyyy") %> Steven Campbell\n'
            + '    This file is generated.\n'
            + '*/\n',
        },
        files: {
          "popups/popup.css": "popups/popup.less",
          "options/options.css": "options/options.less"
        }
      }
    },
    cssmin: {
      target: {
        files: [
          {expand: true, src: 'popups/**/*.css', dest:'build/'},
          {expand: true, src: 'options/**/*.css', dest:'build/'},
          {expand: true, src: 'lib/**/*.css', dest:'build/'},
          {expand: true, src: '*.css', dest:'build/'}
          ]
      }
    },
    htmlmin: {
      options: {
      },
      files: {expand: true, src: ['**/*.html', '!node_modules/**/*.html', '!tests/**/*', '!bower_components/**/*'], dest: 'build/'}
    },
    compress: {
      options: {
        archive: "<%= pkg.name %>.zip"
      },
      target: {
        files: [
          {expand: true, cwd: 'build/', src: '**/*', dest:'/'},
          {expand: true, src: 'lib/*.js', dest: '/'},
          {expand: true, src: 'manifest.json', dest: '/'},
          {expand: true, src: 'license.txt', dest: '/'},
          {expand: true, src: 'assets/**/*', dest: '/'}
          ]
      }
    },
    watch: {
      less: {
        files: ['**/*.less', '!/bower_components/**/*'],
        tasks: ['less'],
        options: {

        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-compress');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-htmlmin');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-less');

  // Default task(s).
  grunt.registerTask('default', ['clean']);
  grunt.registerTask('package', ['clean', 'copy:bower', 'uglify', 'less', 'cssmin', 'htmlmin', 'compress']);
  grunt.registerTask('updatelib', ['copy:bower']);
  //grunt.registerTask('styles', ['watch']);

};
