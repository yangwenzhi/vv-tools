const path           = require('path');
const fs             = require('fs');
const os             = require('os');
const chalk          = require('chalk');
const gulp           = require('gulp');
const $              = require('gulp-load-plugins')();
const pngquant       = require('imagemin-pngquant');
const minimist       = require('minimist');
const argv           = minimist(process.argv.slice(2));
const exec           = require('child_process').exec;
const runSequence    = require('run-sequence');
const rev            = require('gulp-rev');
const revCollector   = require('gulp-rev-collector');
const clean          = require('gulp-clean');
const config         = require('./config');
const log            = require('./log');
const webpack_config = require('./webpack.config-common');
const c              = require('./c');

let options = {
    publish    : argv.p || argv.publish ? true : false,
    version    : argv.V || false,
    uglify     : argv.min || argv.m || false,
    root       : argv.root || argv.r || false,
    serve      : argv.serve || argv.s || false,
    dircreate  : argv.create || argv.c,
    dirname    : argv.w || argv.p || argv.watch || argv.publish,
    file       : argv.file || argv.f,
    filename   : argv.file || argv.f || '*',
    imagefiles : argv.file || argv.f || '',
    tabs       : os.platform() == ('darwin' || 'linux') ? ';' : '&'
};

console.log(options);

//创建
gulp.task('create', function (done) {
    let dir   = path.resolve('..', options.dircreate);
    let src   = path.resolve(dir, 'src');
    let files = options.dircreate.split('/');
    let shell = 'mkdir ' + dir + options.tabs + 'mkdir ' + src + options.tabs;

    if(files.length > 1) {
        let file = path.resolve('..', files[0]);
        fs.exists(file, function (exists) {
            if(!exists) exec('mkdir ' + file);
            shell += 'cp -rf ./templates1/* ' + src;
            log.shell(shell, options.dircreate);
        });
    } else {
        shell += 'cp -rf ./templates/* ' + src;
        log.shell(shell, options.dircreate);
    }
});

//编译vue
gulp.task('vue', function () {
    let src  = path.resolve('..', options.dirname, 'src/vue', options.filename + '.js');
    let dist = path.resolve('..', options.dirname, 'dist/vue');
    return gulp.src(src)
        .pipe($.webpack(webpack_config))
        .pipe($.if(options.publish, rev()))
        .pipe($.if(options.publish, gulp.dest(dist)))
        .pipe($.if(options.publish, rev.manifest()))
        .pipe(gulp.dest(dist));
});

//编译sass
gulp.task('sass', function () {
    let src  = path.resolve('..', options.dirname, 'src/sass', options.filename + '.scss');
    let dist = path.resolve('..', options.dirname, 'dist/css');
    return gulp.src(src)
        .pipe($.sass())
        .pipe($.if(options.uglify || options.publish, $.minifyCss()))
        .pipe($.if(options.publish, rev()))
        .pipe($.if(options.publish, gulp.dest(dist)))
        .pipe($.if(options.publish, rev.manifest()))
        .pipe(gulp.dest(dist));
});

//编译images
gulp.task('images', function () {
    let opts = {
        progressive: true,
        svgoPlugins: [{removeViewBox: false}],
        use: [pngquant()]
    };
    let src  = path.resolve('..', options.dirname, 'src/images', options.imagefiles, '**');
    let dist = path.resolve('..', options.dirname, 'dist/images', options.imagefiles);
    return gulp.src(src)
        .pipe($.if(options.uglify || options.publish, $.imagemin(opts)))
        .pipe($.if(options.publish, rev()))
        .pipe($.if(options.publish, gulp.dest(dist)))
        .pipe($.if(options.publish, rev.manifest()))
        .pipe(gulp.dest(dist));
});

//编译javascript
gulp.task('scripts', function () {
    let src  = path.resolve('..', options.dirname, 'src/js');
    let dist = path.resolve('..', options.dirname, 'dist/js');
    let files = [];
    if(options.file) files.push(options.file + '.js');
    else files = fs.readdirSync(src);

    fs.exists(dist, function (exists) {
        if(!exists) fs.mkdirSync(dist);
        files.forEach(function(item) {
            if(/\.js/gi.test(item)) c.js(item, options.dirname, options.uglify, options.publish);
        });
    });
});

//编译html
gulp.task('html', function () {
    let opts = {
        removeComments: true,
        collapseWhitespace: true,
        minifyJS: true,
        minifyCSS: true
    };
    let src  = path.resolve('..', options.dirname, 'src/html', options.filename + '.html');
    let dist = path.resolve('..', options.dirname, options.root ? '' : 'dist/html');
    return gulp.src(src)
        .pipe($.ejs({version: options.version ? config.version || new Date().getTime().toString().substr(0, 10) : ''}))
        .pipe($.if(options.uglify || options.publish, $.htmlmin(opts)))
        .pipe(gulp.dest(dist));
});


//同步刷新
gulp.task('serve', function () {
    let openUrl = config.chrome.proxy + config.chrome.startPath + options.dirname + '/dist/html/index.html';
    if(options.tabs == ';') {
        exec('open -a "/Applications/Google Chrome.app" "' + openUrl + '"');
    } else {
        exec('start ' + openUrl);
    }
    console.log(chalk.cyan('调试地址：' + openUrl));
});

