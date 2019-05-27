const path         = require('path');
const fs           = require('fs');
const gulp         = require('gulp');
const $            = require('gulp-load-plugins')();
const uglify       = require('gulp-uglify');
const builder      = require('bingo-builder');
const bingo        = new builder({compress : 0});
const rev          = require('gulp-rev');
const revCollector = require('gulp-rev-collector');
const clean        = require('gulp-clean');

let create = {
    js: function(name, dir, min, publish) {
        let file = path.resolve('..', dir, 'src/js', name);
        let dist = path.resolve('..', dir, 'dist/js');
        let src = path.resolve(dist, name);
        bingo.build(file, function(err, res) {
            fs.writeFileSync(src, res);
            if(min || publish) {
                gulp.src(src)
                    .pipe(uglify())
                    .pipe($.if(publish, rev()))
                    .pipe($.if(publish, gulp.dest(dist)))
                    .pipe($.if(publish, rev.manifest()))
                    .pipe(gulp.dest(dist));
                if(publish) {
                    return gulp.src(src)
                        .pipe(clean({force: true}));
                }
            }
        });
    }
};

module.exports = create;
