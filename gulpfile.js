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
var merge = require('merge-stream');

var output = {
	chrome: './out/chrome',
	website: './out/web'
};

function getCRC(filename) {
	return crc.crc32(fs.readFileSync(path.join(output.website, filename), {encoding: 'utf8'}));
}

function gzipRes(dest) {
	var out = Array.prototype.slice.call(arguments, 1).map(function(stream) {
		return stream.pipe(gulp.dest(dest))
			.pipe(gzip())
			.pipe(gulp.dest(dest));
	});

	return merge.apply(null, out);
}

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

gulp.task('website-resources', function() {
	del.sync([output.website]);

	var css = gulp.src('./style.css')
		.pipe(minifyCss({processImport: true}));

	var js = gulp.src(['./lib/online-app.js'])
		.pipe(browserify({
			insertGlobals : false,
			debug : false
		}))
		.pipe(uglify());

	return gzipRes(output.website, css, js);
});

gulp.task('website', ['website-resources'], function() {
	// calculate crc32 of static files
	var css = getCRC('style.css');
	var js  = getCRC('online-app.js');

	var html = gulp.src('index.html')
		.pipe(replace('<link rel="stylesheet" href="style.css" />', '<link rel="stylesheet" href="/-/' + css + '/style.css" />'))
		.pipe(replace('<script src="./node_modules/requirejs/require.js" data-main="./lib/online-app"></script>', '<script src="/-/' + js + '/online-app.js"></script>'))
		.pipe(gulp.dest(output.website));

	return html;
});

gulp.task('chrome', ['chrome-compile'], function() {
	return gulp.src(['*.*'], {cwd: output.chrome})
		.pipe(zip('chrome.zip'))
		.pipe(gulp.dest(output.chrome));
});

gulp.task('default', ['chrome', 'website']);