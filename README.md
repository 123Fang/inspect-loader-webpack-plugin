# inspect-loader-webpack-plugin

**inspect-loader-webpack-plugin 记录了 webpack 构建过程中，被打包的模块被对应的loaders处理的过程！**
**左边是loader接收的code，右边是Loade编译后的code**

用法：
```
// webpack.config.js
const InspectWebpackPlugin = require('InspectWebpackPlugin')

plugins: [
      new InspectWebpackPlugin({
        // exclude需要排除的loader，默认排除cache-loader不做缓存。
        exclude: ['cache-loader'],
      })
    ]
```

本地查看：
1 `pnpm i`  下载依赖
2 `pnpm run build:client`   客户端打包
3 `pnpm run watch:example`  启动example目录中的vue项目

vue项目在启动项目后，用 http://localhost:9009 来访问





