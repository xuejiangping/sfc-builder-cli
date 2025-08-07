# sfc-builder-cli

---

## 介绍

这是一个用于 编译 vue 单文件组件为全局组件的 cli 命令行工具，该工具使用`vue` 官方工具包[@vue/compiler-sfc](`@vue/compiler-sfc`) 模块，编译选项式 api 风格的 `.vue` 文件为全局组件

只需要在项目 html 中引入编译产物 index.js、index.css，即完成了组件的全局注册

该工具为完全构建，除了基本的 node 环境外，不需要任何外部依赖，非常适合 内网开发、 cdn 等非工程化开发环境使用。

该工具 已支持 [vscode 插件](https://gitee.com/xue6474/sfc-builder-vsce.git)使用，大大提高了易用性，强烈推荐。详情查看:https://gitee.com/xue6474/sfc-builder-vsce.git

**推荐目录结构**：

```js
static               // 静态目录，方便项目直接引用 dist中的index.js、index.css
├─ components        // vue组件目录
│  ├─ A
│  │  └─ index.vue
│  └─ B
│     └─ index.vue
└─ sfc-builde-cli.min.cjs  // 已打包的cli工具，只需要node环境使用，无需其他依赖
└─ build.ps1        // powershell脚本,更加方便使用sfc-builde-cli.min.cjs
└─ dist
   ├─ index.js
   ├─ index.css
   └─ _build.json   //记录组件构建信息，编译自动生成


```

> tips:
>
> 1. 出于描述方便，后文中提到的 cli 工具，若非特定说明，均指代 sfc-builder-cli.min.cjs
> 2. 开发环境中，提交代码只追踪 index.js 和 index.css 即可，编译相关文件不用提交

## 详情

#### style 部分：

**scoped**
vue 组件中 style 标签可能有 scoped 属性，为了避免全局样式污染， 工具会根据当前文件内容生成唯一 hash(md5)到属性选择器

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

**less and css**
同样也支持 将 less 语法和 css 嵌套语法换成普通 css：

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

#### template 部分：

首先需要使用 `@vue/compiler-sfc`的`compileTemplate` 方法编译 vue 文件，获取组件的元信息

```js
/** 编译vue文件sfcSource ，返回组件元信息 */
const { descriptor } = parse(sfcSource)
/** 获取组件template元信息 */
const templateCompileResult = compileTemplate({
	source: descriptor.template.content,
	// filename: 'aa.vue',
	id: hashId, // 唯一标识符
	scoped, // 是否启用样式作用域
	transformHoist: null, // 自定义提升逻辑
	preprocessLang: '', // 预处理器语言（如 pug）
	preprocessOptions: {}, // 预处理器选项
	compilerOptions: {
		// nodeTransforms: [addScopedIdTransform(hashId)]
	},
})
```

而 template 的编译结果(`templateCompileResult.code`)是一个 render 函数字符串，这是 cdn 环境和非工程化环境不能直接使用的

我们的目标是一个 包含 template 字符串的模板，而非一个依赖各种 vue 工具函数的 render 函数。
所以这里我们需要自己构建一个带有自定义属性 `data-v-hash`的 template 字符串模板

```html
<div class="mystyle">
	<div class="dd" data-v-f654396b>
		<div class="ee" data-v-f654396b></div>
	</div>
</div>
```

因为 vue 的`template`模板也是一段`html`, 所以 cli 工具中使用了 `cheerio`(一个可在 node 端使用的类 jQuery 的库，常用于 node 端爬虫 )这个工具，遍历 template,给节点添加自定义属性

```js
/**遍历模板，添加自定义属性 */
function addAttrToTemplateDeep(templateStr, key, val = '') {
	const $ = cheerio.load(templateStr, { quirksMode: true }, false)
	const nativeHtmlTags = [...需要添加属性的原生标签]
	const nativeHtmlTagsStr = nativeHtmlTags.join(',')
	const target = $.root()
	target.add(target.find(nativeHtmlTagsStr)).attr(key, val)
	return target.html()
}
```

接下来，只需要 添加相应编译 注释信息，生成全局组件模板的字符串即可

```js
// lib/build.js

/* 生成全局组件模板 */
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

#### \_build.json 说明

\_build.json 文件记录了我们的构建信息，由 cli 工具自动生成和更新。主要用来缓存结果，避免重复编译文件

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

## 使用方法

#### 1. sfc-builder-cli.min.cjs

cli 工具 已完全构建，无需任何外部依赖，直接在 node 环境中使用即可

```sh
sfc-builder-cli.min.cjs build <files..>

构建组件

Positionals:
  files  要构建的文件列表                       [array] [required] [default: []]

Options:
      --version     Show version number                                [boolean]
  -h, --help        Show help                                          [boolean]
  -t, --idType      id生成的方式                   [string] [default: "dirName"]
  -p, --idPre       id前缀                             [string] [default: "xue"]
  -m, --renderMode  使用render函数替代template模板                     [boolean]
  -o, --outputPath  指定打包后组件的 index.js和index.css 输出路径
          [string] [default: "C:\Users\11275\Desktop\workspace\sfc-builder-cli"]
```

**示例：**

```sh

node sfc-builder-cli.min.cjs build  --idType dirName --idPre xue --outputPath ./dist  ./D/index.vue ./E/index.vue

```

> 参数说明：

- idType【可选】：注册组件名的方式，默认值：dirName

  - 当为 dirName 时，组件名会根据文件夹名称生成，比如：`/Hello/index.vue`，组件名为"hello"
  - 当为 fileName 时，组件名会根据文件名称生成，比如：`/Hello/World.vue`，组件名为"world"

- idPre【可选】：注册组件名的前缀，默认为 xue,如上面示例中会注册组件名 "xue-d"
- renderMode【已禁用】: 将使用 render 函数替代 template 来注册组件
- outputPath【可选】: 输出目录，默认为 当前工作目录

#### 2. build.ps1

很多时候，直接使用 node 脚本 并不方便，参数多且终端没有任何智能提示

如果需要经常终端中使用该 cli 工具，推荐使用 build.ps1 这个 powerShell 脚本,它是对 cli 工具的封装，拥有 powerShell 的智能提示和补全，更加方便使用

> tip：powershell 支持智能提示，输入 "-" 后按 tab 会提示参数

```pwsh
SYNTAX
    C:\Users\11275\Desktop\workspace\sfc-builder-cli\script\build.ps1 [[-idType] <Object>] [[-idPre] <String>] [[-compPath] <String>] [[-executeFile] <String>] [[-outputPath]
    <String>] [-reset] [-renderMode] [<CommonParameters>]

DESCRIPTION

PARAMETERS
    -idType <Object>

    -idPre <String>

    -compPath <String>

    -executeFile <String>

    -outputPath <String>

    -reset [<SwitchParameter>]

    -renderMode [<SwitchParameter>]
```

**使用示例：**

```pwsh
build.ps1 -idType dirName -idPre x -compPath ./comp/  -executeFile sfc-builder-cli.min.cjs  -reset  -renderMode

```

相对于直接通过 node 使用 cli 工具,build.ps1 提供了更多功能：

1. 可以指定整个组件目录，通过 -compPath,可以指定整个组件目录，脚本会递归遍历(`Get-ChildItem $compPath -Recurse -File -Include '*.vue'`)整个目录下所有 vue 文件，再调用 cli 工具，类似：`node sfc-builder-cli.min.cjs build a.vue b.b.vue c.vue`

2. 重置输出目录，有些时候，我们需要再构建之前先清空输出目录（`outputPath`），可以添加 -reset 参数，清空输出目录

> 参数说明：

- compPath【必选】：组件路径
  - 当为一个 vue 文件时，会编译该文件
  - 当为文件夹时，会递归编译该文件夹下的所有 vue 文件。
- executeFile【必选】：cli 工具执行文件所在路径,开发调试时，选择项目入口文件`main.js`,而正常使用时，请选择打包后的 cli 工具文件`sfc-builder-cli.min.cjs`
- reset【可选】：重置编译文件，若添加`-reset` 参数，则在编译之前会先删除之前编译生成的 index.js、index.css、\_build.json

其他参数请 参考`sfc-builder-cli.min.cjs`部分的参数说明

#### 3. 使用 vsode 插件 sfc-builder-vsce

不论是通过 node 直接使用 cli 工具，还是通过 build.js 脚本使用，相对来说都比较麻烦。所以在此强烈推荐 使用 vsode 插件 [sfc-builder-vsce](https://gitee.com/xue6474/sfc-builder-vsce.git)

`sfc-builder-vsce` 是专门为了在 vscode 中使用 cli 工具的插件，它非常易用且高效

##### 使用说明

1.  安装插件

    目前插件并未上架 vscode 插件市场，需自行访问插件仓库：https://gitee.com/xue6474/sfc-builder-vsce.git，下载 release 目录下的 sfc-builder-vsce.vsix 安装即可

2.  启用插件
    在 vscode 中，输入 `ctrl+shift+p` 打开命令面板，然后输入 `sfc-builder-build`命令并执行，即可启用插件。

    插件会自动监听正在编辑且保存的 vue 文件，并自动执行 cli 工具构建

3.  配置

    插件支持 vscode ui 配置，可在 设置中搜索 "sfc-builder-vsce"
