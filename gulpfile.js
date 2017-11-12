var gulp = require('gulp');
var webpack = require('webpack');
var webpackStream = require('webpack-stream');

gulp.task('webpack', function() {
	return gulp.src('')
		.pipe(webpackStream(require('./webpack.config.js'), webpack)
			.on('error', function(err) {
				console.log(err);
				this.emit('end');
			}))
		.pipe(gulp.dest('dist'));
});

gulp.task('watch', ['webpack'], function() {
	gulp.watch(['src/**/*.js', 'src/**/*.vue', 'lib/**/*.js', 'services/**/*.js'], ['webpack']);
});