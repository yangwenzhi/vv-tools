/**
 *
 * build tools.
 * @date 2014-08-18
 *
 * .html    html file that will publish online.
 * .js      javasscript file that will be compressed and published.
 * .css     css file that will be compressed and published.
 * .htm     pagelets that won't be published.
 * .tpl     template that won't be published.
 *
 */



var fs = require('fs'),
    path = require('path'),
    mime = require('mime'),
    dot = require('dot'),
    Minimize = require('minimize'),
    UglifyJS = require("uglify-js"),
    Cache = require('./cache');

var SUPPORTED_TYPES = ['text/html', 'text/css', 'text/javascript'];

function BingoBuilder(opts){
    var self = this;
    self.opts = opts || {};
    self.dlcache = new Cache(self.opts.cache_dir || './template/bingo-builder');
}


/*
 * build a file.
 */
BingoBuilder.prototype.build = function(filepath, callback){
    var self = this;


    fs.readFile(filepath, {encoding:'utf8'}, function(err, data){

        var type = mime.lookup(filepath);

        /*
         * for not supported types. just return the data.
         */
        if(! type in  SUPPORTED_TYPES){
            return callback(null, data);
        }

        var deps = self.parseDeps(filepath, data);
        
        /*
         * no dependency, return directly.
         */


        if(!deps || deps.length == 0){
            return self.doCallback(type, data, callback);
        }

        self.downloadFiles(deps, function(err, deps){
            if(err) return callback(err, null);
        

            self.loadAllFiles(deps, function(err, deps){
                if(err) return callback(err, null);
                

                self.buildDeps(deps, function(err, deps){
                    if(err) return callback(err, null);

                    compiled = self.replaceDeps(deps, data);

                    //do replace and go back.
                    //var data = self.replaceData(data);
                    return self.doCallback(type, compiled, callback);
                });
            })
        });

    });
}


BingoBuilder.prototype.doCallback = function(type, data, callback){
    var self = this;
    //compress data.
    //do callback.
    self.compress(type, data, function(err, data){
        callback(null, data);
    });
}

/*
 * parse dependencies, different file using different way.
 *
 * @data {String} data //file content 
 * @return {Array} [{raw:rawinc, file:localfile, url:remote data url},...]
 */
BingoBuilder.prototype.parseDeps = function(filepath, data){
    var self = this;

    var filetype = mime.lookup(filepath);

    //console.log(filetype);
    

    switch(filetype){
        case 'text/html' : 
            return self.parseHtmlDeps(filepath, data);
            break;
        case 'text/css' : 
            return self.parseCssDeps(filepath, data);
            break;
        case 'text/javascript' : 
        case 'application/javascript' : 
            return self.parseJsDeps(filepath, data);
            break;
        default :
            return [];
    }
}

BingoBuilder.prototype.buildDeps = function(deps, callback){
    var self = this;
    deps.forEach(function(dep, index){

        try{
            if(dep.type == 'tpl') 
                deps[index].compiled = self.buildDot(dep.filedata, dep.json);
            else
                deps[index].compiled = dep.filedata;
        }catch(e){
            callback(new Error('Build file[' + dep.filepath + '] datapath[' + dep.datapath + '], dataurl[' + dep.dataurl +'] error: ' + e.message), null);
        }
    });
    return callback(null, deps);
}


BingoBuilder.prototype.buildDot = function(tpl, json){
    return dot.template(tpl)(json);
}


/*
 * replace the dependencies with data.
 *
 * @deps {Array}  deps
 * @param {String} data
 * @return {String} data replaced.
 */
BingoBuilder.prototype.replaceDeps = function(deps, data){
    deps.forEach(function(dep){
        data = data.replace(dep.raw, dep.compiled);
    });
    return data;
}


BingoBuilder.prototype.downloadFiles = function(deps, callback){
    var self  = this;
    var done = 0;
    var toLoad = 0;
    var errors = null;


    deps.forEach(function(dep, index){
        if(dep.type == 'tpl') toLoad++;
    });

    //no remote files to download.
    if(toLoad == 0){
        //console.log('haha');
        return callback(null, deps);
    }

    deps.forEach(function(dep, index){
        dep.type == 'tpl' && self.dlcache.get(dep.dataurl, function(err, res){
            if(err){
                console.log(err);
                errors = errors || [];
                errors.push(err);
            }else{
                deps[index].datapath = res.path;
            }

            done++;

            if(done >= toLoad){
                if(errors) callback(new Error(errors.join('')), null);
                else callback(null, deps);
            }
            
        });
    });
}

/*
 * load All files. including remote data files.
 * fill data to deps array. build template if nessisarry.
 *
 * @param {Array} deps
 * @param {Function} callback //function(err, deps){}
 */
