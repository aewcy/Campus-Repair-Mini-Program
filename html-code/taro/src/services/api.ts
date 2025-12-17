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
const request = async <T>(url: string, options: Taro.request.Option = {}): Promise<T> => {
  const headers = {
    'Content-Type': 'application/json',
    ...(API_TOKEN ? { Authorization: API_TOKEN } : {}),
    ...(getStore<string>(DB_KEYS.AUTH_TOKEN, '') ? { Authorization: `Bearer ${getStore<string>(DB_KEYS.AUTH_TOKEN, '')}` } : {}),
    ...(options.header || {})
  }
  const res = await Taro.request<T>({ url, ...options, header: headers })
  if (res.statusCode < 200 || res.statusCode >= 300) {
    throw new Error(`request failed: ${res.statusCode}`)
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
  // 远程登录
  const res = await request<{ success: boolean; token: string; user: any; message?: string }>(`${BASE}/api/login`, {
    method: 'POST',
    data: { username: account, password } // 后端接收 username
  })
  
  // 转换后端用户格式到前端格式
  const backendUser = res.user
  const user: User = {
    id: backendUser.id,
    name: backendUser.username, // 后端用 username
    avatar: 'https://picsum.photos/100/100', // 后端无头像，暂用占位
    role: backendUser.role === 'staff' ? UserRole.TECHNICIAN : UserRole.CUSTOMER, // 角色映射
    phone: backendUser.phone,
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
    case 'completed': return OrderStatus.COMPLETED
    case 'cancelled': return OrderStatus.CANCELLED
    default: return OrderStatus.PENDING
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
    // 后端 /api/orders 接收: location, phone, description, image_url
    // 对应前端: address, customerPhone, description, images
    const payload = {
      location: orderData.address,
      phone: orderData.customerPhone,
      description: orderData.description,
      image_url: orderData.images && orderData.images.length > 0 ? orderData.images[0] : '' // 后端目前只接收一个 image_url
    }
    const res = await request<{ success: boolean; message: string; order_no: string }>(`${BASE}/api/orders`, { method: 'POST', data: payload })
    
    // 构造一个前端 Order 对象返回 (后端只返回 order_no)
    const now = Date.now()
    const newOrder: Order = {
      id: res.order_no, // 使用 order_no 作为 ID
      customerId: '', // 无法从响应获取，暂时留空或从 currentUser 获取
      customerName: '',
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
    return newOrder
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
    // 后端目前只实现了接单 (/take)，其他状态更新暂无明确接口
    // 如果是接单，调用 takeOrder
    if (status === OrderStatus.ACCEPTED || status === OrderStatus.IN_PROGRESS) {
        await takeOrder(orderId)
        // 重新获取订单信息返回
        // 由于后端没有返回更新后的订单，我们只能构造一个假的或者重新 fetch
        // 这里简单构造返回
        const order = await getOrderById(orderId)
        order.status = status
        return order
    }
    // 其他状态暂不支持或需要后端扩展
    throw new Error('Remote update status not fully implemented')
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
    return await request<Order>(`${BASE}/orders/${encodeURIComponent(orderId)}`, { method: 'GET' })
  }
  const orders: Order[] = getStore<Order[]>(DB_KEYS.ORDERS, []) || []
  const order = orders.find(o => o.id === orderId)
  if (!order) throw new Error('Order not found')
  return order
}

// 修改订单信息：支持更新地址、描述、联系电话
export const updateOrderInfo = async (orderId: string, patch: Partial<Pick<Order, 'address' | 'description' | 'customerPhone'>>): Promise<Order> => {
  if (isRemote) {
    return await request<Order>(`${BASE}/orders/${encodeURIComponent(orderId)}`, { method: 'PATCH', data: patch })
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

// 用户注册
export const registerUser = async (payload: { account: string; password: string; name: string; phone: string }): Promise<User> => {
  if (isRemote) {
    const data = await request<{ user: User; token?: string }>(`${BASE}/auth/register`, { method: 'POST', data: payload })
    if (data.token) setStore(DB_KEYS.AUTH_TOKEN, data.token)
    setStore(DB_KEYS.CURRENT_USER, data.user)
    // 同步到本地列表以便本地模式切换
    const users: User[] = getStore<User[]>(DB_KEYS.USERS, []) || []
    const idx = users.findIndex(u => u.id === data.user.id)
    if (idx === -1) {
      users.push(data.user)
      setStore(DB_KEYS.USERS, users)
    }
    return data.user
  }
  const users: User[] = getStore<User[]>(DB_KEYS.USERS, []) || []
  const newUser: User = {
    id: `user_${Date.now()}`,
    name: payload.name,
    avatar: `https://picsum.photos/seed/${Date.now()}/100/100`,
    role: UserRole.CUSTOMER,
    phone: payload.phone,
    rating: 5.0
  }
  users.push(newUser)
  setStore(DB_KEYS.USERS, users)
  setStore(DB_KEYS.CURRENT_USER, newUser)
  return newUser
}
