

import { rm } from 'fs/promises'


export async function clear(clearPath) {
  // console.log('开始 clear')
  try {
    await rm(clearPath,{ recursive: true,force: true })
    console.log('clear 成功',clearPath)
  } catch (error) {
    throw error
  }
}