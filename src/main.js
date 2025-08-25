
import path from 'path'
import { BUILD_JSON_NAME,STATUS } from './constants/index.js'
import { build,clear,command_argv,updateFromBuildJson } from './lib/index.js'
import { checkDirExist,getId,logResult,readBuildJson,Result,writeBuildJson } from './utils/index.js'


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
  try {
    if (files.length === 0) throw Error('files 不能为空 ')
    const resulstList = []
    await checkDirExist(outputPath)
    const buildJson = await readBuildJson(jsonPath)
    for (const file of files) {
      let id = ''
      try {
        id = getId(idType,file).toLowerCase()
      } catch (error) {
        console.warn(error)
        resulstList.push(new Result(({ file,status: STATUS.ID_ERROR })))
        continue
      }
      if (idPre) id = `${idPre}-${id}`
      try {
        const { status } = await build({ vueFilePath: file,id,buildJson,renderMode })
        resulstList.push(new Result({ file,status,id }))
      } catch (error) {
        console.warn(error)
        resulstList.push(new Result({ file,status: STATUS.ERROR,id }))
      }

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