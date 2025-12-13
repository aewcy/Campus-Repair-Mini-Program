import Taro from '@tarojs/taro'

// 小程序本地存储封装
export const set = (key: string, value: unknown) => {
  Taro.setStorageSync(key, value)
}

export const get = <T = unknown>(key: string, def: T | null = null): T | null => {
  const v = Taro.getStorageSync(key)
  return (v === '' || v === undefined) ? def : (v as T)
}

export const remove = (key: string) => {
  Taro.removeStorageSync(key)
}

