import yargs from 'yargs';
import { __dirname } from '../constants/index.js';
const argv = yargs(process.argv.slice(2))

// 配置 yargs
// argv.demandCommand(1,'You need at least one command before moving on')
argv.strict()
argv.help()


export const command_argv = argv.option('help',{ alias: 'h' })
  .command('build <files..>','构建组件',(_argv) => {
    _argv.positional('files',{
      describe: '要构建的文件列表',
      type: 'string',
      array: true,
      demandOption: true,
    }).option('idType',{
      alias: 't',
      describe: 'id生成的方式',
      type: 'string',
      default: 'dirName',
    }).option('idPre',{
      alias: 'p',
      describe: 'id前缀',
      type: 'string',
      default: 'xue',
    }).option('renderMode',{
      alias: 'm',
      describe: '使用render函数替代template模板',
      type: 'boolean',
    }).option('outputPath',{
      alias: 'o',
      describe: '指定打包后组件的 index.js和index.css 输出路径',
      type: 'string',
      default: __dirname,
    })
  })
  .command('clear <clearPath>','清空构建目录',_argv => {
    _argv.positional('clearPath',{
      describe: '指定清空的目录',
      type: 'string',
      demandOption: true,
    })
  })
  .argv;



