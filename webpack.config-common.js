const path     = require('path');
const webpack  = require('webpack');
const glob     = require('glob');
const minimist = require('minimist');
const argv     = minimist(process.argv.slice(2));

let entry = {};
let plugins = [
    new webpack.DefinePlugin()
];

let options = {
    WATCH     : argv.watch || argv.w,
    dirname   : argv.w || argv.p || argv.watch || argv.publish || '',
    filename  : argv.file || argv.f || '*',
    min       : argv.min || argv.m || false
};

let reg = new RegExp(options.dirname + '\/src\/|\.js', 'gi');
let files = glob.sync(path.resolve('..', options.dirname.toString(), 'src/vue/**', options.filename + '.js'));

files.forEach(function(item) {
    entry[item.replace(reg, '')] = item;
});

let webpack_config = {
    entry: entry,
    output: {
        filename: '[name].js',
    },
    plugins: options.WATCH && !options.min ? plugins : plugins.concat([
        new webpack.optimize.UglifyJsPlugin({
            compress: {
                warnings: false
            },
            mangle:{
                except: ['$', 'exports', 'require']
            }
        })
    ]),
    resolve: {
        extensions: ['', '.js', '.vue'],
    },
    module: {
        loaders: [
            { 
                test: /\.vue$/,
                loader: 'vue-loader'
            },
            {
                test: /\.js$/,
                loader: 'babel-loader',
                exclude: /node_modules/,
                query: {
                    presets: ['es2015']
                }
            },
            {
                test: /\.jsx$/,
                loader: 'babel',
                exclude: /node_modules/,
                query: {
                    presets: ['es2015', 'react']
                }
            }, 
            {
                test: /\.(png|jpg|jpeg|gif|svg|woff|woff2)$/,
                loader: 'url-loader'
            }
        ]
    },
    // watch: options.WATCH ? true : false,
};

module.exports = webpack_config;
