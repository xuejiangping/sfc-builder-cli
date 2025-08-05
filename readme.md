### 使用说明

---

### 1. 介绍

本工具使用 `@vue/compiler-sfc` 模块，编译 `.vue` 文件得到 `script`、`template`、`style` 中的内容，再将他们以注册全局组件`Vue.component`的方式组装起来，在根 html 中引入编译后的 index.js、index.css，即完成单文件组件的全局注册。

**推荐使用结构**：

```js
static               // 静态目录
├─ comp              // 组件目录
│  ├─ A
│  │  └─ index.vue
│  └─ B
│     └─ index.vue
└─ _build.dist.cjs  // 已打包的编译脚本，只需要node环境即可，无需其他依赖
└─ _build.ps1       // 使用_build.dist.cjs 的powershell脚本,可以更加方便使用编译脚本
└─ _build.json    //组件信息记录文件，编译自动生成
└─ index.js       //组件注册文件，编译自动生成，需引入根html
└─ index.css     //组件样式文件，编译自动生成,需引入根html

```

**注意**：提交代码时只提交 index.js 和 index.css 即可，编译相关文件不用提交

> #### template 部分

通过 compiler-sfc 模块，拿到 vue 文件中 template，拼装注册组件函数，可添加对应的编译元信息注释

```js
function generateComponentScriptStr({ id = 'MyComponent', scriptStr = '', templateStr = '', vueFilePath = '', updateTime, renderStr }) {
	const compStr = `/*
* 组件名： ${id}
* vue文件路径: ${vueFilePath}
* 最后更新时间: ${updateTime}
 */
Vue.component('${id}', {
  ${renderStr || `template:\`${templateStr}\``},
  ${scriptStr}
  });`
	return compStr
}
```

> #### css 部分：

当 vue 文件中 style 标签有 scoped 属性时， 会根据当前文件内容生成唯一 hash 值(md5)的属性到选择器来避免全局样式污染

```html
<style scoped>
	.mystyle {
		.dd {
			&[data-v-f654396b] {
				color: red;
			}
			.ee[data-v-f654396b] {
				color: orange;
			}
		}
	}
</style>
```

同时也支持 将 less 语法和 css 嵌套语法换成普通 css：

```html
<style scoped lang="less">
	@width: 10px;
	@height: @width + 10px;
	#header {
		width: @width;
		height: @height;
	}
</style>
```

```css
#header[data-v-9ca88dfc] {
	width: 10px;
	height: 20px;
}
```

为了使属性选择器生效，template 中的 标签也需要添加 `data-v-hash`属性

```html
<div class="mystyle">
	<div class="dd" data-v-f654396b>
		<div class="ee" data-v-f654396b></div>
	</div>
</div>
```

当前实现的方式是使用 `cheerio`(一个可在 node 端使用的类似 jQuery 的库 )

```js
function addAttrToTemplateDeep(templateStr, key, val = '') {
	const $ = cheerio.load(templateStr, { quirksMode: true }, false)
	const nativeHtmlTags = [...需要添加属性的原生标签]
	const nativeHtmlTagsStr = nativeHtmlTags.join(',')
	const target = $.root()
	target.add(target.find(nativeHtmlTagsStr)).attr(key, val)
	return target.html()
}
```

> #### \_build.json

该文件记录了组件的编译信息，由`_build.js`自动生成和更新,用于组件的缓存，避免重复编译文件

```json
{
	"ids": ["x-a", "x-b"],
	"components": {
		"x-a": {
			"scriptStr": "组件注册部分",
			"styleStr": "组件css部分",
			"updateTime": "组件上次编译时间",
			"hash": "vue文件hash"
		}
	}
}
```

### 2.使用方法

#### 1. \_build.dist.cjs 和\_build.js

- \_build.js 是脚本源码部分，需要安装相关依赖后使用，可根据需要自行修改后重新打包
- \_build.dist.cjs 是\_build.js 打包后的文件，无需依赖，直接通过`node`使用即可

```sh
node _build.dist.cjs [--idType|-t] [--idPre|-p]  [--renderMode|-m] <A.vue,B.vue,...>
```

比如：

```sh
node .\comp\_build.dist.cjs --idType dirName --idPre xue ./D/index.vue ./E/index.vue
```

将会在脚本当前所在目录生成 index.js,index.css,\_build.json

> 参数说明：

- idType【可选】：注册组件名的方式，默认值：dirName

  - 当为 dirName 时，组件名会根据文件夹名称生成，比如：`/Hello/index.vue`，组件名为`hello`
  - 当为 fileName 时，组件名会根据文件名称生成，比如：`/Hello/World.vue`，组件名为`world`

- idPre【可选】：注册组件名的前缀，如上面示例中会注册组件名： xue-d
- renderMode【可选】: 将使用 render 函数替代 template 来注册组件，render 函数 需要用到很多 vue3 编译 api,在 vue2 项目中无法使用，默认为 false

#### 2. \_build.ps1

直接使用 `_build.dist.cjs` 不太方便，如需要编译整个 comp 目录中所有的 vue 文件时，需要传入所有 vue 文件的路径，所以可以使用`_build.ps1`这个脚本

`_build.ps1` 是封装了`_build.dist.cjs`的 powershell 脚本，可以更加方便的调用`_build.dist.cjs`编译组件

**pwshell 终端中使用**：

```pwsh
_build.ps1 -idType dirName -idPre x -compPath ./comp/  -executeFile ./comp/_build.js  -reset  -renderMode

```

**提示**：powershell 支持智能提示，输入`-`后按 tab 会提示脚本参数

> 参数说明：

- idType【可选】：见上
- idPre【可选】：同上
- renderMode【可选】:同上
- compPath【必选】：组件路径
  - 当为一个 vue 文件时，会编译该文件
  - 当为文件夹时，会递归编译该文件夹下的所有 vue 文件。
- executeFile【可选】：选择执行文件所在路径,默认值：\_build.dist.cjs
- reset【可选】：重置编译文件，若添加`-reset` 参数，则在编译之前会先删除之前编译生成的 index.js、index.css、\_build.json

#### 3. 使用 package.json

除了手动输入命令，也可以选择使用 `package.json` 来执行脚本

```json

"scripts": {
	"build": "pwsh ./comp/_build.ps1   -compPath ./comp   ",
	"dev": "pwsh ./comp/_build.ps1 -idType dirName -idPre x -compPath ./comp    -executeFile ./comp/_build.js"
}

```

> 注意：

1.  `pwsh`是较高版本 powershell 的可执行文件名，较低版本的 powershell 可执行文件名是 `powershell`，可以在 powershell 终端中运行`$PSVersionTable.PSVersion`查看当前版本号
