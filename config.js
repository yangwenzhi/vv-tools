var config = {
	version: '',
	browserSync: {
		proxy: 'localhost',
	    port: 8088,
	    startPath: 'webapp/m/' //移动
	    // startPath: 'vv-live-pc/' //pc
	},
	chrome: {
		proxy: 'http://live.51vv.com/',
	    startPath: 'webapp/m/' //移动
	    // startPath: 'vv-live-pc/' //pc
	}
};

module.exports = config;
