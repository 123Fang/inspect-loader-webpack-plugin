const path = require('path');
const fs = require('fs');

const sourceDirectory = path.join(__dirname, '../src/node'); // 设置源目录的路径
const destinationDirectory = path.join(__dirname, '../build/node'); // 设置目标目录的路径
const pkgPath = path.join(path.join(__dirname, '../build'), './package.json');


function copyDirectory(source, destination) {
  if (!fs.existsSync(destination)) {
    fs.mkdirSync(destination);
  }

  const files = fs.readdirSync(source);

  for (const file of files) {
    const sourcePath = path.join(source, file);
    const destinationPath = path.join(destination, file);

    if (fs.statSync(sourcePath).isDirectory()) {
      copyDirectory(sourcePath, destinationPath);
    } else {
      fs.copyFileSync(sourcePath, destinationPath);
    }
  }
}

copyDirectory(sourceDirectory, destinationDirectory);

const packageJson = {
  name: 'inspect-loader-webpack-plugin',
  version: '0.0.2',
  description: '查看webpack中loader对模块的处理的前后code对比，和 耗时',
  main: 'node/index.js',
  module: 'node/index.js',
  license: 'MIT',
  repository: {
    type: 'git',
    url: 'git+https://github.com/123Fang/inspect-loader-webpack-plugin.git',
  },
  dependencies: {
    express: '^4.18.1',
    'find-up': '^5.0.0',
    'fs-extra': '^10.1.0',
  },
};

fs.writeFileSync(pkgPath, JSON.stringify(packageJson, null, 2));
console.log(pkgPath)
