import { compileScript,compileStyle,compileTemplate,parse } from '@vue/compiler-sfc'
import * as cheerio from 'cheerio'
import { readFile } from 'fs/promises'
import less from 'less'
import path from 'path'
import { STATUS,__dirname } from '../constants/index.js'
import { createMd5,writeFileSmartAsync } from '../utils/index.js'

// debugger

// 兼容打包后 less.default 的情况，打包后 less?.render() 会报错,此处必须处理
const lessInstance = less?.render ? less : less?.default;
/**
 * BuildJson 决定了 build.json保存组件信息 的结构
 * @typedef {{ids:string[],components:Record<string,{scriptStr:string,styleStr:string,hash:string}>}} BuildJson
 */




/**
 * 节点转换函数，可对node自定义修改
 * @param {*} attrName 
 * @param {*} attrValue 
 * @returns 
 */
function addScopedIdTransform(scopedId) {
  return (node) => {
    if (node.type === 1 /* Element */) {
      // debugger
      // 跳过包含指令的节点（可选，根据需求）
      if (node.directives && node.directives.length > 0) {
        return; // 不修改包含指令的节点
      }
      // 添加 scopedId 
      // debugger
      if (node.props) {
        node.props.push({
          type: 6,name: `data-v-${scopedId}`,
          value: {
            type: 2,
            content: ""
          }
        })
      }

    }
  };
}


/**
 * vue文件内容
 */
async function _compile({ sfcSource,hash }) {


  const hashId = hash.slice(0,8)
  const { descriptor } = parse(sfcSource)
  //根据style标签中的scoped属性，判断是否需要添加样式作用域
  const scoped = !!descriptor.styles[0]?.scoped
  const lang = descriptor.styles[0]?.lang


  const scriptCompileResult = compileScript(descriptor,{
    id: hashId // 唯一标识符，用于生成作用域 ID
  });

  let styleCode = descriptor.styles[0]?.content ?? ''

  if (lang == 'less') {
    styleCode = (await lessInstance.render(styleCode,{})).css
  }

  const styleCompileResult = compileStyle({
    source: styleCode,
    // filename: 'MyComponent.vue',
    id: hashId, // 唯一标识符
    scoped, // 是否启用样式作用域
    // preprocessLang: 'css', // 预处理器语言（如 less、sass）

  });



  let templateCompileResult = compileTemplate({
    source: descriptor.template.content,
    // filename: 'aa.vue',
    id: hashId, // 唯一标识符
    scoped, // 是否启用样式作用域
    transformHoist: null, // 自定义提升逻辑
    preprocessLang: '', // 预处理器语言（如 pug）
    preprocessOptions: {}, // 预处理器选项
    compilerOptions: {
      // nodeTransforms: [addScopedIdTransform(hashId)]
    }

  });

  // debugger

  if (scoped) templateCompileResult.templateStr = addAttrToTemplateDeep(templateCompileResult.source,`data-v-${hashId}`)
  else templateCompileResult.templateStr = templateCompileResult.source
  // debugger
  return {
    templateCompileResult,
    scriptCompileResult,
    styleCompileResult
  }
  // debugger
}

/**
 * 生成组件全局注册代码和样式代码
 * @returns 
 */
