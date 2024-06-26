const fse = require('fs-extra');
const path = require('path');
const express = require('express');


module.exports = class InspectWebpackPlugin {
  constructor(options) {
    this.options = {
      ...this.options,
      ...options,
    };
  }

  apply(compiler) {
    this.context = compiler.context;
    this.transformMap = {};

    compiler.hooks.done.tap('my-inspect-webpack-plugin', () => { // done钩子 在一次编译完成后执行
      this.done = true;
      this.createServer();
    });

    compiler.hooks.compilation.tap('my-inspect-webpack-plugin', (compilation) => {
      const { normalModuleLoader } = compilation.hooks;
      // 在 module 一开始构建的过程中，首先会创建一个 loaderContext 对象，
      // 它和这个 module 是一一对应的关系，而这个 module 所使用的所有 loaders 都会共享这个 loaderContext 对象。

      // normalModuleLoader 的钩子函数，开发者可以利用这个钩子来对 loaderContext 进行拓展，在loader.run之前，所以loader执行函数中可以this.loaderContext的拓展
      normalModuleLoader.tap('my-inspect-webpack-plugin', (loaderContext) => {
        // 加载模块时，会触发normalModuleLoader钩子，可以拿到这个模块对应的loaderContext对象。
        // loaderContext对象中包含处理这个模块的所有loaders。
        loaderContext['my-inspect-webpack-plugin'] = this.recordTransformInfo.bind(this);
      });

      // 创建模块时
      compilation.hooks.buildModule.tap('my-inspect-webpack-plugin', (module) => {
        let { resource: id } = module;

        if (id && id.indexOf('?') > -1) {
          id = id.slice(0, id.indexOf('?'));
        }

        if (/index.html/.test(id)) return;
        if (id && !/node_modules/.test(id)) { // * 这里的排除/node_modules/的加载模块
          let loader = { loader: require.resolve('./loader.js') };
          module.loaders.unshift(loader);

          // * 过滤排除的loader
          module.loaders = module.loaders.filter((item) => {
            const excludeLoaders = this.options.exclude;
            if (excludeLoaders.some((excludeLoader) => { return new RegExp(excludeLoader).test(item.loader ? item.loader : ''); })) return false;
            return true;
          });

          if (!this.transformMap[id]) {
            const code = fse.readFileSync(id, 'utf-8');
            const start = Date.now();
            this.transformMap[id] = [{
              name: '__LOAD__',
              result: code,
              start,
              end: start,
            }];
          }
        }
      });
    });
  }

  // 这个函数会传给这个插件配套的loader，用来记录最终转换后的代码。
  recordTransformInfo(result) {
    if (!result) { return; }
    // id ===> '/Users/fangxiang/Desktop/app-3/src/components/HelloWorld.vue'
    const { id, ...transformInfo } = result;
    if (this.transformMap[id]) {
      this.transformMap[id].push({
        ...transformInfo,
      });
    }
  }

  createServer() {
    const app = express();
    // app.use(express.static(path.join(__dirname, '../../build/client')));
    app.use(express.static(path.join(__dirname, '../', 'client'))); // npm
    app.get('/data', (req, res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.send({
        done: this.done,
        transformMap: this.transformMap,
        context: this.context,
      });
    });

    app.listen(9009, () => {
      console.log('inspect running at port: 9009');
    });
  }
};
