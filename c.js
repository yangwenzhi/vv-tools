var fs = require('fs'),
    gulp = require('gulp'),
    gutil = require('gulp-util'),
    uglify = require('gulp-uglify'),
    htmlmin = require('gulp-htmlmin'),
    builder = require('bingo-builder'),
    bingo = new builder({compress : 0});

var options = {
    removeComments: true,//清除HTML注释
    collapseWhitespace: true,//压缩HTML
    collapseBooleanAttributes: true,//省略布尔属性的值 <input checked="true"/> ==> <input />
    removeEmptyAttributes: true,//删除所有空格作属性值 <input id="" /> ==> <input />
    removeScriptTypeAttributes: false,//删除<script>的type="text/javascript"
    removeStyleLinkTypeAttributes: false,//删除<style>和<link>的type="text/css"
    minifyJS: true,//压缩页面JS
    minifyCSS: true//压缩页面CSS
};

var create = {
    js:   function(f, __dirname__, __uglify__) { this.do(f, __dirname__, __uglify__, 'js');},
    html: function(f, __dirname__, __uglify__) { this.do(f, __dirname__, __uglify__, 'html');},
    do: function(f, __dirname__, __uglify__, type) {
        if(f.indexOf('.' + type) == -1) return;
        bingo.build(f, function(err, res){
            if(__uglify__) {
                fs.writeFile(f.replace('src/' + type, 'dist/.min'), res, function(){
                    gulp.src(f.replace('src/' + type, 'dist/.min'))
                    .pipe(type == 'js' ? uglify() : htmlmin(options))
                    .pipe(gulp.dest('../'+__dirname__+'/dist/' + type));
                });
            } else {
                fs.writeFile(f.replace('src', 'dist'), res, function(){});
            }
        });
    }
};

module.exports = create;
