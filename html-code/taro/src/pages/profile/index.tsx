// 页面：个人中心（账号信息、设置）
// 说明：后续可在此展示用户资料、认证状态等
import React from 'react'
import { View, Text } from '@tarojs/components'

// 组件：页面函数式组件
const ProfilePage = () => {
  return (
    // 布局：基础容器，设置内边距
    <View style={{ padding: 24 }}>
      {/* 标题文案占位 */}
      <Text>个人中心</Text>
    </View>
  )
}

export default ProfilePage
