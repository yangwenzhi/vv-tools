var webpack = require('webpack'),
    glob = require('glob'),
    minimist = require('minimist'),
    ExtractTextPlugin = require("extract-text-webpack-plugin"),
    argv = minimist(process.argv.slice(2));

var __dirname__ = '',
    WATCH = argv.watch || argv.w,
    min = argv.min || argv.m,
    entry = {},
    plugins = [
        new webpack.DefinePlugin(),
    ];

if(argv.watch || argv.w || argv.publish || argv.p) {
    __dirname__ = argv.watch || argv.w || argv.publish || argv.p;
}

var fsArr = glob.sync('../' + __dirname__ + '/src/vue/**/*.js');

fsArr.forEach(function(item) {
    entry[item.replace('../' + __dirname__ + '/src/vue/', '').replace('.js', '')] = item;
});

var webpack_config = {
    entry: entry,
    output: {
        filename: '[name].js',
    },
    plugins: WATCH && !min ? plugins : plugins.concat([
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
            }
        ]
    },
    watch: WATCH ? true : false,
};

module.exports = webpack_config;
