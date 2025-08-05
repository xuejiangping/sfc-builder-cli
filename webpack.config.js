import path from 'path'
/** @type {import('webpack').Configuration} */
export default {
  mode: 'production',
  entry: './src/main.js',
  output: {
    path: path.resolve('dist'),
    filename: 'build-sfc.min.cjs',
    libraryTarget: 'commonjs2'
  },
  // 添加 resolve 配置来解决 Node.js 内置模块解析问题
  resolve: {
    // 当 target 设置为 node 时，webpack 会默认将 node 内置模块（如 path、fs 等）作为外部依赖处理
    // 若非node,则会将 path、fs 等模块作为外部依赖处理
    fallback: {
      // "path": false,
      // "fs": false,
      // "crypto": false,
      // "module": false,
      // "os": false,
      // 'util': false,
      // 'url': false,
      // 'assert': false,
      // 'node:module': false,
      // 'node:fs': false,

    },
    alias: {
      // 为可选依赖提供空的别名,不然打包会build'会依赖报错
      // 这些依赖属于可选依赖，只有在 @vue/compiler-sfc 引用时才会被解析
      // 当前项目不需要这些依赖，所以需要忽略
      'react': false,
      'vash': false,
      'slm': false,
      'marko': false,
      'teacup/lib/express': false,
      'coffee-script': false,
      'squirrelly': false,
      'twing': false,
      'react-dom': false,
      'tinyliquid': false,
      'liquid-node': false,
      'jade': false,
      'then-jade': false,
      'dust': false,
      'dustjs-helpers': false,
      'swig': false,
      'swig-templates': false,
      'razor-tmpl': false,
      'pug': false,
      'then-pug': false,
      'qejs': false,
      'nunjucks': false,
      'arc-templates/dist/es5': false,
      'velocityjs': false,
      'dustjs-linkedin': false,
      'atpl': false,
      'liquor': false,
      'twig': false,
      'ejs': false,
      'eco': false,
      'jazz': false,
      'jqtpl': false,
      'hamljs': false,
      'hamlet': false,
      'whiskers': false,
      'haml-coffee': false,
      'hogan.js': false,
      'templayed': false,
      'handlebars': false,
      'underscore': false,
      'lodash': false,
      'walrus': false,
      'mustache': false,
      'just': false,
      'ect': false,
      'mote': false,
      'toffee': false,
      'dot': false,
      'bracket-template': false,
      'ractive': false,
      'htmling': false,
      'babel-core': false,
      'plates': false

    },
  },
  target: ['node'],
  // externals: {
  //   // 将整个 @vue/compiler-sfc 标记为外部依赖
  //   '@vue/compiler-sfc': 'commonjs @vue/compiler-sfc',
  // }


}