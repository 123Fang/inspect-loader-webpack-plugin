## inspect-loader-webpack-plugin

`用来学习 webpack-plugin 和 loader 的一个工具`
<br>

inspect-loader-webpack-plugin 用可视化的方式查看在webpack构建过程中loader对模块的转换和每个loader的耗时！
<br>



#### 用法：
<br>

##### 第一步下载：
```shell
pnpm i inspect-loader-webpack-plugin
```
<br>

##### 第二步配置：
```js
// vue.config.js
const InspectWebpackPlugin = require('inspect-loader-webpack-plugin')

 plugins: [
      new InspectWebpackPlugin({
        // 可以手动排除你不需要查看的loader。
        // 这里排出 cache-loader 是为了收集所有 loader工 作的结果，不用缓存。
      })
    ]
```
<br>

##### 第三步启动你自己的项目
```shell
npm run dev
或
npm run serve
```
<br>

#### 第四步，浏览器打开你本地 http://localhost:9009 完毕！

<br>
<br>

#### 注意
node v17以后的版本发布的OpenSSL3.0, 而OpenSSL3.0对允许算法和密钥大小增加了严格的限制，可能会对生态系统造成一些影响.
如果出现 `error:0308010C:digital envelope routines::unsupported` ,可以通过运行以下命令行临时解决这个问题：
```shell
export NODE_OPTIONS=--openssl-legacy-provider
```





