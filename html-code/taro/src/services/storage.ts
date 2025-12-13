import Taro from '@tarojs/taro'

// 模块：本地存储封装
// 作用：统一管理键值读写，便于后续替换或加密
export const set = (key: string, value: unknown) => {
  // 写入数据（同步）
  Taro.setStorageSync(key, value)
}

export const get = <T = unknown>(key: string, def: T | null = null): T | null => {
  // 读取数据（同步），若不存在返回默认值
  const v = Taro.getStorageSync(key)
  return (v === '' || v === undefined) ? def : (v as T)
}

export const remove = (key: string) => {
  // 删除指定键
  Taro.removeStorageSync(key)
}
