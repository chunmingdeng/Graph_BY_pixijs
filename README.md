# GraphZ 图可视化组件

### NPM Install

公司内部使用需要指定npm仓库，在.npmrc文件下加入以下代码：
```sh
registry=http://172.30.6.10:8081/repository/npm-all/
always-auth=true
_auth="YWRtaW46YWRtaW4xMjM="
```

```sh
npm install graphz
```

### Global Import

```js
import graphZ from 'graphz'
```

### Install Dependence

首先安装webpack插件[transfer-webpack-plugin](https://www.npmjs.com/package/transfer-webpack-plugin)，用来复制graphz依赖的字体文件：

```sh
npm install --save-dev transfer-webpack-plugin
```
webpack.config.js插件配置：

```js
const TransferWebpackPlugin = require('transfer-webpack-plugin');

new TransferWebpackPlugin(
    [{
        from: './node_modules/graphz/dist/static/',
        to: '../dist/static'
    },
    {
        from: './node_modules/graphz/dist/static/',
        to: './static'
    }], path.resolve(__dirname, './')
)
```
如果无法安装依赖，手动进入/node_modules/graphz/dist/static/目录，将该目录下的所有文件复制到项目根目录的static文件夹下。

### Basic Usage Example

#### Use it in Vue

```
mounted() {
    this.init();
},
methods: {
    async init() {
        this.graphZ = graphZ({
            container: 'domId'
        });

        await this.graphZ.loadResources({ font: '/static/font/noto.fnt' });
        
        // ...
    },
}
```

### Demos

- [Layout Demo](http://172.30.6.32:8888/examples/layout)
