// 应用入口组件：在小程序启动时运行一次
// 说明：可用于版本检查、预加载、全局事件监听等
import React, { useEffect } from 'react'
import Taro from '@tarojs/taro'

// 组件：顶层应用，包裹各页面
const App = (props: React.PropsWithChildren) => {
  useEffect(() => {
    Taro.getSystemInfo().then(() => {})

    const taroAny = Taro as any
    const show = (msg: unknown) => {
      const text = typeof msg === 'string' ? msg : (msg ? JSON.stringify(msg) : 'unknown error')
      console.error('[app error]', text)
      Taro.showToast({ title: `页面错误：${text}`.slice(0, 30), icon: 'none' })
    }

    if (typeof taroAny.onError === 'function') {
      taroAny.onError((err: any) => show(err?.message || err))
    }
    if (typeof taroAny.onUnhandledRejection === 'function') {
      taroAny.onUnhandledRejection((e: any) => show(e?.reason?.message || e?.reason || e))
    }
  }, [])
  // 渲染：返回路由生成的子页面
  return props.children
}

export default App
