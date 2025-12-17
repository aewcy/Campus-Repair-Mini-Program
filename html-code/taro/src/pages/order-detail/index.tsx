import React, { useEffect, useState } from 'react'
import { View, Text, Input, Textarea, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { getOrderById, updateOrderStatus, updateOrderInfo, rateOrder, getCurrentUser } from '../../services/api'
import { Order, OrderStatus, UserRole } from '@/types'

const OrderDetailPage = () => {
  const [order, setOrder] = useState<Order | null>(null)
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')

  const load = async () => {
    const params = Taro.getCurrentInstance().router?.params || {}
    const id = params.id as string
    if (!id) {
      Taro.showToast({ title: '无订单ID', icon: 'none' })
      return
    }
    try {
      const o = await getOrderById(id)
      setOrder(o)
      setPhone(o.customerPhone)
      setAddress(o.address)
      setDescription(o.description)
    } catch (e) {
      Taro.showToast({ title: '加载失败', icon: 'none' })
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleCancel = async () => {
    if (!order) return
    try {
      const o = await updateOrderStatus(order.id, OrderStatus.CANCELLED)
      setOrder(o)
      Taro.showToast({ title: '已取消', icon: 'success' })
      Taro.switchTab({ url: '/pages/home/index' })
    } catch {
      Taro.showToast({ title: '取消失败', icon: 'none' })
    }
  }

  const handleSave = async () => {
    if (!order) return
    const finalPhone = phone.trim()
    if (!/^\d{11}$/.test(finalPhone)) {
      Taro.showToast({ title: '请输入有效手机号', icon: 'none' })
      return
    }
    setSaving(true)
    try {
      const o = await updateOrderInfo(order.id, { customerPhone: finalPhone, address, description })
      setOrder(o)
      Taro.showToast({ title: '已保存', icon: 'success' })
    } catch {
      Taro.showToast({ title: '保存失败', icon: 'none' })
    } finally {
      setSaving(false)
    }
  }

  if (!order) {
    return <View style={{ padding: 16 }}><Text>加载中...</Text></View>
  }

  return (
    <View style={{ padding: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: 600 }}>订单详情</Text>
      <View style={{ marginTop: 8 }}>
        <Text>状态：{order.status}</Text>
      </View>
      <View style={{ marginTop: 8 }}>
        <Text>类别：{order.category}</Text>
      </View>
      <View style={{ marginTop: 12 }}>
        <Text>联系电话</Text>
        <Input placeholder='请输入联系手机号' value={phone} onInput={(e) => setPhone(e.detail.value)} />
      </View>
      <View style={{ marginTop: 12 }}>
        <Text>地址</Text>
        <Input placeholder='请输入详细地址' value={address} onInput={(e) => setAddress(e.detail.value)} />
      </View>
      <View style={{ marginTop: 12 }}>
        <Text>问题描述</Text>
        <Textarea placeholder='请描述故障情况' value={description} onInput={(e) => setDescription(e.detail.value)} />
      </View>
      <Button style={{ marginTop: 16 }} type='primary' onClick={handleSave} disabled={saving}>保存修改</Button>
      <Button style={{ marginTop: 12 }} type='warn' onClick={handleCancel}>取消订单</Button>
    </View>
  )
}

export default OrderDetailPage
