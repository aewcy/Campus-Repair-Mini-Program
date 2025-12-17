// 页面：账号密码登录
// 说明：调用后端接口校验账号与密码，成功后进入首页
import React, { useState } from 'react'
import { View, Text, Input, Button, RadioGroup, Radio } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { loginWithPassword } from '../../services/api'
import { UserRole } from '@/types'

// 组件：页面函数式组件
const LoginPage = () => {
  const [account, setAccount] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole>(UserRole.CUSTOMER)

  const handleLogin = async () => {
    if (!account || !password) {
      Taro.showToast({ title: '请输入账号与密码', icon: 'none' })
      return
    }
    try {
      await loginWithPassword(account, password, role)
      Taro.showToast({ title: '登录成功', icon: 'success' })
      Taro.switchTab({ url: '/pages/home/index' })
    } catch (e) {
      Taro.showToast({ title: '登录失败，请检查账号密码', icon: 'none' })
    }
  }

  return (
    // 布局：基础容器，设置内边距
    <View style={{ padding: 24 }}>
      <Text style={{ fontSize: 20, fontWeight: 600 }}>账号密码登录</Text>
      
      <View style={{ marginTop: 20 }}>
        <Text>选择身份</Text>
        <RadioGroup 
          style={{ display: 'flex', marginTop: 8 }} 
          onChange={(e) => setRole(e.detail.value as UserRole)}
        >
          <View style={{ marginRight: 20 }}>
            <Radio value={UserRole.CUSTOMER} checked={role === UserRole.CUSTOMER}>我是客户</Radio>
          </View>
          <View>
            <Radio value={UserRole.TECHNICIAN} checked={role === UserRole.TECHNICIAN}>我是维修师傅</Radio>
          </View>
        </RadioGroup>
      </View>

      <View style={{ marginTop: 16 }}>
        <Text>账号</Text>
        <Input
          placeholder='请输入账号'
          value={account}
          onInput={(e) => setAccount(e.detail.value)}
        />
      </View>
      <View style={{ marginTop: 16 }}>
        <Text>密码</Text>
        <Input
          placeholder='请输入密码'
          password
          value={password}
          onInput={(e) => setPassword(e.detail.value)}
        />
      </View>
      <Button style={{ marginTop: 24 }} type='primary' onClick={handleLogin}>
        登录
      </Button>
      <View style={{ marginTop: 12 }}>
        <Text style={{ color: '#3b82f6' }} onClick={() => Taro.navigateTo({ url: '/pages/register/index' })}>
          注册
        </Text>
      </View>
    </View>
  )
}

export default LoginPage
