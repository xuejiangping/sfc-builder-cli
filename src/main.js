
import path from 'path'
import { command_argv } from './_argv.js'
import { build,updateFromBuildJson } from './_build.js'
import { STATUS,__dirname } from './constants/index.js'
import { checkDirExist,logResult,readBuildJson,writeBuildJson } from './utils/index.js'







// console.log('command_argv',command_argv)



switch (command_argv._[0]) {
  case 'build':
    start_build(command_argv)
    break;
  case 'clear':
    start_clear(command_argv)
    break;
}


async function start_build(argv) {

  const idType = argv.idType
  let idPre = argv.idPre
  const renderMode = argv.renderMode
  const outputPath = argv.outputPath ?? __dirname;
  const files = argv.files ?? []
  const jsonPath = path.join(outputPath,'./_build.json')

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
  })();


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





function start_clear(argv) {
  console.log('开始 clear')
}