var fs = require('fs');
var os = require('os');
var chalk = require('chalk');
var gulp = require('gulp');
var gutil = require('gulp-util');
var less = require('gulp-less');
var sass = require('gulp-sass');
var ejs = require('gulp-ejs');
var uglify = require('gulp-uglify');
var minifycss = require('gulp-minify-css');
var minifyejs = require('gulp-minify-ejs');
var minimist = require('minimist');
var argv = minimist(process.argv.slice(2));
var exec = require('child_process').exec;
var browserSync = require('browser-sync').create();
var c = require('./c');
var config = require('./config');
var log = require('./log');

var __dirname__ = '';
var __uglify__ = 0;
var __version__ = 0;

//编译javascript
gulp.task('scripts', function() {
    var dir = '../'+__dirname__+'/src/js/';
    fs.exists(dir, function (exists) {
        if (!exists) return;
        var files = fs.readdirSync(dir);
        for(var f in files) {
            c.js(dir+files[f], __dirname__, __uglify__);
        }
    });
});

//编译html
gulp.task('html', function() {    
    if(__uglify__) {
        return gulp.src('../'+__dirname__+'/src/html/*.html')
        .pipe(ejs({version: __version__ ? config.version || new Date().getTime().toString().substr(0, 10) : ''}))
        .pipe(minifyejs())
        .pipe(gulp.dest('../'+__dirname__+'/dist/html'));
    } else {
        return gulp.src('../'+__dirname__+'/src/html/*.html')
        .pipe(ejs({version: __version__ ? config.version || new Date().getTime().toString().substr(0, 10) : ''}))
        .pipe(gulp.dest('../'+__dirname__+'/dist/html'));
    }
});

//编译sass
gulp.task('sass', function (f) {
    if(__uglify__) {
        return gulp.src('../'+__dirname__+'/src/sass/*.scss')
        .pipe(sass())
        .pipe(minifycss())
        .pipe(gulp.dest('../'+__dirname__+'/dist/css'));
    } else {
        return gulp.src('../'+__dirname__+'/src/sass/*.scss')
        .pipe(sass())
        .pipe(gulp.dest('../'+__dirname__+'/dist/css'));
    }
});

//同步刷新
gulp.task('serve', function () {
    var openUrl = config.chrome.proxy + config.chrome.startPath + __dirname__ + '/dist/html/index.html';
    if(os.platform() == 'darwin') {
        exec('open -a "/Applications/Google Chrome.app" "' + openUrl + '"');
    } else {
        console.log(os.platform());
        console.log(chalk.cyan('调试地址：' + openUrl));
    }
    //同步刷新与nginx冲突
    // browserSync.init({
    //     proxy: config.browserSync.proxy,
    //     port: config.browserSync.port,
    //     files: ['../' + __dirname__ + '/**'],
    //     startPath: config.browserSync.startPath + __dirname__ + '/dist/html/index.html',
    // });
});

//监听文件
gulp.task('watch', ['scripts', 'html', 'sass'], function() {
    gulp.watch('../' + __dirname__ + '/src/js/*.js', ['scripts']);
    gulp.watch('../' + __dirname__ + '/src/html/*.html', ['html']);
    gulp.watch('../' + __dirname__ + '/src/sass/*.scss', ['sass']);
});

//线上发布
gulp.task('publish', ['scripts', 'html', 'sass']);

//默认任务
gulp.task('default', function(){
    if(typeof argv.create == 'boolean' || typeof argv.c == 'boolean') {
        log.write('a');
        return;
    }
    if(argv.create || argv.c) {
        var name = argv.create || argv.c;
        var files = name.split('/');
        fs.exists('../' + name, function (exists) {
            if(exists) log.write(name, exists);
            else {
                var _shell = '';
                if(files.length > 1) {
                    fs.exists('../' + files[0], function (ex) {
                        if(ex) _shell = 'cd ../' + files[0] + '& mkdir ' + files[1] + '& cd ' + files[1] + '& mkdir src& mkdir dist& cd dist& mkdir html& mkdir css& mkdir js& mkdir .min& cd ../../../vv-tools& cp -rf ./templates1/* ../' + name + '/src';
                        else _shell = 'cd ..& mkdir ' + files[0] + '& cd ' + files[0] + '& mkdir ' + files[1] + '& cd ' + files[1] + '& mkdir src& mkdir dist& cd dist& mkdir html& mkdir css& mkdir js& mkdir .min& cd ../../../vv-tools& cp -rf ./templates1/* ../' + name + '/src';
                        log.shell(_shell, name);
                    });
                }
                else {
                    _shell = 'cd ..& mkdir ' + name + '& cd ' + name + '& mkdir src& mkdir dist& cd dist& mkdir html& mkdir css& mkdir js& mkdir .min& cd ../../vv-tools& cp -rf ./templates/* ../' + name + '/src';
                    log.shell(_shell, name);
                }
            }
        });
        return;
    }
    if(argv.watch || argv.w) {
        __dirname__ = argv.watch || argv.w;
        __uglify__ = (argv.min || argv.m) ? 1 : 0;
        __version__ = argv.V ? 1 : 0;
        var dir = '../' + __dirname__;
        fs.exists(dir, function (exists) {
            if(exists) {
                if(argv.serve || argv.s) gulp.start(['watch', 'serve']);
                else gulp.start('watch');
            }
            else log.write('c');
        });
        return;
    }
    if(argv.publish || argv.p) {
        __dirname__ = argv.publish || argv.p;
        __uglify__ = 1;
        __version__ = argv.V ? 1 : 0;
        var dir = '../' + __dirname__;
        fs.exists(dir, function (exists) {
            if(exists) gulp.start('publish');
            else log.write('c');
        });
        return;
    }
    if(argv.help || argv.h) {
        log.write('h');
        return;
    }
    log.write('h');
});
