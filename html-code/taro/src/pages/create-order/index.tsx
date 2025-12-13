// 页面：发布需求（下单入口的占位页面）
// 说明：后续可在此页面接入表单、图片上传、地址选择等能力
import React from 'react'
import { View, Text } from '@tarojs/components'

// 组件：页面函数式组件
const CreateOrderPage = () => {
  return (
    // 布局：基础容器，设置内边距
    <View style={{ padding: 24 }}>
      {/* 标题文案占位 */}
      <Text>发布需求</Text>
    </View>
  )
}

export default CreateOrderPage
