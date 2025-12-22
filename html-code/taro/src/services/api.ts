// 模块：业务服务层（小程序端）
// 作用：统一封装网络请求与本地数据读写，页面只需调用函数
import Taro from '@tarojs/taro'
import { Order, OrderStatus, User, UserRole, ServiceType } from '@/types'
import { set as setStore, get as getStore, remove as removeStore } from './storage'

// 环境变量：通过编译期/运行时注入后端地址与令牌
const BASE = process.env.VITE_API_BASE_URL || ''
const API_TOKEN = process.env.VITE_API_TOKEN || ''
const isRemote = !!BASE

// 本地存储键名约定
const DB_KEYS = {
  ORDERS: 'wefix_orders',
  USERS: 'wefix_users',
  CURRENT_USER: 'wefix_current_user',
  AUTH_TOKEN: 'wefix_auth_token'
}

// 请求封装：统一设置头信息与错误处理
const request = async <T,>(url: string, options: Omit<Taro.request.Option<any, any>, 'url'> = {}): Promise<T> => {
  const storedToken = (getStore<string>(DB_KEYS.AUTH_TOKEN, '') || '').trim()
  const rawToken = storedToken || (API_TOKEN || '').trim()
  const authHeader = rawToken
    ? { Authorization: rawToken.startsWith('Bearer ') ? rawToken : `Bearer ${rawToken}` }
    : {}

  const headers = {
    'Content-Type': 'application/json',
    ...(options.header || {}),
    ...authHeader
  }
  const res = await Taro.request<T>({ url, ...options, header: headers })
  if (res.statusCode < 200 || res.statusCode >= 300) {
    const data: any = res.data as any
    const message = data?.message || data?.error || data?.errors?.[0]?.msg || `request failed: ${res.statusCode}`
    throw new Error(message)
  }
  return res.data as T
}

// 账号密码登录：后端校验并返回用户与令牌
export const loginWithPassword = async (account: string, password: string, role?: UserRole): Promise<User> => {
  if (!BASE) {
    // ... local mock implementation ...
    const users = getStore<User[]>(DB_KEYS.USERS, []) || []
    const targetRole = role || UserRole.CUSTOMER
    let user = users.find(u => u.role === targetRole)
    if (!user) {
      user = {
        id: `user_${Date.now()}`,
        name: targetRole === UserRole.CUSTOMER ? '本地客户' : '本地师傅',
        avatar: `https://picsum.photos/seed/${Date.now()}/100/100`,
        role: targetRole,
        phone: '13000000000',
        rating: 5.0,
        isVerified: targetRole === UserRole.TECHNICIAN ? true : undefined
      }
      users.push(user)
      setStore(DB_KEYS.USERS, users)
    }
    setStore(DB_KEYS.CURRENT_USER, user)
    return user
  }
  const res = await request<{ success: boolean; token: string; user: any; message?: string }>(`${BASE}/api/login`, {
    method: 'POST',
    data: { username: account, password }
  })
  const backendUser = res.user
  const backendRole: UserRole = backendUser?.role === 'staff' ? UserRole.TECHNICIAN : UserRole.CUSTOMER
  if (role && role !== backendRole) {
    throw new Error('所选身份与账号角色不匹配')
  }
  const user: User = {
    id: String(backendUser?.id ?? ''),
    name: String(backendUser?.username ?? ''),
    avatar: 'https://picsum.photos/100/100',
    role: backendRole,
    phone: String(backendUser?.phone ?? ''),
    rating: 5.0
  }
  setStore(DB_KEYS.AUTH_TOKEN, res.token)
  setStore(DB_KEYS.CURRENT_USER, user)
  return user
}

// 员工接单
export const takeOrder = async (orderId: string): Promise<void> => {
    if (isRemote) {
        await request(`${BASE}/api/orders/${orderId}/take`, { method: 'POST' })
        return
    }
    // local implementation...
}

// 辅助函数：状态映射
const mapBackendStatusToFrontend = (status: string): OrderStatus => {
  switch (status) {
    case 'pending': return OrderStatus.PENDING
    case 'doing': return OrderStatus.IN_PROGRESS
    case 'done': return OrderStatus.COMPLETED
    case 'completed': return OrderStatus.COMPLETED
    case 'cancelled': return OrderStatus.CANCELLED
    default: return OrderStatus.PENDING
  }
}

