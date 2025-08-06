
import path from 'path'
import { BUILD_JSON_NAME,STATUS } from './constants/index.js'
import { build,clear,command_argv,updateFromBuildJson } from './lib/index.js'
import { checkDirExist,logResult,readBuildJson,writeBuildJson } from './utils/index.js'


switch (command_argv._[0]) {
  case 'build':
    start_build(command_argv)
    break;
  case 'clear':
    start_clear(command_argv)
    break;
}


async function start_build(argv) {

  const { idType,idPre,renderMode,outputPath,files } = argv
  const jsonPath = path.join(outputPath,BUILD_JSON_NAME)


  if (files.length === 0) throw Error('请输入文件路径')
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
  })();;



  try {
    const resulstList = []
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





async function start_clear(argv) {

  const clearPath = argv.clearPath
  try {
    await clear(clearPath)
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
}