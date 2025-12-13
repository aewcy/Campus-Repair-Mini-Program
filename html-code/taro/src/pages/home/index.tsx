// 页面：首页（订单列表、公告等入口）
// 说明：后续可从服务层拉取订单并在此展示
import React from 'react'
import { View, Text } from '@tarojs/components'

// 组件：页面函数式组件
const HomePage = () => {
  return (
    // 布局：基础容器，设置内边距
    <View style={{ padding: 24 }}>
      {/* 标题文案占位 */}
      <Text>首页</Text>
    </View>
  )
}

export default HomePage
