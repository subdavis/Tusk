var gulp = require('gulp');
var webpack = require('webpack');
var webpackStream = require('webpack-stream');

gulp.task('webpack-chrome', function() {
	return gulp.src('')
		.pipe(webpackStream(require('./webpack.chrome.config.js'), webpack)
			.on('error', function(err) {
				console.log(err);
				this.emit('end');
			}))
		.pipe(gulp.dest('dist-chrome'));
});

gulp.task('webpack-firefox', function() {
	return gulp.src('')
		.pipe(webpackStream(require('./webpack.firefox.config.js'), webpack)
			.on('error', function(err) {
				console.log(err);
				this.emit('end');
			}))
		.pipe(gulp.dest('dist-firefox'));
});

gulp.task('watch-chrome', ['webpack-chrome'], function() {
	gulp.watch(['src/**/*.js', 'src/**/*.vue', 'lib/**/*.js', 'services/**/*.js', 'background/*.js'], ['webpack-chrome']);
});

gulp.task('watch-firefox', ['webpack-firefox'], function() {
	gulp.watch(['src/**/*.js', 'src/**/*.vue', 'lib/**/*.js', 'services/**/*.js', 'background/*.js'], ['webpack-firefox']);
});