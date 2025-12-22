import React, { useState } from 'react'
import { View, Text, Input, Button, RadioGroup, Radio } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { registerUser } from '../../services/api'
import { UserRole } from '@/types'

const RegisterPage = () => {
  const [account, setAccount] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState<UserRole>(UserRole.CUSTOMER)

  const handleRegister = async () => {
    if (!account || !password || !name || !phone) {
      Taro.showToast({ title: '请填写完整信息', icon: 'none' })
      return
    }
    if (password.length < 9) {
      Taro.showToast({ title: '密码至少9位', icon: 'none' })
      return
    }
    if (!/^\d{11}$/.test(phone)) {
      Taro.showToast({ title: '请输入有效手机号', icon: 'none' })
      return
    }
    try {
      await registerUser({ account, password, name, phone, role })
      Taro.showToast({ title: '注册成功', icon: 'success' })
      Taro.switchTab({ url: '/pages/home/index' })
    } catch (e) {
      const message = e instanceof Error ? e.message : '注册失败'
      Taro.showToast({ title: message, icon: 'none' })
    }
  }

  return (
    <View style={{ padding: 24 }}>
      <Text style={{ fontSize: 20, fontWeight: 600 }}>注册</Text>
      <View style={{ marginTop: 20 }}>
        <Text>选择身份</Text>
        <RadioGroup
          style={{ display: 'flex', marginTop: 8 }}
          onChange={(e: any) => setRole(e.detail.value as UserRole)}
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
        <Input placeholder='请输入账号' value={account} onInput={(e: any) => setAccount(e.detail.value)} />
      </View>
      <View style={{ marginTop: 16 }}>
        <Text>密码</Text>
        <Input placeholder='请输入密码' password value={password} onInput={(e: any) => setPassword(e.detail.value)} />
      </View>
      <View style={{ marginTop: 16 }}>
        <Text>姓名</Text>
        <Input placeholder='请输入姓名' value={name} onInput={(e: any) => setName(e.detail.value)} />
      </View>
      <View style={{ marginTop: 16 }}>
        <Text>手机号</Text>
        <Input placeholder='请输入手机号' type='number' maxlength={11} value={phone} onInput={(e: any) => setPhone(e.detail.value)} />
      </View>
      <Button style={{ marginTop: 24 }} type='primary' onClick={handleRegister}>
        注册
      </Button>
    </View>
  )
}

export default RegisterPage