const mapBackendOrderToFrontend = (o: any): Order => {
  const now = Date.now()
  return {
    id: String(o?.id ?? o?.order_no ?? `ord_${now}`),
    customerId: String(o?.user_id ?? o?.customer_id ?? ''),
    customerName: o?.customer_name ?? '',
    customerPhone: o?.phone ?? o?.customer_phone ?? '',
    category: o?.category ?? '其他',
    address: o?.location ?? o?.address ?? '',
    description: o?.description ?? '',
    serviceType: o?.service_type ?? ServiceType.HOME,
    status: mapBackendStatusToFrontend(o?.status ?? 'pending'),
    createdAt: typeof o?.created_at === 'number' ? o.created_at : (o?.created_at ? Date.parse(o.created_at) : now),
    updatedAt: typeof o?.updated_at === 'number' ? o.updated_at : (o?.updated_at ? Date.parse(o.updated_at) : now),
    images: Array.isArray(o?.images) ? o.images : (o?.image_url ? [o.image_url] : [])
  }
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

// 登出：清空当前用户
export const logoutUser = async () => {
  removeStore(DB_KEYS.CURRENT_USER)
  removeStore(DB_KEYS.AUTH_TOKEN)
}

// 获取当前用户：若未登录返回 null
export const getCurrentUser = (): User | null => {
  return getStore<User>(DB_KEYS.CURRENT_USER, null)
}

// 获取订单列表：按角色返回不同视图
export const getOrders = async (user: User): Promise<Order[]> => {
  if (isRemote) {
    if (user.role === UserRole.TECHNICIAN) {
      const res = await request<{ success: boolean; data: any[] }>(`${BASE}/api/orders`, { method: 'GET' })
      return (res?.data || []).map(mapBackendOrderToFrontend)
    } else {
      const res = await request<{ success: boolean; data: any[] }>(`${BASE}/api/orders/my`, { method: 'GET' })
      return (res?.data || []).map(mapBackendOrderToFrontend)
    }
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
      location: orderData.address,
      phone: orderData.customerPhone,
      description: orderData.description,
      image_url: orderData.images && orderData.images.length > 0 ? orderData.images[0] : '' // 后端目前只接收一个 image_url
    }
    const res = await request<{ success: boolean; message: string; order_no: string }>(`${BASE}/api/orders`, { method: 'POST', data: payload })
    const list = await request<{ success: boolean; data: any[] }>(`${BASE}/api/orders/my?page=1&pageSize=20`, { method: 'GET' })
    const hit = (list?.data || []).find((o: any) => o?.order_no === res.order_no) || (list?.data || [])[0]
    if (hit) return mapBackendOrderToFrontend(hit)
    const now = Date.now()
    return {
      id: res.order_no,
      customerId: orderData.customerId || '',
      customerName: orderData.customerName || '',
      customerPhone: orderData.customerPhone || '',
      category: orderData.category || '其他',
      address: orderData.address || '',
      description: orderData.description || '',
      serviceType: orderData.serviceType || ServiceType.HOME,
      status: OrderStatus.PENDING,
      createdAt: now,
      updatedAt: now,
      images: orderData.images || []
    }
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
    if (status === OrderStatus.ACCEPTED || status === OrderStatus.IN_PROGRESS) {
      await takeOrder(orderId)
      return await getOrderById(orderId)
    }
    if (status === OrderStatus.COMPLETED) {
      await request(`${BASE}/api/orders/${encodeURIComponent(orderId)}/finish`, { method: 'POST', data: {} })
      return await getOrderById(orderId)
    }
    if (status === OrderStatus.CANCELLED) {
      await request(`${BASE}/api/orders/${encodeURIComponent(orderId)}/cancel`, { method: 'POST', data: {} })
      return await getOrderById(orderId)
    }
    return await getOrderById(orderId)
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

// 获取订单详情
export const getOrderById = async (orderId: string): Promise<Order> => {
  if (isRemote) {
    const res = await request<{ success: boolean; data: any }>(`${BASE}/api/orders/${encodeURIComponent(orderId)}`, { method: 'GET' })
    return mapBackendOrderToFrontend(res?.data)
  }
  const orders: Order[] = getStore<Order[]>(DB_KEYS.ORDERS, []) || []
  const order = orders.find(o => o.id === orderId)
  if (!order) throw new Error('Order not found')
  return order
}

// 修改订单信息：支持更新地址、描述、联系电话
export const updateOrderInfo = async (orderId: string, patch: Partial<Pick<Order, 'address' | 'description' | 'customerPhone'>>): Promise<Order> => {
  if (isRemote) {
    const payload: any = {}
    if (patch.address !== undefined) payload.location = patch.address
    if (patch.customerPhone !== undefined) payload.phone = patch.customerPhone
    if (patch.description !== undefined) payload.description = patch.description
    await request(`${BASE}/api/orders/${encodeURIComponent(orderId)}`, { method: 'PATCH', data: payload })
    return await getOrderById(orderId)
  }
  const orders: Order[] = getStore<Order[]>(DB_KEYS.ORDERS, []) || []
  const index = orders.findIndex(o => o.id === orderId)
  if (index === -1) throw new Error('Order not found')
  const order = orders[index]
  if (patch.address !== undefined) order.address = patch.address
  if (patch.description !== undefined) order.description = patch.description
  if (patch.customerPhone !== undefined) order.customerPhone = patch.customerPhone
  order.updatedAt = Date.now()
  orders[index] = order
  setStore(DB_KEYS.ORDERS, orders)
  return order
}

// 评价订单：支持双方互评
export const rateOrder = async (orderId: string, rating: number, comment: string, type: 'CUSTOMER_TO_TECH' | 'TECH_TO_CUSTOMER'): Promise<Order> => {
  if (isRemote) {
    if (type !== 'CUSTOMER_TO_TECH') {
      throw new Error('后端暂不支持师傅评价用户')
    }
    await request(`${BASE}/api/orders/${encodeURIComponent(orderId)}/rate`, {
      method: 'POST',
      data: { rating, rating_comment: comment }
    })
    return await getOrderById(orderId)
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

// 用户注册
export const registerUser = async (payload: { account: string; password: string; name: string; phone: string; role?: UserRole }): Promise<User> => {
  if (isRemote) {
    const backendRole = payload.role === UserRole.TECHNICIAN ? 'staff' : 'user'
    const data = await request<{ success: boolean; message?: string; user: any; token: string }>(`${BASE}/api/register`, { 
      method: 'POST', 
      data: { 
        username: payload.account, 
        password: payload.password, 
        phone: payload.phone,
        role: backendRole
      } 
    })
    if (!data?.success) throw new Error(data?.message || '注册失败')
    const backendUser = data.user
    setStore(DB_KEYS.AUTH_TOKEN, data.token)
    const user: User = {
      id: String(backendUser?.id ?? ''),
      name: String(backendUser?.username ?? payload.name),
      avatar: 'https://picsum.photos/100/100',
      role: backendUser?.role === 'staff' ? UserRole.TECHNICIAN : UserRole.CUSTOMER,
      phone: String(backendUser?.phone ?? payload.phone),
      rating: 5.0
    }
    setStore(DB_KEYS.CURRENT_USER, user)
    const users: User[] = getStore<User[]>(DB_KEYS.USERS, []) || []
    if (!users.find(u => u.id === user.id)) {
      users.push(user)
      setStore(DB_KEYS.USERS, users)
    }
    return user
  }
  const users: User[] = getStore<User[]>(DB_KEYS.USERS, []) || []
  const newUser: User = {
    id: `user_${Date.now()}`,
    name: payload.name,
    avatar: `https://picsum.photos/seed/${Date.now()}/100/100`,
    role: payload.role || UserRole.CUSTOMER,
    phone: payload.phone,
    rating: 5.0
  }
  users.push(newUser)
  setStore(DB_KEYS.USERS, users)
  setStore(DB_KEYS.CURRENT_USER, newUser)
  return newUser
}
