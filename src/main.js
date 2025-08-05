
import path from 'path'
import { argv } from './_argv.js'
import { build,readBuildJson,updateFromBuildJson,writeBuildJson } from './_build.js'
import { STATUS,STATUS_MSG,__dirname } from './constants/index.js'

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
  let id,_file

  try {
    const buildJson = await readBuildJson(jsonPath)
    for (const file of files) {
      id = getId(file)?.toLowerCase()
      if (!id) {
        resulstList.push({ file,status: STATUS.ID_ERROR,id: 'ID_ERROR' })
        continue
      }
      if (idPre) id = `${idPre}-${id}`
      _file = file

      const { status } = await build({ vueFilePath: file,id,buildJson,renderMode })
      resulstList.push({ file,status,id })
    }
    await writeBuildJson(buildJson,jsonPath)
    await updateFromBuildJson(buildJson,outputPath)


  } catch (error) {
    console.error(error)
    resulstList.push({ file: _file,status: STATUS.ERROR,id })
  }

  console.info([
    '***************************************',
    '**********************************',
    '*',
    ...resulstList.map(item => `*  ${item.status}  ${item.id}  ${item.file}   ${STATUS_MSG[item.status]}`),
    '*',
    '**********************************',
    '***************************************'
  ].join('\r\n'))


}

main()




