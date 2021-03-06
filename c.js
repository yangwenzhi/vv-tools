const path         = require('path');
const fs           = require('fs');
const builder      = require('bingo-builder');
const bingo        = new builder({compress : 0});

let create = {
    js: function(name, dir, min, publish) {
    	let filename = min || publish ? '.min' : 'js';
        let file = path.resolve('..', dir, 'src/js', name);
        let dist = path.resolve('..', dir, 'dist', filename);
        let src = path.resolve(dist, name);
        bingo.build(file, function(err, res) {
            fs.writeFileSync(src, res);
        });
    }
};

module.exports = create;
