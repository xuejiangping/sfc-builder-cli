import path from 'path'
/**
 * 编译状态
 */
export const STATUS = {
  ID_ERROR: -3,
  ERROR: -2,
  FILE_NOT_CHANGE: -1,
  OK: 1,
  OVERRIDE: 2
}
export const STATUS_MSG = {
  [STATUS.OK]: '编译成功',
  [STATUS.FILE_NOT_CHANGE]: '文件未发生改动,跳过编译',
  [STATUS.OVERRIDE]: '组件名已存在,文件改动,重新编译',
  [STATUS.ERROR]: '编译失败',
  [STATUS.ID_ERROR]: '生成id失败,跳过编译'
}

export const __dirname = path.resolve()

export const BUILD_JSON_NAME = '_build.json'