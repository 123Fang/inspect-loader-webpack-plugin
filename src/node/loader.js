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
    subLoaderName = path.basename(loaderPath);
    subLoaderName = subLoaderName.slice(0, subLoaderName.indexOf('.'));
  }
  const packageJsonPath = findUp.sync('package.json', { cwd: path.dirname(loaderPath) });
  if (packageJsonPath) {
    const pkg = fse.readJSONSync(packageJsonPath);
    return pkg.name + (subLoaderName ? ` 中的 ${subLoaderName}` : '');
  }
  return '';
}

const PLUGIN_NAME = 'my-inspect-webpack-plugin';


function pitch(p) { // p绝对路径
  const callback = this[PLUGIN_NAME];
  const loaderPaths = this.loaders.map((loader) => loader.path);


  hijackLoaders(loaderPaths, (loader, path) => {
    const loaderName = getLoaderName(path);

    const wrapFunc = (func) => function proxyLoader(...args1) {
      if (func.type === 'Pitch') {
        // debugger;
      }
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
            callback({
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
          callback({
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
      if (ret && typeof ret === 'string') {
        // const start = Date.now()
        let { resourcePath } = this;
        const end = Date.now();
        callback({
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
    // if (/url-loader/.test(path)) {
    //   debugger
    // }
    if (loader.normal) {
      if (!loader.normalRaw) {
        loader.normalRaw = loader.normal;
        loader.normalRaw.type = 'Normal';
      }
      loader.normal = wrapFunc(loader.normalRaw);
    }

    if (loader.default) {
      if (!loader.defaultRaw) {
        loader.defaultRaw = loader.default;
        loader.defaultRaw.type = 'Normal';
      }
      loader.default = wrapFunc(loader.defaultRaw);
    }

    if (loader.pitch) {
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
function hijackLoaders(loaderPaths, callback) {
  const markProxyRequire = (requireRaw) => {
    return function proxyRequire(...args) {
      // if (/cache\-loader/.test(args[0])) {
      //   debugger
      // }
      // arg[0]是绝对路径
      if (loaderPaths.includes(args[0]) && !/my\-inspect\-webpack\-plugin/.test(args[0])) {
        const loader = requireRaw.apply(this, args);
        return callback(loader, args[0]);
      }
      return requireRaw.apply(this, args);
    };
  };
  const Module = require('module');
  if (!Module.prototype.rawRequire) {
    Module.prototype.rawRequire = Module.prototype.require;
  }
  Module.prototype.require = markProxyRequire(Module.prototype.rawRequire);
}

exports.pitch = pitch;
