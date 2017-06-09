var chalk = require('chalk');
var exec = require('child_process').exec;

var log = {
	write: function(arg, exists) {
		switch (arg) {
			case 'a':
				console.log(chalk.cyan('请添加目录名'));
				break;
			case 'h':
				console.log(chalk.cyan('首次创建目录文件 --create | -c\n本地开发请加参数 --watch | -w ，可选 --min | -m (压缩) ，可选 --serve | -s (同步刷新)，可选 -V (加版本号) \n线上构建&本地构建请加参数 --publish | -p \n帮助 --help | -h'));
				break;
			case 'c':
				console.log(chalk.cyan('目录不存在，请先执行 "gulp --create xxx" 创建目录文件'));
				break;
			default:
				if(exists) {
					console.log(chalk.cyan('目录已存在，请执行 "gulp --watch ' + arg + '" 进行开发'));
				} else {
					console.log(chalk.cyan('目录创建成功，请执行 "gulp --watch ' + arg + '" 进行开发'));
	            	console.log(chalk.cyan('上线前打包，请执行 "gulp --publish ' + arg + '"'));
				}
				break;
		}
	},
	shell(shell, name) {
        exec(shell, function(err, stdout, stderr) {
            if (err) throw err;
            else this.write(name);
        }.bind(this));
    }
};

module.exports = log;