BingoBuilder.prototype.loadAllFiles = function(deps, callback){


    //console.log('load all files.');
    //console.log(deps);

    var self = this;
    var done = 0;
    var toLoad = 0;
    var errors = null;

    function checkDone(){
        if(done >= toLoad){
            if(errors) callback(new Error(errors), null);
            else callback(null, deps);
        }
    }

    //how many files to download.
    deps.forEach(function(dep, index){
        toLoad += (dep.type == 'file' ? 1 : 2);
    });

    //console.log('toLoad', toLoad);

    deps.forEach(function(dep, index){

        fs.readFile(dep.filepath, {encoding : 'utf8'}, function(err, data){
            if(err){
                errors = errors || [];
                errors.push(err.message);
            }else{
                deps[index].filedata = data;
            }

            done++;
            //console.log(done);
            checkDone();
        });

        //console.log(deps);

        if(dep.type != 'tpl') return;

        fs.readFile(dep.datapath, {encoding : 'utf8'}, function(err, data){
            if(err){
                errors = errors || [];
                errors.push(err.message);
            }else{
                //check if data a valid json.
                try{
                    deps[index].json = JSON.parse(data);
                }catch(e){
                    errors = errors || [];
                    errors.push(e.message);
                }
                deps[index].data = data;
            }
            done++;
            checkDone();
        });
    });
    
}

/*
 * Compress the by type.
 *
 * @type {String} type //mime type
 * @return {String} data that compressed.
 */
BingoBuilder.prototype.compress = function(type, data, callback){
    var self = this;
    if (! self.opts.compress)
        return callback(null, data);

    switch(type){
        case 'text/html' : 
            var mini = new Minimize();
            return mini.parse(data, function(err, data){
                callback(err, data);
            });
            break;
        case 'text/css' : 
            data = require('sqwish').minify(data);
            callback(null, data);
            break;
        case 'text/javascript' : 
        case 'application/javascript' : 
            var result = UglifyJS.minify(data, {
                fromString : true
            });
            callback(null, result.code);
            break;
        default :
            callback(null, data);
    }
    
}


/**
 * parse html,css,js get the deps.
 * @type {String} type  css|js|html
 * @data {String} data
 * @return {Array} file dependencies array
 * @throw {Error} when file include format is error.
 */
function parse(type, data){
}


/**
 * parse html
 * @type {String} type  css|js|html
 * @data {String} data
 * @return {Array} file dependencies array
 * @throw {Error} when file include format is error.
 */
BingoBuilder.prototype.parseHtmlDeps = function(filepath, data){
    var self = this;

    var deps = [];

    var regex = /<!--##include[^(]*\(([^)]*)\)##-->/g; 
    var matches = [];
    while(match = regex.exec(data)){
        matches.push(match);
    }

    matches.forEach(function(match){
        var dep = {};
        dep.raw = match[0];
        var files = null;
        
        try{
            parts  = eval('[' + match[1] + ']');
            if(parts.length == 1){
                dep.type = 'file';
                dep.file = parts[0];
                deps.push(dep);
            }else if(parts.length == 2){
                dep.type = 'tpl';
                dep.file = parts[0];
                dep.dataurl = parts[1];
                deps.push(dep);
            }
        }catch(e){
            console.log(e);
        }
    });


    var dirname = path.dirname(filepath);
    deps.forEach(function(dep, index){
        deps[index].filepath = path.resolve(path.join(dirname, dep.file));
    });

    return deps;
}



/**
 * parse css
 * @type {String} type  css|js|html
 * @data {String} data
 * @return {Array} file dependencies array
 * @throw {Error} when file include format is error.
 */
BingoBuilder.prototype.parseCssDeps = function(filepath, data){
    var self = this;

    var deps = [];

    var regex = /@import[^(]*\(([^)]*)\)[^;]*;/g; 
    var matches = [];
    while(match = regex.exec(data)){
        matches.push(match);
    }

    //console.log(matches);


    matches.forEach(function(match){
        var dep = {};
        dep.raw = match[0];
        dep.type = 'file';
        dep.file = match[1];
        deps.push(dep);
    });

    var dirname = path.dirname(filepath);
    deps.forEach(function(dep, index){
        deps[index].filepath = path.resolve(path.join(dirname, dep.file));
    });

    return deps;
}


/**
 * parse js
 * @type {String} type  css|js|html
 * @data {String} data
 * @return {Array} file dependencies array
 * @throw {Error} when file include format is error.
 */
BingoBuilder.prototype.parseJsDeps = function(filepath, data){
    var self = this;

    var deps = [];

    var regex = /\/\/##include[^(]*\(([^)]*)\)/g; 
    var matches = [];
    while(match = regex.exec(data)){
        matches.push(match);
    }

    matches.forEach(function(match){
        try{
            var dep = {};
            dep.raw = match[0];
            dep.type = 'file';
            dep.file = eval('[' + match[1] + ']')[0];
            deps.push(dep);
        }catch(e){
            console.log(e);
        }
    });

    var dirname = path.dirname(filepath);
    deps.forEach(function(dep, index){
            deps[index].filepath = path.resolve(path.join(dirname, dep.file));
            });

    return deps;
}


/**
 * parse Array
 * @type {String} type  css|js|html
 * @data {String} data
 * @return {Array} file dependencies array
 * @throw {Error} when file include format is error.
 */
function parseJavascript(data){

}



module.exports = BingoBuilder;
