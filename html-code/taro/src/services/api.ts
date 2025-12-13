// 模块：业务服务层（小程序端）
// 作用：统一封装网络请求与本地数据读写，页面只需调用函数
import Taro from '@tarojs/taro'
import { Order, OrderStatus, User, UserRole, ServiceType } from '../../../types'
import { set as setStore, get as getStore, remove as removeStore } from './storage'

// 环境变量：通过编译期/运行时注入后端地址与令牌
const BASE = process.env.VITE_API_BASE_URL || ''
const API_TOKEN = process.env.VITE_API_TOKEN || ''
const isRemote = !!BASE

// 本地存储键名约定
const DB_KEYS = {
  ORDERS: 'wefix_orders',
  USERS: 'wefix_users',
  CURRENT_USER: 'wefix_current_user'
}

// 请求封装：统一设置头信息与错误处理
const request = async <T>(url: string, options: Taro.request.Option = {}): Promise<T> => {
  const headers = {
    'Content-Type': 'application/json',
    ...(API_TOKEN ? { Authorization: API_TOKEN } : {}),
    ...(options.header || {})
  }
  const res = await Taro.request<T>({ url, ...options, header: headers })
  if (res.statusCode < 200 || res.statusCode >= 300) {
    throw new Error(`request failed: ${res.statusCode}`)
  }
  return res.data as T
}

// 登录：按角色返回用户信息（远程走后端，本地走模拟）
export const loginUser = async (role: UserRole): Promise<User> => {
  if (isRemote) {
    const user = await request<User>(`${BASE}/auth/login-mock?role=${encodeURIComponent(role)}`, { method: 'GET' })
    setStore(DB_KEYS.CURRENT_USER, user)
    return user
  }
  const users = getStore<User[]>(DB_KEYS.USERS, []) || []
  let user = users.find(u => u.role === role)
  if (!user) {
    user = {
      id: `user_${Date.now()}`,
      name: role === UserRole.CUSTOMER ? '新用户' : '新师傅',
      avatar: `https://picsum.photos/seed/${Date.now()}/100/100`,
      role,
      phone: '13000000000',
      isVerified: role === UserRole.TECHNICIAN ? false : undefined,
      rating: 5.0
    }
    users.push(user)
    setStore(DB_KEYS.USERS, users)
  }
  setStore(DB_KEYS.CURRENT_USER, user)
  return user
}

// 登出：清空当前用户
export const logoutUser = async () => {
  removeStore(DB_KEYS.CURRENT_USER)
}

// 获取当前用户：若未登录返回 null
export const getCurrentUser = (): User | null => {
  return getStore<User>(DB_KEYS.CURRENT_USER, null)
}

// 获取订单列表：按角色返回不同视图
export const getOrders = async (user: User): Promise<Order[]> => {
  if (isRemote) {
    return await request<Order[]>(`${BASE}/orders?userId=${encodeURIComponent(user.id)}&role=${encodeURIComponent(user.role)}`, { method: 'GET' })
  }
  const orders: Order[] = getStore<Order[]>(DB_KEYS.ORDERS, []) || []
  if (user.role === UserRole.CUSTOMER) {
    return orders.filter(o => o.customerId === user.id).sort((a, b) => b.createdAt - a.createdAt)
  } else if (user.role === UserRole.TECHNICIAN) {
    return orders.filter(o => o.status === OrderStatus.PENDING || o.techId === user.id).sort((a, b) => b.createdAt - a.createdAt)
  }
  return []
}

// 创建订单：提交表单生成订单
export const createOrder = async (orderData: Partial<Order>): Promise<Order> => {
  if (isRemote) {
    const payload = {
      customerId: orderData.customerId,
      customerName: orderData.customerName,
      customerPhone: orderData.customerPhone,
      category: orderData.category || '其他',
      address: orderData.address,
      description: orderData.description,
      serviceType: orderData.serviceType
    }
    return await request<Order>(`${BASE}/orders`, { method: 'POST', data: payload })
  }
  const orders: Order[] = getStore<Order[]>(DB_KEYS.ORDERS, []) || []
  const now = Date.now()
  const newOrder: Order = {
    id: `ord_${now}`,
    customerId: orderData.customerId!,
    customerName: orderData.customerName!,
    customerPhone: orderData.customerPhone!,
    category: orderData.category || '其他',
    address: orderData.address!,
    description: orderData.description!,
    serviceType: orderData.serviceType || ServiceType.HOME,
    status: OrderStatus.PENDING,
    createdAt: now,
    updatedAt: now,
    images: orderData.images || []
  }
  orders.unshift(newOrder)
  setStore(DB_KEYS.ORDERS, orders)
  return newOrder
}

// 更新订单状态：接单/开始维修/完成/取消
export const updateOrderStatus = async (orderId: string, status: OrderStatus, techId?: string, techName?: string): Promise<Order> => {
  if (isRemote) {
    const payload = { status, techId, techName }
    return await request<Order>(`${BASE}/orders/${encodeURIComponent(orderId)}/status`, { method: 'PATCH', data: payload })
  }
  const orders: Order[] = getStore<Order[]>(DB_KEYS.ORDERS, []) || []
  const index = orders.findIndex(o => o.id === orderId)
  if (index === -1) throw new Error('Order not found')
  const order = orders[index]
  order.status = status
  order.updatedAt = Date.now()
  if (techId && status === OrderStatus.ACCEPTED) {
    order.techId = techId
    order.techName = techName
  }
  orders[index] = order
  setStore(DB_KEYS.ORDERS, orders)
  return order
}

// 评价订单：支持双方互评
export const rateOrder = async (orderId: string, rating: number, comment: string, type: 'CUSTOMER_TO_TECH' | 'TECH_TO_CUSTOMER'): Promise<Order> => {
  if (isRemote) {
    const payload = { rating, comment, type }
    return await request<Order>(`${BASE}/orders/${encodeURIComponent(orderId)}/rate`, { method: 'POST', data: payload })
  }
  const orders: Order[] = getStore<Order[]>(DB_KEYS.ORDERS, []) || []
  const index = orders.findIndex(o => o.id === orderId)
  if (index === -1) throw new Error('Order not found')
  const order = orders[index]
  if (type === 'CUSTOMER_TO_TECH') {
    order.techRating = rating
    order.customerComment = comment
  } else {
    order.customerRating = rating
    order.techComment = comment
  }
  orders[index] = order
  setStore(DB_KEYS.ORDERS, orders)
  return order
}

// 更新用户手机号：同步到当前用户和用户列表
export const updateUserPhone = async (userId: string, phone: string): Promise<User> => {
  if (isRemote) {
    const user = await request<User>(`${BASE}/users/${encodeURIComponent(userId)}/phone`, { method: 'PATCH', data: { phone } })
    setStore(DB_KEYS.CURRENT_USER, user)
    return user
  }
  const users: User[] = getStore<User[]>(DB_KEYS.USERS, []) || []
  const idx = users.findIndex(u => u.id === userId)
  if (idx !== -1) {
    users[idx].phone = phone
    setStore(DB_KEYS.USERS, users)
  }
  const current = getStore<User>(DB_KEYS.CURRENT_USER, null)
  if (current && current.id === userId) {
    current.phone = phone
    setStore(DB_KEYS.CURRENT_USER, current)
    return current
  }
  return idx !== -1 ? users[idx] : (current as User)
}