//本地开发
gulp.task('dev', function (done) {
    //依次顺序执行
    runSequence(
        ['vue'],
        ['sass'],
        ['images'],
        ['scripts'],
        ['html'],
        done);
});

//线上部署
gulp.task('online', function (done) {
    //依次顺序执行
    runSequence(
        ['clean'],
        ['vue'],
        ['sass'],
        ['images'],
        ['scripts'],
        ['html'],
        ['revHtmlVue'],
        ['revHtmlCss'],
        ['revHtmlImg'],
        ['revHtmlJs'],
        ['revCssImg'],
        ['cleanManifest'],
        done);
});

//监听文件
gulp.task('watch', ['dev'], function() {
    let dir = path.resolve('..', options.dirname);
    gulp.watch(path.resolve(dir, 'src/component/vue/*'), ['vue']);
    gulp.watch(path.resolve(dir, 'src/component/sass/*.scss'), ['sass']);
    gulp.watch(path.resolve(dir, 'src/component/js/*.js'), ['scripts']);
    gulp.watch(path.resolve(dir, 'src/component/htm/*'), ['html']);
    gulp.watch(path.resolve(dir, 'src/vue/*'), ['vue']);
    gulp.watch(path.resolve(dir, 'src/sass/*.scss'), ['sass']);
    gulp.watch(path.resolve(dir, 'src/images/**'), ['images']);
    gulp.watch(path.resolve(dir, 'src/js/*.js'), ['scripts']);
    gulp.watch(path.resolve(dir, 'src/html/*'), ['html']);
});

//线上发布
gulp.task('publish', ['online']);

//默认任务
gulp.task('default', function() {
    if(typeof argv.create == 'boolean' || typeof argv.c == 'boolean') {
        log.write('a');
        return;
    }
    if(argv.create || argv.c) {
        fs.exists(path.resolve('..', options.dircreate), function (exists) {
            if(exists) log.write(options.dircreate, exists);
            else gulp.start('create');
        });
        return;
    }
    if(argv.watch || argv.w) {
        fs.exists(path.resolve('..', options.dirname.toString()), function (exists) {
            if(exists) {
                if(options.serve) gulp.start(['watch', 'serve']);
                else gulp.start('watch');
            }
            else log.write('c');
        });
        return;
    }
    if(argv.publish || argv.p) {
        fs.exists(path.resolve('..', options.dirname.toString()), function (exists) {
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

//清空编译后文件
gulp.task('clean', function(){
    let src = path.resolve('..', options.dirname, 'dist/*');
    return gulp.src(src)
        .pipe(clean({force: true}));
});

//清空rev-manifest.json
gulp.task('cleanManifest', function(){
    let src = path.resolve('..', options.dirname, 'dist');
    let config_src = [
        path.resolve(src, 'vue/rev-manifest.json'),
        path.resolve(src, 'css/rev-manifest.json'),
        path.resolve(src, 'images/rev-manifest.json'),
        path.resolve(src, 'js/rev-manifest.json')
    ];
    return gulp.src(config_src)
        .pipe(clean({force: true}));
})

//Html替换vue文件版本
gulp.task('revHtmlVue', function () {
    let json = path.resolve('..', options.dirname, 'dist/vue/*.json');
    let src  = path.resolve('..', options.dirname, 'dist/html/*.html');
    let dist = path.resolve('..', options.dirname, 'dist/html');
    return gulp.src([json, src])
        .pipe(revCollector())
        .pipe(gulp.dest(dist));
});

//Html替换css文件版本
gulp.task('revHtmlCss', function () {
    let json = path.resolve('..', options.dirname, 'dist/css/*.json');
    let src  = path.resolve('..', options.dirname, 'dist/html/*.html');
    let dist = path.resolve('..', options.dirname, 'dist/html');
    return gulp.src([json, src])
        .pipe(revCollector())
        .pipe(gulp.dest(dist));
});

//Html替换img文件版本
gulp.task('revHtmlImg', function () {
    let json = path.resolve('..', options.dirname, 'dist/images/*.json');
    let src  = path.resolve('..', options.dirname, 'dist/html/*.html');
    let dist = path.resolve('..', options.dirname, 'dist/html');
    return gulp.src([json, src])
        .pipe(revCollector())
        .pipe(gulp.dest(dist));
});

//Html替换js文件版本
gulp.task('revHtmlJs', function () {
    let json = path.resolve('..', options.dirname, 'dist/js/*.json');
    let src  = path.resolve('..', options.dirname, 'dist/html/*.html');
    let dist = path.resolve('..', options.dirname, 'dist/html');
    return gulp.src([json, src])
        .pipe(revCollector())
        .pipe(gulp.dest(dist));
});

//css替换img文件版本
gulp.task('revCssImg', function () {
    let json = path.resolve('..', options.dirname, 'dist/images/*.json');
    let src  = path.resolve('..', options.dirname, 'dist/css/*.css');
    let dist = path.resolve('..', options.dirname, 'dist/css');
    return gulp.src([json, src])
        .pipe(revCollector())
        .pipe(gulp.dest(dist));
});
