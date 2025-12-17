import React, { useEffect, useState } from 'react'
import { View, Text, ScrollView, Button } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { getCurrentUser, getOrders, logoutUser } from '../../services/api'
import { User, Order, OrderStatus } from '@/types'

const ProfilePage = () => {
  const [user, setUser] = useState<User | null>(null)
  const [history, setHistory] = useState<Order[]>([])

  const load = async () => {
    const u = getCurrentUser()
    setUser(u)
    if (!u) {
      setHistory([])
      return
    }
    const list = await getOrders(u)
    const hist = list.filter(o => o.status === OrderStatus.CANCELLED || o.status === OrderStatus.COMPLETED)
    setHistory(hist)
  }

  useEffect(() => {
    load()
  }, [])

  useDidShow(() => {
    load()
  })

  const handleLogout = async () => {
    await logoutUser()
    setUser(null)
    setHistory([])
    Taro.showToast({ title: '已退出登录', icon: 'none' })
    // 跳转到登录页，并关闭所有页面（防止返回）
    Taro.reLaunch({ url: '/pages/login/index' })
  }

  const handleLogin = () => {
    Taro.navigateTo({ url: '/pages/login/index' })
  }

  return (
    <View style={{ padding: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: 600 }}>个人中心</Text>
      <View style={{ marginTop: 12, padding: 16, backgroundColor: '#f5f5f5', borderRadius: 8 }}>
        <Text style={{ fontSize: 16, fontWeight: 'bold' }}>{user ? `用户：${user.name}` : '未登录'}</Text>
        {user && <Text style={{ display: 'block', color: '#666', marginTop: 4 }}>角色：{user.role === 'CUSTOMER' ? '客户' : '维修师傅'}</Text>}
      </View>

      {!user ? (
        <Button style={{ marginTop: 20 }} type='primary' onClick={handleLogin}>去登录</Button>
      ) : (
        <Button style={{ marginTop: 20 }} type='warn' onClick={handleLogout}>退出登录</Button>
      )}

      <View style={{ marginTop: 24 }}>
        <Text style={{ fontSize: 16, fontWeight: 'bold' }}>历史订单（{history.length}）</Text>
      </View>
      {user && history.length === 0 && (
        <Text style={{ marginTop: 8, color: '#999' }}>暂无历史订单</Text>
      )}
      {user && history.length > 0 && (
        <ScrollView scrollY style={{ height: '50vh', marginTop: 8 }}>
          {history.map(o => (
            <View 
              key={o.id} 
              style={{ padding: 12, borderBottom: '1px solid #eee', backgroundColor: '#fff' }}
              onClick={() => Taro.navigateTo({ url: `/pages/order-detail/index?id=${o.id}` })}
            >
              <Text style={{ fontWeight: 'bold' }}>{o.category} | {o.status}</Text>
              <View style={{ marginTop: 4 }}>
                <Text style={{ color: '#666' }}>{o.description}</Text>
              </View>
              <View style={{ marginTop: 4 }}>
                <Text style={{ fontSize: 12, color: '#999' }}>{new Date(o.createdAt).toLocaleString()}</Text>
              </View>
              <Text style={{ fontSize: 12, color: '#3b82f6', marginTop: 4 }}>点击查看详情 &gt;</Text>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  )
}

export default ProfilePage
