import { createHash } from 'crypto'
import { access,mkdir,readFile,stat,writeFile } from 'fs/promises'
import path from 'path'
import { STATUS_MSG } from '../constants/index.js'


export function logResult(resulstList = []) {
  console.table(resulstList,['id','status','file','msg'])
}



export async function writeFileSmartAsync(filePath,content,{
  overwrite = false,
  separator = '\r\n',
  encoding = 'utf8',
} = {}) {
  const normalizedPath = path.normalize(filePath)
  const dirPath = path.dirname(normalizedPath)

  try {
    // 1. 确保目录存在
    await mkdir(dirPath,{ recursive: true })
    // 2. 处理文件存在情况
    try {
      const stats = await stat(normalizedPath)
      if (stats.isFile()) {
        if (overwrite) {
          await writeFile(normalizedPath,content,{ encoding })
        } else {
          // 追加内容
          const existingContent = await readFile(normalizedPath,'utf-8')
          const newContent = existingContent +
            (existingContent.endsWith(separator) ? '' : separator) + content
          await writeFile(normalizedPath,newContent,encoding)
        }
      }
    } catch (err) {
      if (err.code === 'ENOENT') {
        // 3. 文件不存在直接创建
        await writeFile(normalizedPath,content,encoding)
      } else {
        throw err
      }
    }
  } catch (err) {
    throw new Error(`File operation failed: ${err.message}`)
  }
}





// #region 读写_build.json
export async function readBuildJson(jsonPath = path.join(__dirname,'./_build.json')) {

  return new Promise((res,rej) => {
    access(jsonPath).then(async () => {
      try {
        const buildJson = JSON.parse(await readFile(jsonPath,'utf8'));
        if (buildJson.ids && buildJson.components) res(buildJson)
        else throw Error('_build.json格式错误')
      } catch (error) {
        rej('Error reading _build.json: ' + error)
      }
    }).catch(() => {
      const jsonTemplate = {
        ids: [],
        components: {}
      }
      res(jsonTemplate)
    })
  })

}
export async function writeBuildJson(opiton,jsonPath = path.join(__dirname,'./_build.json')) {
  try {
    const jsonStr = JSON.stringify(opiton,null,2);
    await writeFile(jsonPath,jsonStr,'utf8');
  } catch (error) {
    console.error('Error writing _build.json:',error);
    throw Error('Error writing _build.json')
  }
}

// #endregion

export async function checkDirExist(dirPath,create = true) {
  try {
    const stats = await stat(dirPath)
    if (!stats.isDirectory()) throw Error(`${dirPath} is not a directory`,{ cause: 'not_a_directory' })
  } catch (error) {
    if (error.cause === 'not_a_directory') throw error
    else if (create) await mkdir(dirPath,{ recursive: true })
    else throw error
  }



}


export function createMd5(data) {
  return createHash('md5').update(data).digest('hex')
}

export function getId(idType,filePath) {
  const { name,ext,dir } = path.parse(path.normalize(filePath))
  if (ext !== '.vue') throw Error('filePath必须包含 vue文件: ' + filePath)
  const dirArr = dir.split(path.sep)
  if (!dir || dirArr.length == 0) throw Error('dirName模式下必须包含上级目录名: ' + filePath)
  return idType === 'dirName' ? dirArr.pop() : name
}


export class Result {
  constructor({ file,status,id,msg }) {
    this.file = file
    this.status = status
    this.id = id
    this.msg = msg || STATUS_MSG[status]
  }
}
