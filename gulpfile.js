'use strict';

var gulp = require('gulp'),
    jshint = require('gulp-jshint'),
    mocha = require('gulp-mocha'),
    qunit = require('./index'),
    jscs = require('gulp-jscs');

var paths = {
    scripts: ['./*.js', './test/*.js', '!./gulpfile.js']
};

gulp.task('lint', function() {
    return gulp.src(paths.scripts)
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});

gulp.task('test', function() {
    return gulp.src('./test/*.js')
        .pipe(mocha({reporter: 'dot'}));
});

gulp.task('jscs', function () {
    return gulp.src(paths.scripts)
        .pipe(jscs());
});

gulp.task('qunit', function() {
    return gulp.src('./test/fixtures/passing.html')
        .pipe(qunit());
});

gulp.task('watch', function () {
    gulp.watch(paths.scripts, ['lint', 'jscs', 'test']);
});

gulp.task('default', ['lint', 'jscs', 'test', 'watch']);
