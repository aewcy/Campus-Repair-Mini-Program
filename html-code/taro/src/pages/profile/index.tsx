import React, { useEffect, useState } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import { getCurrentUser, getOrders } from '../../services/api'
import { User, Order, OrderStatus } from '@/types'

const ProfilePage = () => {
  const [user, setUser] = useState<User | null>(null)
  const [history, setHistory] = useState<Order[]>([])

  const load = async () => {
    const u = getCurrentUser()
    setUser(u)
    if (!u) return
    const list = await getOrders(u)
    const hist = list.filter(o => o.status === OrderStatus.CANCELLED || o.status === OrderStatus.COMPLETED)
    setHistory(hist)
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <View style={{ padding: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: 600 }}>个人中心</Text>
      <View style={{ marginTop: 12 }}>
        <Text>{user ? `用户：${user.name}` : '未登录'}</Text>
      </View>
      <View style={{ marginTop: 12 }}>
        <Text>历史订单（{history.length}）</Text>
      </View>
      {user && history.length === 0 && (
        <Text style={{ marginTop: 8 }}>暂无历史订单</Text>
      )}
      {user && history.length > 0 && (
        <ScrollView scrollY style={{ height: '70vh', marginTop: 8 }}>
          {history.map(o => (
            <View key={o.id} style={{ padding: 12, borderBottom: '1px solid #eee' }}>
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

export default ProfilePage
