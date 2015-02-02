/* global require */
'use strict';

var gulp = require('gulp');

// load plugins
var $ = require('gulp-load-plugins')();

var merge = require('merge-stream');
var pkg = require('./package.json');
var request = require('request');

gulp.task('package', function () {
    return gulp.src('addon/**/*')
        .pipe($.zip(pkg.name + '.xpi'))
        .pipe(gulp.dest('dist'));
});

gulp.task('clean', function () {
    var del = require('del');
    var vinylPaths = require('vinyl-paths');

    return gulp.src(['.tmp', 'dist'], { read: false })
        .pipe(vinylPaths(del));
});

gulp.task('default', ['package']);
