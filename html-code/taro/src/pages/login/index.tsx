// 页面：登录（角色选择入口）
// 说明：后续可在此接入微信登录、角色认证等
import React from 'react'
import { View, Text } from '@tarojs/components'

// 组件：页面函数式组件
const LoginPage = () => {
  return (
    // 布局：基础容器，设置内边距
    <View style={{ padding: 24 }}>
      {/* 标题文案占位 */}
      <Text>登录页</Text>
    </View>
  )
}

export default LoginPage
