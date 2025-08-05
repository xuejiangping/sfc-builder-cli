import yargs from 'yargs';

export const argv = yargs(process.argv.slice(2))
  .option('idType',{
    alias: 't',
    describe: 'id生成的方式',
    type: 'string',
    default: 'dirName',
  })
  .option('idPre',{
    alias: 'p',
    describe: 'id前缀',
    type: 'string',
  })
  .option('renderMode',{
    alias: 'm',
    describe: '使用render函数替代template模板',
    type: 'boolean',
  })
  .option('outputPath',{
    alias: 'o',
    describe: '指定打包后组件的 index.js和index.css 输出路径',
    type: 'string',
  }).option('help',{ alias: 'h' })
  .argv;

