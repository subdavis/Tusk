module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('manifest.json'),
    clean: ['build', '<%= pkg.name %>.zip'],
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %>, '
          + ' Copyright <%= grunt.template.today("yyyy") %> Steven Campbell\n'
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
          {expand: true, src: ['*.js', '!Gruntfile.js'], dest:'build/'}
          ]
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
      files: {expand: true, src: ['**/*.html', '!node_modules/**/*.html'], dest: 'build/'}
    },
    compress: {
      options: {
        archive: "<%= pkg.name %>.zip"
      },
      target: {
        files: [
          {expand: true, cwd: 'build/', src: '**/*', dest:'/'},
          {expand: true, src: 'lib/*.js', dest: '/'},
          {expand: true, src: 'icons/*', dest: '/'},
          {expand: true, src: 'manifest.json', dest: '/'},
          {expand: true, src: 'license.txt', dest: '/'},
          ]
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

  // Default task(s).
  grunt.registerTask('default', ['clean']);
  grunt.registerTask('package', ['clean', 'uglify', 'cssmin', 'htmlmin', 'compress']);

};