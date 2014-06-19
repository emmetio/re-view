var gulp = require('gulp');
var browserify = require('gulp-browserify');

gulp.task('watch', function() {
	gulp.watch(['lib/**/*.{js,css}'], ['default']);
});

gulp.task('default', function() {
	gulp.src(['./manifest.json', './lib/view.css'])
        .pipe(gulp.dest('./out'));

	return gulp.src(['./lib/app.js', './lib/background.js'])
		.pipe(browserify({
          insertGlobals : false,
          debug : false
        }))
        .pipe(gulp.dest('./out'));
});