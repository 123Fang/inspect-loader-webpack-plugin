const path = require('path');
const findUp = require('find-up');
const fse = require('fs-extra');
// const { connect } = require('http2')


/**
 * vue-loader 依赖它内部的一些子loader一起完成编译 .vue 文件的工作。
 * 这里，把它的子 loader 也都剥离出来了。比如：pitch (处理路径，给路径上添加内联loader,是一个前置loader)，
 * templateLoader（处理模版），stylePostLoader（处理样式）
 *
 * * */
function getLoaderName(loaderPath) {
  let subLoaderName = '';
  if (/vue\-loader/.test(loaderPath) && /loaders/.test(loaderPath)) {
    // const fileName = path.basename('/path/to/file.txt');
    // console.log(fileName); // 输出: file.txt
    subLoaderName = path.basename(loaderPath);
    subLoaderName = subLoaderName.slice(0, subLoaderName.indexOf('.'));
  }
  // 获取path.dirname(loaderPath) 目录下的package.json文件路径
  const packageJsonPath = findUp.sync('package.json', { cwd: path.dirname(loaderPath) });
  if (packageJsonPath) {
    // 读这个package.json文件，返回一个json对象
    const pkg = fse.readJSONSync(packageJsonPath);
    return pkg.name + (subLoaderName ? ` 中的 ${subLoaderName}` : '');
  }
  return '';
}

const PLUGIN_NAME = 'my-inspect-webpack-plugin';


function pitch(p) { // p绝对路径
  // collectCode 函数，在插件中注入到loaderContext对象上，用来收集loader处理后的内容
  const collectCode = this[PLUGIN_NAME];
  const loaderPaths = this.loaders.map((loader) => loader.path);


  hijackLoaders(loaderPaths, (loader, path) => {
    const loaderName = getLoaderName(path);

    const wrapFunc = (func) => {
      return function proxyLoader(...args1) {
        /**
         * 收集 source
         * 思路：loader函数转换后的字符串，需要继续往下传给下一个loader或丢给webpack。往下传的方式是以下三种：
         * 1 LoaderContext.callback(source)
         * 2 const async = LoaderContext.async(); async(source)
         * 3 return data
         *
         * 解决方案；
         * 针对1,2：
         *    拦截callback和async方法，即可拿到source。
         * 针对3:
         *    拿到return的结果，即可拿到source。
         * * */
        // 针对1,2：拦截 LoaderContext.callback 和 LoaderContext.async
        const almostThis = Object.assign({}, this, {
          async: function (...asyncArgs) {
            const asyncCallback = this.async.apply(this);
            const { resourcePath } = this;
            return function (...args) {
              const end = Date.now();
              const [, source] = args;
              // 收集loder处理后的结果
              collectCode({
                id: resourcePath,
                name: `${loaderName}【${func.type}】`,
                result: source,
                beforeResult: args1[0] ? args1[0] : args1[1],
                type: func.type,
                start,
                end,
              });
              return asyncCallback.apply(this, args);
            };
          }.bind(this),

          callback: function (...args) {
            // const start = Date.now()
            const { resourcePath } = this;
            const end = Date.now();
            const [, source] = args;
            // 收集loder处理后的结果
            collectCode({
              id: resourcePath,
              name: `${loaderName}【${func.type}】`,
              result: source,
              beforeResult: args1[0] ? args1[0] : args1[1],
              type: func.type,
              start,
              end,
              test: 'for callback',
            });
            this.callback.apply(this, args);
          }.bind(this),
        });


        let start = Date.now();
        // 针对3: 拿到return的结果，即可拿到source。
        const ret = func.apply(almostThis, args1); // run 这个 loader。args 是代码字符串。
        let end = Date.now();
        if (ret && typeof ret === 'string') {
          // const start = Date.now()
          let { resourcePath } = this;
          // const end = Date.now();
          // 收集loder处理后的结果
          collectCode({
            id: resourcePath,
            name: `${loaderName}【${func.type}】`,
            result: ret,
            beforeResult: args1[0] ? args1[0] : args1[1],
            type: func.type,
            start,
            end,
            test: 'for return',
          });
        }
        return ret;
      };
    }

  
    if (loader.normal) { // normal loader
      if (!loader.normalRaw) {
        loader.normalRaw = loader.normal;
        loader.normalRaw.type = 'Normal';
      }
      loader.normal = wrapFunc(loader.normalRaw);
    }

    if (loader.default) {// 也是 normal loader(和上面一样)
      if (!loader.defaultRaw) {
        loader.defaultRaw = loader.default;
        loader.defaultRaw.type = 'Normal';
      }
      loader.default = wrapFunc(loader.defaultRaw);
    }

    if (loader.pitch) { // pitch loader (pitch loader一般是用来处理import路径的，这里也收集它处理后的字符串)
      if (!loader.pitchRaw) {
        loader.pitchRaw = loader.pitch;
        loader.pitchRaw.type = 'Pitch';
      }
      loader.pitch = wrapFunc(loader.pitchRaw);
    }

    if (typeof loader === 'function') {
      loader.type = 'Normal';
      const wrapLoader = wrapFunc(loader);
      wrapLoader.pitch = loader.pitch;
      wrapLoader.raw = loader.raw;
      return wrapLoader;
    }

    return loader;
  });
}


/**
 * 思路：
 * webpack创建一个模块后，模块对象的loaders属性中包含了要处理这个模块需要的loader,
 * 这些loader处理后的资源字符串需要被收集到，抽象为以下两步：
 * 1 先拿到loader。
 * 2 代理这个loader,即可实现收集处理后的资源。
 *
 * 解决方案：
 * webpack内部用Module.prototype.require来加载loader，那么拦截Module.prototype.require。即可拿到loader
 * * */
function hijackLoaders(loaderPaths, proxyLoader) {

  const markProxyRequire = (requireRaw) => {

    return function proxyRequire(...args) {

      let target = requireRaw.apply(this, args) // 拿到requrie的内容

      const pathString = args[0] // 当前模块的路径(绝对路径)
      // loaderPaths 是一个数组，是当前模块匹配到的所有loader的路径
      // 如果require当前路径在loaderPaths数组中存在，代表加载的是处理这个模块的loader，然后拦截这个loader
      if (loaderPaths.includes(pathString) && !/my\-inspect\-webpack\-plugin/.test(pathString)) {
        return proxyLoader(target, pathString); // 返回代理loader
      }

      // 否则，什么都不做，requrie啥，就返回啥！
      return target
    };
  };

  const Module = require('module');
  if (!Module.prototype.rawRequire) {
    Module.prototype.rawRequire = Module.prototype.require;
  }
  // 重写 require
  Module.prototype.require = markProxyRequire(Module.prototype.rawRequire);
}

exports.pitch = pitch;
