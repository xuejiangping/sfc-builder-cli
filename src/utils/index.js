import { access,mkdir,readFile,stat,writeFile } from 'fs/promises'
import path from 'path'
import { STATUS_MSG } from "../constants/index.js"


export function logResult(resulstList = []) {

  const infoStr = [
    '***************************************',
    '*',
    '*',
    ...resulstList.map(item => `*  ${item.status}  ${item.id}  ${item.file}   ${STATUS_MSG[item.status]}`),
    '*',
    '*',
    '***************************************'
  ].join('\r\n')

  console.info(infoStr)
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
  const jsonTemplate = {
    ids: [],
    components: {}
  }
  return new Promise((res,rej) => {
    access(jsonPath).then(async () => {
      try {
        const optionStr = await readFile(jsonPath,'utf8') || '{}'
        const option = JSON.parse(optionStr);
        res(option || jsonTemplate)

      } catch (error) {
        rej('Error reading _build.json: ' + error)
      }
    }).catch(() => res(jsonTemplate))
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
    else if (create) await mkdir(dirPath)
    else throw error
  }



}