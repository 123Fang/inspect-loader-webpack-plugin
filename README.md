## inspect-loader-webpack-plugin

`用来学习 webpack-plugin 和 loader 的一个工具`
<br>

inspect-loader-webpack-plugin 用可视化的方式查看在webpack构建过程中loader对模块的转换！
<br>

比如 一个.vue文件其实在构建过程中会被多个loader所处理。那么 inspect-loader-webpack-plugin 插件会记录处理这个.vue文件的所有loader的输入（code处理前）和 输出(code处理后)，并记录每个loader的耗时。在构建完成后，用可视化的方式展示收集到的这些信息。

<br>

#### 用法：
1 pnpm i 下载依赖

2 pnpm run watch:example  启动一个vue的项目，项目的vue.config.js配置了inspect-loader-webpack-plugin插件：

```js
// vue.config.js
 plugins: [
      new InspectWebpackPlugin({
        // 排除 cache-loader
        exclude: ['cache-loader'],
        port: 9009 // http://localhost:9009访问
      })
    ]
```
3 pnpm run build:client   用可视化的方式展示loader对模块文件的转换（http://localhost:9009 来查看loader的转换）


<br>

#### 总结：
   inspect-loader-webpack-plugin插件就做两件事情： 
      1 收集loader转换结果 
      2 在构建完成后启动一个express服务,用来访问-在webpack构建中收集的loader转换结果




