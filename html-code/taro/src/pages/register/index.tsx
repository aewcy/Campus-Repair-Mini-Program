import React, { useState } from 'react'
import { View, Text, Input, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { registerUser } from '../../services/api'

const RegisterPage = () => {
  const [account, setAccount] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')

  const handleRegister = async () => {
    if (!account || !password || !name || !phone) {
      Taro.showToast({ title: '请填写完整信息', icon: 'none' })
      return
    }
    if (!/^\d{11}$/.test(phone)) {
      Taro.showToast({ title: '请输入有效手机号', icon: 'none' })
      return
    }
    try {
      await registerUser({ account, password, name, phone })
      Taro.showToast({ title: '注册成功', icon: 'success' })
      Taro.switchTab({ url: '/pages/home/index' })
    } catch (e) {
      Taro.showToast({ title: '注册失败', icon: 'none' })
    }
  }

  return (
    <View style={{ padding: 24 }}>
      <Text style={{ fontSize: 20, fontWeight: 600 }}>注册</Text>
      <View style={{ marginTop: 16 }}>
        <Text>账号</Text>
        <Input placeholder='请输入账号' value={account} onInput={(e) => setAccount(e.detail.value)} />
      </View>
      <View style={{ marginTop: 16 }}>
        <Text>密码</Text>
        <Input placeholder='请输入密码' password value={password} onInput={(e) => setPassword(e.detail.value)} />
      </View>
      <View style={{ marginTop: 16 }}>
        <Text>姓名</Text>
        <Input placeholder='请输入姓名' value={name} onInput={(e) => setName(e.detail.value)} />
      </View>
      <View style={{ marginTop: 16 }}>
        <Text>手机号</Text>
        <Input placeholder='请输入手机号' type='number' maxLength={11} value={phone} onInput={(e) => setPhone(e.detail.value)} />
      </View>
      <Button style={{ marginTop: 24 }} type='primary' onClick={handleRegister}>
        注册
      </Button>
    </View>
  )
}

export default RegisterPage

