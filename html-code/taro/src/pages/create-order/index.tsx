import React, { useEffect, useState } from 'react'
import { View, Text, Input, Textarea, Picker, Button, RadioGroup, Radio } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { createOrder, getCurrentUser, getOrders } from '../../services/api'
import { Order, OrderStatus, ServiceType, User, UserRole } from '@/types'

const CATEGORIES = ['手机维修', '电脑维修', '家电维修', '其他']

const CreateOrderPage = () => {
  const [user, setUser] = useState<User | null>(null)
  const [techOrders, setTechOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [categoryIdx, setCategoryIdx] = useState(0)
  const [serviceType, setServiceType] = useState<ServiceType>(ServiceType.HOME)
  const [address, setAddress] = useState('')
  const [description, setDescription] = useState('')
  const [primaryPhone, setPrimaryPhone] = useState('')

  const loadTechOrders = async (u: User) => {
    setLoading(true)
    try {
      const list = await getOrders(u)
      const mine = list
        .filter(o => o.status !== OrderStatus.CANCELLED && o.status !== OrderStatus.COMPLETED)
        .filter(o => o.techId === u.id)
      setTechOrders(mine)
    } catch {
      Taro.showToast({ title: '订单加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const u = getCurrentUser()
    setUser(u)
    if (u?.phone) setPrimaryPhone(u.phone)
    if (u?.role === UserRole.TECHNICIAN) loadTechOrders(u)
  }, [])

  useDidShow(() => {
    const u = getCurrentUser()
    setUser(u)
    if (u?.role === UserRole.TECHNICIAN) loadTechOrders(u)
  })

  const handleSubmit = async () => {
    const user = getCurrentUser()
    if (!user) {
      Taro.showToast({ title: '请先登录', icon: 'none' })
      return
    }
    if (user.role === UserRole.TECHNICIAN) {
      Taro.showToast({ title: '维修师傅无需下单', icon: 'none' })
      return
    }
    if (!address || !description) {
      Taro.showToast({ title: '请填写地址与问题描述', icon: 'none' })
      return
    }
    const finalPhone = (primaryPhone).trim()
    if (!/^\d{11}$/.test(finalPhone)) {
      Taro.showToast({ title: '请输入有效手机号', icon: 'none' })
      return
    }
    try {
      await createOrder({
        customerId: user.id,
        customerName: user.name,
        customerPhone: finalPhone,
        category: CATEGORIES[categoryIdx],
        address,
        description,
        serviceType
      })
      Taro.showToast({ title: '下单成功', icon: 'success' })
      Taro.switchTab({ url: '/pages/home/index' })
    } catch (e) {
      Taro.showToast({ title: '下单失败', icon: 'none' })
    }
  }

  return (
    <View style={{ padding: 16 }}>
      {!user && (
        <Text style={{ fontSize: 18, fontWeight: 600 }}>请先登录</Text>
      )}
      {user?.role === UserRole.CUSTOMER && (
        <View>
          <Text style={{ fontSize: 18, fontWeight: 600 }}>发布需求</Text>
          <View style={{ marginTop: 12 }}>
            <Text>维修类别</Text>
            <Picker mode='selector' range={CATEGORIES} value={categoryIdx} onChange={(e: any) => setCategoryIdx(Number(e.detail.value))}>
              <View style={{ padding: 12, border: '1px solid #eee', marginTop: 6 }}>{CATEGORIES[categoryIdx]}</View>
            </Picker>
          </View>
          <View style={{ marginTop: 12 }}>
            <Text>服务类型</Text>
            <RadioGroup onChange={(e: any) => setServiceType(e.detail.value as ServiceType)}>
              <Radio value={ServiceType.HOME} checked={serviceType === ServiceType.HOME}>上门服务</Radio>
              <Radio value={ServiceType.SHOP} checked={serviceType === ServiceType.SHOP} style={{ marginLeft: 12 }}>到店维修</Radio>
            </RadioGroup>
          </View>
          <View style={{ marginTop: 12 }}>
            <Text>手机号</Text>
            <Input placeholder='请输入联系手机号' type='number' maxlength={11} value={primaryPhone} onInput={(e: any) => setPrimaryPhone(e.detail.value)} />
          </View>
          <View style={{ marginTop: 12 }}>
            <Text>地址</Text>
            <Input placeholder='请输入详细地址' value={address} onInput={(e: any) => setAddress(e.detail.value)} />
          </View>
          <View style={{ marginTop: 12 }}>
            <Text>问题描述</Text>
            <Textarea placeholder='请描述故障情况' value={description} onInput={(e: any) => setDescription(e.detail.value)} />
          </View>
          <Button style={{ marginTop: 20 }} type='primary' onClick={handleSubmit}>提交</Button>
        </View>
      )}
      {user?.role === UserRole.TECHNICIAN && (
        <View>
          <Text style={{ fontSize: 18, fontWeight: 600 }}>我的订单</Text>
          {loading && <Text style={{ marginTop: 12 }}>加载中...</Text>}
          {!loading && techOrders.length === 0 && <Text style={{ marginTop: 12 }}>暂无已接订单</Text>}
          {!loading && techOrders.length > 0 && (
            <View style={{ marginTop: 12 }}>
              {techOrders.map(o => (
                <View
                  key={o.id}
                  style={{ padding: 12, borderBottom: '1px solid #eee' }}
                  onClick={() => Taro.navigateTo({ url: `/pages/order-detail/index?id=${o.id}` })}
                >
                  <Text>{o.category} | {o.status}</Text>
                  <View style={{ marginTop: 4 }}>
                    <Text>{o.description}</Text>
                  </View>
                  <View style={{ marginTop: 4 }}>
                    <Text>{o.address}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  )
}

export default CreateOrderPage
