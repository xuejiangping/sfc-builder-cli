
import path from 'path'
import { argv } from './_argv.js'
import { build,updateFromBuildJson } from './_build.js'
import { STATUS,__dirname } from './constants/index.js'
import { checkDirExist,logResult,readBuildJson,writeBuildJson } from './utils/index.js'

const idType = (argv.idType ?? argv.t)
let idPre = argv.idPre ?? argv.p
const renderMode = argv.renderMode ?? argv.m;
const outputPath = argv.outputPath ?? argv.o ?? __dirname;
const files = argv._
const jsonPath = path.join(outputPath,'./_build.json')

if (files.length === 0) throw Error('请输入文件路径')








// console.log('files',files)

const getId = (() => {

  if (idType === 'dirName') {
    return (filePath) => {
      const parts = filePath.split('\\').reverse()
      if (parts.length < 2) throw Error('dirName模式下必须包含上级的文件名')
      return parts[1]
    }
  } else {
    return (filePath) => filePath.match(/[^/\\]+(?=\.vue$)/)?.[0]
  }
})();


async function main() {

  const resulstList = []

  try {
    await checkDirExist(outputPath)
    const buildJson = await readBuildJson(jsonPath)
    for (const file of files) {
      let id = getId(file)?.toLowerCase()
      if (!id) {
        resulstList.push({ file,status: STATUS.ID_ERROR,id: 'ID_ERROR' })
        continue
      }
      if (idPre) id = `${idPre}-${id}`

      const { status } = await build({ vueFilePath: file,id,buildJson,renderMode })
      resulstList.push({ file,status,id })
    }
    await writeBuildJson(buildJson,jsonPath)
    await updateFromBuildJson(buildJson,outputPath)
    logResult(resulstList)
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
}

main()




