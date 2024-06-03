## inspect-loader-webpack-plugin

### 这个插件有什么用？

可以轻松查看编译后的代码，了解代码如何被 babel,vue编译器转换 ,scss less 编译器转换，可以加深对框架底层细节或一些构建时的工具链的理解。    
比如：一个 .vue 组件，在webpack中会经过哪些处理？它的tempalte, script,style都是如何处理的？处理前源码和处理后的源码是什么样子？能否展示出处理前/后的代码，并展示出他们之间的差异？   



<br>

inspect-loader-webpack-plugin 用可视化的方式查看在webpack构建过程中loader对模块的转换和每个loader的耗时！
<br>
<br>

<img width="1506" alt="截屏2023-09-28 16 20 15" src="https://github.com/123Fang/inspect-loader-webpack-plugin/assets/38906235/af890655-296b-48fc-9d7c-904f3266a7a9">


<br>


<img width="1515" alt="截屏2023-09-28 16 20 59" src="https://github.com/123Fang/inspect-loader-webpack-plugin/assets/38906235/b1899d36-9f16-48d4-bb4a-f16540dedfd4">


#### 用法：
<br>

##### 第一步下载：
```shell
pnpm i inspect-loader-webpack-plugin -D
```
<br>

##### 第二步配置：

```js
// webpack.config.js 或 vue.config.js
const InspectWebpackPlugin = require('inspect-loader-webpack-plugin')

 plugins: [
      new InspectWebpackPlugin({
        // exclude: 排除你不需要查看的loader。
        // 这里排出 cache-loader 是为了收集所有 loader工作的结果. 
        exclude: ['cache-loader']
      })
    ]
```
<br>

##### 第三步启动你自己的项目:
```shell
npm run dev
```
<br>

##### 第四步，浏览器打开你本地 http://localhost:9009 完毕！

<br>
<br>

##### 注意 (如果您的node版本是 nodev17 以后的版本)
node v17以后的版本发布的OpenSSL3.0, 而OpenSSL3.0对允许算法和密钥大小增加了严格的限制，可能会对生态系统造成一些影响.
如果出现 `error:0308010C:digital envelope routines::unsupported` ,可以通过运行以下命令行临时解决这个问题：
```shell
export NODE_OPTIONS=--openssl-legacy-provider
```





