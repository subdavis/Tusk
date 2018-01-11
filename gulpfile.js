var gulp = require('gulp');
var webpack = require('webpack');
var webpackStream = require('webpack-stream');
const sources = ['src/**/*.js', 'src/**/*.vue', 'lib/**/*.js', 'services/**/*.js', 'background/*.js', 'tests/**/!(bundle.build.js)*.js'];

gulp.task('webpack', function() {
	return gulp.src('')
		.pipe(webpackStream(require('./webpack.config.js'), webpack)
			.on('error', function(err) {
				console.log(err);
				this.emit('end');
			}))
		.pipe(gulp.dest('dist'));
});

gulp.task('webpacktests', function () {
	return gulp.src('')
		.pipe(webpackStream(require('./webpack.test.config.js'), webpack)
			.on('error', function(err) {
				console.error(err);
				this.emit('end');
			}))
		.pipe(gulp.dest('tests'))
})

gulp.task('watch', ['webpack'], function() {
	gulp.watch(sources, ['webpack']);
});

gulp.task('watchtests', ['webpacktests'], function() {
	gulp.watch(sources, ['webpacktests'])
})