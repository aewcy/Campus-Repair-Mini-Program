import React, { useEffect, useState } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { getCurrentUser, getOrders } from '../../services/api'
import { Order, User, OrderStatus } from '@/types'

const HomePage = () => {
  const [user, setUser] = useState<User | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)

  const load = async () => {
    const u = getCurrentUser()
    setUser(u)
    if (!u) return
    setLoading(true)
    try {
      const list = await getOrders(u)
      const active = list.filter(o => o.status !== OrderStatus.CANCELLED && o.status !== OrderStatus.COMPLETED)
      setOrders(active)
    } catch (e) {
      Taro.showToast({ title: '订单加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])
  useDidShow(() => {
    load()
  })

  return (
    <View style={{ padding: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: 600 }}>
        {user ? `欢迎，${user.name}` : '请先登录'}
      </Text>
      {user && (
        <View style={{ marginTop: 12 }}>
          <Text>我的订单（{orders.length}）</Text>
        </View>
      )}
      {loading && <Text style={{ marginTop: 12 }}>加载中...</Text>}
      {!loading && user && orders.length === 0 && (
        <Text style={{ marginTop: 12 }}>暂无订单</Text>
      )}
      {!loading && user && orders.length > 0 && (
        <ScrollView scrollY style={{ height: '70vh', marginTop: 12 }}>
          {orders.map(o => (
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
                <Text>{new Date(o.createdAt).toLocaleString()}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  )
}

export default HomePage
