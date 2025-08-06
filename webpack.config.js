import path from 'path'
/** @type {import('webpack').Configuration} */
export default {
  mode: 'production',
  entry: './src/main.js',
  output: {
    path: path.resolve('dist'),
    filename: 'sfc-builder-cli.min.cjs',
    libraryTarget: 'commonjs2'
  },
  // 添加 resolve 配置来解决 Node.js 内置模块解析问题
  resolve: {
    /**************************************************
    *  fallback 配置选项，当正常解析失败时，重定向模块请求
    * 
    * 当前项目中，当编译的 target 设置为 node 时，webpack 会默认将 node 内置模块（如 path、fs 等）作为外部依赖处理
    * 如果target为浏览器或类似的环境,若使用node中的模块，需要添加对应的resolve.alias
    * 
     **************************************************/
    fallback: {
      // path: require.resolve('path-browserify'),
      // "fs": false,
      // "crypto": false,
    },
    alias: {

      /**************************************************
      * 将 resolve.alias 设置为 false 将告知 webpack 忽略模块
      * 以下这些依赖属于 @vue/compiler-sfc  可选依赖，只有它们被引用时才会被解析
      * 当前项目中不需要使用他们，必须将他们忽略，不然打包build 会依赖报错
       **************************************************/
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
  externals: {

    /**************************************************
    *
    *  ${externalsType} ${libraryName} 语法，
    *  即构建结果中的依赖会用 ${libraryName} 引用，引用方法由externalsType决定
    *  如：'commonjs @vue/compiler-sfc' 构建结果为：require('@vue/compiler-sfc')
    *
     **************************************************/


    //   '@vue/compiler-sfc': 'commonjs @vue/compiler-sfc',
  }


}