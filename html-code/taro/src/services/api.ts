import Taro from '@tarojs/taro'
import { Order, OrderStatus, User, UserRole, ServiceType } from '../../../types'
import { set as setStore, get as getStore, remove as removeStore } from './storage'

// 读取环境变量（按需注入或替换为常量）
const BASE = process.env.VITE_API_BASE_URL || ''
const API_TOKEN = process.env.VITE_API_TOKEN || ''
const isRemote = !!BASE

const DB_KEYS = {
  ORDERS: 'wefix_orders',
  USERS: 'wefix_users',
  CURRENT_USER: 'wefix_current_user'
}

// 统一请求封装
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

export const logoutUser = async () => {
  removeStore(DB_KEYS.CURRENT_USER)
}

export const getCurrentUser = (): User | null => {
  return getStore<User>(DB_KEYS.CURRENT_USER, null)
}

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

