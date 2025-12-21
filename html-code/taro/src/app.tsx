// 应用入口组件：在小程序启动时运行一次
// 说明：可用于版本检查、预加载、全局事件监听等
import React, { useEffect } from 'react'
import Taro from '@tarojs/taro'

// 组件：顶层应用，包裹各页面
const App = (props: React.PropsWithChildren) => {
  useEffect(() => {
    // 示例：获取系统信息（此处仅做占位）
    Taro.getSystemInfo().then(() => {})
  }, [])
  // 渲染：返回路由生成的子页面
  return props.children
}

export default App