function generateComponentScriptStr({ id = 'MyComponent',
  scriptStr = '',
  templateStr = '',
  vueFilePath = '',
  updateTime,
  renderStr,
}) {

  /** template中字符串模板需要 字符串转义 */
  templateStr = templateStr.replaceAll('`','\\`').replaceAll('$','\\$')
  const showPath = vueFilePath.split(path.sep).slice(-2).join('/')
  const compStr = `/*
* 组件名： ${id}
* vue文件路径: ${showPath}
* 最后更新时间: ${updateTime}
 */
Vue.component('${id}', {
  ${renderStr || `template:\`${templateStr}\``},
  ${scriptStr}
  });`
  return compStr
}

/**
 * 生成组件样式代码
 * @param {*} rawStr 
 * @returns 
 */
function generateComponentStyleStr(rawStr) {

  return rawStr
}








/**生成render函数模板，提前打包renderTools */
function generateRenderStr(templateCompileResult) {
  const [p1,p2,p3] = templateCompileResult.code.split(/(?<=from "vue")\n\n|\n\n(?=export function render)/)

  const s1 = `const ${p1.match(/\{.+\}/)[0].replaceAll(' as ',':')} = window.renderTools.renderTools`
  const [p4,p5] = p3.split(/(?<=export function render\(_ctx, _cache\) \{)\n/)

  // debugger
  const renderFnStr = `${p4.replace('export function ','')}
    ${s1};
    ${p2}
    ${p5}`
  // writeFile('./dist/bb.js',renderFnStr,'utf8')

  return renderFnStr
}
/**
 * 给 templateStr 添加自定义属性，用于支持 style的 scoped 
 * @returns  {string}
 */
function addAttrToTemplateDeep(templateStr,key,val = '') {
  const $ = cheerio.load(templateStr,{ quirksMode: true },false)
  const nativeHtmlTags = ['abcd',
    'a','abbr','address','area','article','aside','audio','b',
    'br','button','canvas','caption','code','dd','del',
    'dialog','div','dl','dt','em','embed','fieldset','footer','form','h1','h2',
    'h3','h4','h5','h6','header','hr','i','iframe','img','input','label',
    'li','main','map','mark','meter','nav','object','ol','optgroup','option',
    'p','picture','pre','progress','rt','section','select','small',
    'span','strong','sub','summary','sup','table','tbody','td','textarea',
    'th','thead','time','title','tr','track','u','ul','video'
  ];
  const nativeHtmlTagsStr = nativeHtmlTags.join(',')
  const target = $.root()
  target.add(target.find(nativeHtmlTagsStr)).attr(key,val);
  return target.html()
}

async function _build({ vueFilePath,id,updateTime,sfcSource,hash,renderMode }) {

  const { scriptCompileResult,templateCompileResult,styleCompileResult } = await _compile({ sfcSource,hash })
  const scriptResult = scriptCompileResult.content.trim().match(/(?<=\{).+(?=\})/sg)[0] ?? ''
  // debugger
  const scriptStr = generateComponentScriptStr({
    id,vueFilePath,
    scriptStr: scriptResult,
    templateStr: templateCompileResult.templateStr,
    renderStr: renderMode ? generateRenderStr(templateCompileResult) : '',
    updateTime,
  })

  const styleStr = generateComponentStyleStr(styleCompileResult.code)
  return {
    scriptStr,
    styleStr
  }

}


/**
 * 
 * @param {} vueFilePath 
 * @param {*} id 
 * @param {BuildJson} buildJson 
 * @returns 
 */
export async function build({ vueFilePath,id,buildJson = {},renderMode }) {
  // if (!path.isAbsolute(vueFilePath)) vueFilePath = path.resolve(vueFilePath)
  const sfcSource = await readFile(vueFilePath,'utf8')
  const hash = createMd5(sfcSource)
  let status = STATUS.OK
  const ids = buildJson.ids ??= []
  const components = buildJson.components ??= {}
  if (ids.includes(id)) {

    if (components[id].hash === hash) {
      // console.warn(`文件:${vueFilePath}未改动,跳过编译!`)
      return { status: STATUS.FILE_NOT_CHANGE }
    }
    else {
      status = STATUS.OVERRIDE
    }
  }
  else { ids.push(id) }

  const updateTime = new Date().toLocaleString()
  components[id] = { ...await _build({ vueFilePath,id,updateTime,hash,sfcSource,renderMode }),updateTime,hash }
  return { status }
}


/**
 * 根据新的buildJson 内容更新index.css和index.js
 * @param {BuildJson} buildJson 
 * @returns 
 */
export function updateFromBuildJson(buildJson = {},outputPath = __dirname) {
  const { components } = buildJson
  const styleArr = [],scriptArr = []
  for (const [id,{ scriptStr,styleStr }] of Object.entries(components)) {
    styleArr.push(styleStr)
    scriptArr.push(scriptStr)
  }
  return Promise.all([
    writeFileSmartAsync(path.join(outputPath,'index.css'),styleArr.join('\r\n'),{ overwrite: true }),
    writeFileSmartAsync(path.join(outputPath,'index.js'),scriptArr.join('\r\n'),{ overwrite: true })
  ])
}
