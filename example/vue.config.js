const InspectWebpackPlugin = require('../src/node/index.js')

module.exports = {
  configureWebpack: {
    mode: 'development', // 这里的优先级高于命令行： npm run build时，mode也为‘development’！！！
    optimization: {
      splitChunks: { chunks: 'all' },
      minimize: false
    },
    plugins: [
      new InspectWebpackPlugin({
        // 排除 cache-loader
        exclude: ['cache-loader'],
        port: 9009 // http://localhost:9009访问
      })
    ]
  }

}
