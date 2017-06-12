var fs = require('fs'),
    os = require('os'),
    chalk = require('chalk'),
    gulp = require('gulp'),
    $ = require('gulp-load-plugins')(),
    gutil = require('gulp-util'),
    pngquant = require('imagemin-pngquant'),
    minimist = require('minimist'),
    argv = minimist(process.argv.slice(2)),
    exec = require('child_process').exec,
    // browserSync = require('browser-sync').create(),
    c = require('./c'),
    config = require('./config'),
    log = require('./log');

var __dirname__ = '',
    __uglify__ = 0,
    __version__ = 0,
    tab = os.platform() == 'darwin' ? ';' : '&';

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
    var opts = {
        removeComments: true,
        collapseWhitespace: true,
        minifyJS: true,
        minifyCSS: true
    };   
    if(__uglify__) {
        return gulp.src('../'+__dirname__+'/src/html/*.html')
        .pipe($.ejs({version: __version__ ? config.version || new Date().getTime().toString().substr(0, 10) : ''}))
        .pipe($.htmlmin(opts))
        .pipe(gulp.dest('../'+__dirname__+'/dist/html'));
    } else {
        return gulp.src('../'+__dirname__+'/src/html/*.html')
        .pipe($.ejs({version: __version__ ? config.version || new Date().getTime().toString().substr(0, 10) : ''}))
        .pipe(gulp.dest('../'+__dirname__+'/dist/html'));
    }
});

//编译sass
gulp.task('sass', function (f) {
    if(__uglify__) {
        return gulp.src('../'+__dirname__+'/src/sass/*.scss')
        .pipe($.sass())
        .pipe($.minifyCss())
        .pipe(gulp.dest('../'+__dirname__+'/dist/css'));
    } else {
        return gulp.src('../'+__dirname__+'/src/sass/*.scss')
        .pipe($.sass())
        .pipe(gulp.dest('../'+__dirname__+'/dist/css'));
    }
});

//编译images
gulp.task('images', function () {
    var opts = {
        progressive: true,
        svgoPlugins: [{removeViewBox: false}],
        use: [pngquant()]
    };
    if(__uglify__) {
        return gulp.src('../'+__dirname__+'/src/images/*')
        .pipe($.imagemin(opts))
        .pipe(gulp.dest('../'+__dirname__+'/dist/images'));
    } else {
        return gulp.src('../'+__dirname__+'/src/images/*')
        .pipe(gulp.dest('../'+__dirname__+'/dist/images'));
    }
});

//同步刷新
gulp.task('serve', function () {
    var openUrl = config.chrome.proxy + config.chrome.startPath + __dirname__ + '/dist/html/index.html';
    if(os.platform() == 'darwin') {
        exec('open -a "/Applications/Google Chrome.app" "' + openUrl + '"');
    } else {
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
gulp.task('watch', ['scripts', 'html', 'sass', 'images'], function() {
    gulp.watch('../' + __dirname__ + '/src/js/*.js', ['scripts']);
    gulp.watch('../' + __dirname__ + '/src/html/*.html', ['html']);
    gulp.watch('../' + __dirname__ + '/src/sass/*.scss', ['sass']);
    gulp.watch('../' + __dirname__ + '/src/images/*', ['images']);
});

//线上发布
gulp.task('publish', ['scripts', 'html', 'sass', 'images']);

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
                        if(ex) _shell = 'cd ../' + files[0] + tab + ' mkdir ' + files[1] + tab + ' cd ' + files[1] + tab + ' mkdir src' + tab + ' mkdir dist' + tab + ' cd dist' + tab + ' mkdir html' + tab + ' mkdir css' + tab + ' mkdir js' + tab + ' mkdir images' + tab + ' mkdir .min' + tab + ' cd ../../../vv-tools' + tab + ' cp -rf ./templates1/* ../' + name + '/src';
                        else _shell = 'cd ..' + tab + ' mkdir ' + files[0] + tab + ' cd ' + files[0] + tab + ' mkdir ' + files[1] + tab + ' cd ' + files[1] + tab + ' mkdir src' + tab + ' mkdir dist' + tab + ' cd dist' + tab + ' mkdir html' + tab + ' mkdir css' + tab + ' mkdir js' + tab + ' mkdir images' + tab + ' mkdir .min' + tab + ' cd ../../../vv-tools' + tab + ' cp -rf ./templates1/* ../' + name + '/src';
                        log.shell(_shell, name);
                    });
                }
                else {
                    _shell = 'cd ..' + tab + ' mkdir ' + name + tab + ' cd ' + name + tab + ' mkdir src' + tab + ' mkdir dist' + tab + ' cd dist' + tab + ' mkdir html' + tab + ' mkdir css' + tab + ' mkdir js' + tab + ' mkdir images' + tab + ' mkdir .min' + tab + ' cd ../../vv-tools' + tab + ' cp -rf ./templates/* ../' + name + '/src';
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
