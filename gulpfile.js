var gulp = require('gulp');
var browserify = require('gulp-browserify');
var minifyCss = require('gulp-minify-css');

gulp.task('watch', function() {
	gulp.watch(['lib/**/*.{js,css}'], ['default']);
});

gulp.task('default', function() {
	gulp.src('./ui/ui.css')
		.pipe(minifyCss({processImport: true}))
		.pipe(gulp.dest('out/'));

	gulp.src(['./manifest.json'])
        .pipe(gulp.dest('./out'));

	return gulp.src(['./lib/chrome-app.js', './lib/chrome-background.js'])
		.pipe(browserify({
          insertGlobals : false,
          debug : false
        }))
        .pipe(gulp.dest('./out'));
});