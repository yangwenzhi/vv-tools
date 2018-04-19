/*
 * Donwload cache util.
 */

var request = require('request'),
    crypto = require('crypto'),
    path  = require('path'),
    fs = require('fs'),
    format = require('format');


/**
 * cache object.
 * @param {String} dir
 */
function Cache(dir){
    var self = this;
    self.dir = dir;
}


/*
 * download iamge if not in cache.
 * @param {String} url
 * @param {Funciton} callback
 */
Cache.prototype.get = function(url, callback){
    var self = this;
    var path = self.filepath(url);
    var key = self.key(url);

    var res = {
        path : path, 
        url : url,
        data : null
    }

    fs.exists(path, function(exists){
        //if(exists){
        if(false){
            callback(null, res);
        }else{
            request(url).pipe(fs.createWriteStream(path))
            .on('finish', function(){
                callback(null, res);
            }).on('error', function(e){
                callback(new Error(format('Download [%s] failed [%s]', url, e.message)));
            });
        }
    });
}

/*
 * Generate key of url use md5 hash.
 * @param {String} url
 */
Cache.prototype.key = function(url){
    return crypto.createHash('md5').update(url, 'utf8').digest('hex');
}

/*
 * Get file path by url
 * @param {String} url
 */
Cache.prototype.filepath = function(url){
    var self = this;
    return path.join(self.dir,  self.key(url) + '.cache');
}


module.exports = Cache;


