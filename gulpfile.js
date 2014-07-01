var fs = require('fs');
var path = require('path');

var crc = require('crc');
var gulp = require('gulp');
var browserify = require('gulp-browserify');
var minifyCss = require('gulp-minify-css');
var zip = require('gulp-zip');
var replace = require('gulp-replace');
var uglify = require('gulp-uglify');
var gzip = require('gulp-gzip');
var del = require('del');

var output = {
	chrome: './out/chrome',
	website: './out/web'
};

function getCRC(filename) {
	return crc.crc32(fs.readFileSync(path.join(output.website, filename), {encoding: 'utf8'}));
}

gulp.task('watch', function() {
	gulp.watch(['lib/**/*.{js,css}'], ['default']);
});

gulp.task('chrome-clean', function(cb) {
	del.sync([output.chrome]);
	cb();
});

gulp.task('chrome-css', ['chrome-clean'], function() {
	return gulp.src('./ui/ui.css')
		.pipe(minifyCss({processImport: true}))
		.pipe(gulp.dest(output.chrome));
});

gulp.task('chrome-js', ['chrome-clean'], function() {
	return gulp.src(['./lib/chrome/app.js', './lib/chrome/background.js'])
		.pipe(browserify({
			insertGlobals : false,
			debug : false
		}))
		.pipe(gulp.dest(output.chrome));
});

gulp.task('chrome-misc', ['chrome-clean'], function() {
	return gulp.src(['./lib/chrome/manifest.json', './lib/chrome/*.png'])
		.pipe(gulp.dest(output.chrome));
});

gulp.task('chrome', ['chrome-clean', 'chrome-css', 'chrome-js', 'chrome-misc'], function() {
	return gulp.src(['*.*'], {cwd: output.chrome})
		.pipe(zip('chrome.zip'))
		.pipe(gulp.dest(output.chrome));
});

gulp.task('website-clean', function(cb) {
	del.sync([output.website]);
	cb();
});

gulp.task('website-css', ['website-clean'], function() {
	return gulp.src('./style.css')
		.pipe(minifyCss({processImport: true}))
		.pipe(gulp.dest(output.website));
});

gulp.task('website-js', ['website-clean'], function() {
	return gulp.src(['./lib/online-app.js'])
		.pipe(browserify({
			insertGlobals : false,
			debug : false
		}))
		.pipe(uglify())
		.pipe(gulp.dest(output.website));
});

gulp.task('website-html', ['website-css', 'website-js'], function() {
	var css = getCRC('style.css');
	var js  = getCRC('online-app.js');

	return gulp.src('index.html')
		.pipe(replace('<link rel="stylesheet" href="style.css" />', '<link rel="stylesheet" href="/-/' + css + '/style.css" />'))
		.pipe(replace('<script src="./node_modules/requirejs/require.js" data-main="./lib/online-app"></script>', '<script src="/-/' + js + '/online-app.js"></script>'))
		.pipe(gulp.dest(output.website));
});

gulp.task('website-static', function() {
	return gulp.src(['favicon.ico'])
		.pipe(gulp.dest(output.website));
});

gulp.task('website-example', function() {
	return gulp.src(['example/**/*.*'])
		.pipe(gulp.dest(path.join(output.website, 'example')));
});

gulp.task('website', ['website-clean', 'website-html', 'website-static', 'website-example'], function() {
	return gulp.src(['*.{css,js,html,ico}'], {cwd: output.website})
		.pipe(gzip())
		.pipe(gulp.dest(output.website));
});

gulp.task('default', ['chrome', 'website']);