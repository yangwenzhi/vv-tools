# vv-tools工具使用指南 #
<br>
## 环境配置 ##
> 
1. 安装 nginx
2. 安装 git bash 工具
3. 安装 node（自带npm）

## 配置步骤 ##
**1、 nginx <br>**<br>
**Windows:<br>**<br>
下载nginx，减压，文件重命名为nginx，复制nginx文件夹到c盘根目录，添加nginx配置到nginx.conf文件
<pre>
server {
    listen 80;
    server_name live.51vv.com;
    location / {
        root E:/51vv;
    }
    location /act {
        proxy_pass http://210.73.211.145;
    }
    location /api {
        proxy_pass http://210.73.211.145;
    }
    location /pc {
        proxy_pass http://210.73.211.145;
    }
    location /wx {
        proxy_pass http://210.73.211.145;
    }
}
</pre>
配置本地hosts文件
<pre>
127.0.0.1	live.51vv.com
</pre>
http://localhost/ 如下，说明安装成功
<pre>
Welcome to nginx!

If you see this page, the nginx web server is successfully installed and working. Further configuration is required.

For online documentation and support please refer to nginx.org.
Commercial support is available at nginx.com.

Thank you for using nginx.
</pre>
**2、git拉取代码**<br>
1、 github 搜索vv-tools，复制仓库地址，在工作目录右击打开git bash工具，执行如下命令：
<pre>
$ git clone https://github.com/yangwenzhi/vv-tools.git
$ git pull origin master (拉取最新)
$ npm install (安装工具依赖包)
</pre>
2、在根目录更新svn，右击打开git bash工具，执行如下命令：
<pre>
$ npm install (安装工具依赖包) 部分依赖包是全局的
</pre>
依赖文件
<pre>
node_modules
package.json
.babelrc
</pre>
**3、使用说明**<br><br>
1、主要命令，进入vv-tools文件，右击打开git bash工具，执行如下命令
<pre>
创建 gulp --create | -c xxx/xxx
运行 gulp --watch | -w xxx/xxx，可选 --min | -m (压缩) ，可选 --serve | -s (同步刷新)，可选 -V (加版本号) 
单文件编译 gulp --file | -f xxx
打包 gulp --publish | -p xxx/xxx
帮助 gulp --help | -h
</pre>
2、目录架构<br>
<pre>
├── dist    构建后
│   ├── css
│   ├── html
│   ├── images
│   ├── js
│   └── vue
└── src     构建前
    ├── component 模板文件
    │   ├── htm
    │   ├── js
    │   ├── sass
    │   └── vue
    ├── html  html文件
    ├── images  图片文件
    ├── js  普通js文件
    ├── sass  样式文件
    └── vue  vue的js文件，支持CommonJS规范
</pre>


**4、调试** <br>
本地调试支持直接调用测试api

**5、更新** <br>
<pre>
$ git checkout xxx  //删除修改过的文件
$ git pull origin master (拉取最新)
$ npm install (安装工具依赖包)
</pre>