'use strict';

var path = require('path'),
    childProcess = require('child_process'),
    gutil = require('gulp-util'),
    chalk = require('chalk'),
    through = require('through2'),
    phantomjs = require('phantomjs'),
    binPath = phantomjs.path;

module.exports = function (params) {
    var options = params || {};

    binPath = options.binPath || binPath;

    return through.obj(function (file, enc, cb) {
        var absolutePath = path.resolve(file.path),
            isAbsolutePath = absolutePath.indexOf(file.path) >= 0,
            childArgs = [];

        if (options['phantomjs-options'] && options['phantomjs-options'].length) {
            childArgs.push(options['phantomjs-options']);
        }

        childArgs.push(
            require.resolve('qunit-phantomjs-runner'),
            (isAbsolutePath ? 'file:///' + absolutePath.replace(/\\/g, '/') : file.path)
        );

        if (options.timeout) {
            childArgs.push(options.timeout);
        }

        if (file.isStream()) {
            this.emit('error', new gutil.PluginError('gulp-qunit', 'Streaming not supported'));
            return cb();
        }

        var self = this;

        childProcess.execFile(binPath, childArgs, function(err, stdout, stderr) {
            var passed = true,
                out,
                result,
                color,
                test;

            gutil.log('Testing ' + file.relative);

            if (stdout) {
                try {
                    stdout.trim().split('\n').forEach(function(line) {
                        if (line.indexOf('{') !== -1) {
                            out = JSON.parse(line.trim());
                            self.emit('qunit-report', out, file);

                            result = out.stats;

                            color = result.failures > 0 ? chalk.red : chalk.green;

                            gutil.log('Took ' + result.duration + ' ms to run ' + chalk.blue(result.tests) + ' tests. ' + color(result.passes + ' passed, ' + result.failures + ' failed.'));

                            if (out.failures) {
                                out.failures.forEach(function(item) {
                                    gutil.log(chalk.red('Test failed') + ': ' + chalk.red(item.fullTitle) + ': \n' + item.error);
                                });
                            }
                        }
                    });
                } catch (e) {
                    this.emit('error', new gutil.PluginError('gulp-qunit', e));
                }
            }

            if (stderr) {
                gutil.log(stderr);
                this.emit('error', new gutil.PluginError('gulp-qunit', stderr));
                passed = false;
            }

            if (err) {
                gutil.log('gulp-qunit: ' + chalk.red('✖ ') + 'QUnit assertions failed in ' + chalk.blue(file.relative));
                this.emit('error', new gutil.PluginError('gulp-qunit', err));
                passed = false;
            } else {
                gutil.log('gulp-qunit: ' + chalk.green('✔ ') + 'QUnit assertions all passed in ' + chalk.blue(file.relative));
            }

            this.emit('gulp-qunit.finished', { 'passed': passed });

            this.push(file);

            return cb();
        }.bind(this));
    });
};
