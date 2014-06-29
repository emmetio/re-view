var gulp = require('gulp');
var browserify = require('gulp-browserify');
var minifyCss = require('gulp-minify-css');
var del = require('del');
var zip = require('gulp-zip');
var merge = require('merge-stream');

var output = {
	chrome: './out/chrome'
};

gulp.task('watch', function() {
	gulp.watch(['lib/**/*.{js,css}'], ['default']);
});

gulp.task('chrome-compile', function() {
	del.sync([output.chrome]);
	
	var css = gulp.src('./ui/ui.css')
		.pipe(minifyCss({processImport: true}))
		.pipe(gulp.dest(output.chrome));


	var js = gulp.src(['./lib/chrome/app.js', './lib/chrome/background.js'])
		.pipe(browserify({
			insertGlobals : false,
			debug : false
		}))
		.pipe(gulp.dest(output.chrome));

	var misc = gulp.src(['./lib/chrome/manifest.json', './lib/chrome/*.png'])
		.pipe(gulp.dest(output.chrome));

	return merge(css, js, misc);
});

gulp.task('chrome', ['chrome-compile'], function() {
	return gulp.src(['*.*'], {cwd: output.chrome})
		.pipe(zip('chrome.zip'))
		.pipe(gulp.dest(output.chrome));
});

gulp.task('default', ['chrome']);