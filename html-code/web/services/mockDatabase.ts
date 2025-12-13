// 模块：Web 端服务层（本地存储 + 可选远程请求）
// 作用：封装登录、订单管理、评价逻辑，页面通过函数调用
import { Order, OrderStatus, User, UserRole, ServiceType } from '../../types';
import { MOCK_USERS } from '../constants';
const BASE: string = import.meta.env?.VITE_API_BASE_URL || '';
const API_TOKEN: string = import.meta.env?.VITE_API_TOKEN || '';
const isRemote = !!BASE;

// 本地存储键名约定
const DB_KEYS = {
  ORDERS: 'wefix_orders',
  USERS: 'wefix_users',
  CURRENT_USER: 'wefix_current_user'
};

// 初始化本地数据库：写入默认用户与空订单
const initDB = () => {
  if (!localStorage.getItem(DB_KEYS.USERS)) {
    localStorage.setItem(DB_KEYS.USERS, JSON.stringify(MOCK_USERS));
  }
  if (!localStorage.getItem(DB_KEYS.ORDERS)) {
    localStorage.setItem(DB_KEYS.ORDERS, JSON.stringify([]));
  }
};

initDB();

// 登录：根据角色获取或创建用户，持久化到本地
export const loginUser = async (role: UserRole): Promise<User> => {
  const users = JSON.parse(localStorage.getItem(DB_KEYS.USERS) || '[]');
  let user = users.find((u: User) => u.role === role);
  
  if (!user) {
    user = {
      id: `user_${Date.now()}`,
      name: role === UserRole.CUSTOMER ? '新用户' : '新师傅',
      avatar: `https://picsum.photos/seed/${Date.now()}/100/100`,
      role: role,
      phone: '13000000000',
      isVerified: role === UserRole.TECHNICIAN ? false : undefined,
      rating: 5.0
    };
    users.push(user);
    localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users));
  }
  
  localStorage.setItem(DB_KEYS.CURRENT_USER, JSON.stringify(user));
  return user;
};

// 登出：清除当前用户登录态
export const logoutUser = async () => {
  localStorage.removeItem(DB_KEYS.CURRENT_USER);
};

// 获取当前用户：未登录则返回 null
export const getCurrentUser = (): User | null => {
  const u = localStorage.getItem(DB_KEYS.CURRENT_USER);
  return u ? JSON.parse(u) : null;
};

// 获取订单列表：远程优先，否则读取本地并按角色过滤
export const getOrders = async (user: User): Promise<Order[]> => {
  if (isRemote) {
    const r = await fetch(`${BASE}/orders?userId=${encodeURIComponent(user.id)}&role=${encodeURIComponent(user.role)}`, {
      headers: {
        ...(API_TOKEN ? { Authorization: API_TOKEN } : {})
      }
    });
    if (!r.ok) throw new Error('fetch orders failed');
    const data: Order[] = await r.json();
    return data;
  }
  const orders: Order[] = JSON.parse(localStorage.getItem(DB_KEYS.ORDERS) || '[]');
  if (user.role === UserRole.CUSTOMER) {
    return orders.filter(o => o.customerId === user.id).sort((a, b) => b.createdAt - a.createdAt);
  } else if (user.role === UserRole.TECHNICIAN) {
    return orders.filter(o => o.status === OrderStatus.PENDING || o.techId === user.id).sort((a, b) => b.createdAt - a.createdAt);
  }
  return [];
};

// 创建订单：远程 POST，否则在本地生成并写入
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
    };
    const r = await fetch(`${BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(API_TOKEN ? { Authorization: API_TOKEN } : {}) },
      body: JSON.stringify(payload)
    });
    if (!r.ok) throw new Error('create order failed');
    const newOrder: Order = await r.json();
    return newOrder;
  }
  const orders: Order[] = JSON.parse(localStorage.getItem(DB_KEYS.ORDERS) || '[]');
  const newOrder: Order = {
    id: `ord_${Date.now()}`,
    customerId: orderData.customerId!,
    customerName: orderData.customerName!,
    customerPhone: orderData.customerPhone!,
    category: orderData.category || '其他',
    address: orderData.address!,
    description: orderData.description!,
    serviceType: orderData.serviceType!,
    status: OrderStatus.PENDING,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    images: orderData.images || []
  };
  orders.unshift(newOrder);
  localStorage.setItem(DB_KEYS.ORDERS, JSON.stringify(orders));
  return newOrder;
};

// 更新订单状态：远程 PATCH，否则本地更新并持久化
export const updateOrderStatus = async (orderId: string, status: OrderStatus, techId?: string, techName?: string): Promise<Order> => {
  if (isRemote) {
    const payload = { status, techId, techName };
    const r = await fetch(`${BASE}/orders/${encodeURIComponent(orderId)}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...(API_TOKEN ? { Authorization: API_TOKEN } : {}) },
      body: JSON.stringify(payload)
    });
    if (!r.ok) throw new Error('update status failed');
    const updated: Order = await r.json();
    return updated;
  }
  const orders: Order[] = JSON.parse(localStorage.getItem(DB_KEYS.ORDERS) || '[]');
  const index = orders.findIndex(o => o.id === orderId);
  if (index === -1) throw new Error("Order not found");
  const order = orders[index];
  order.status = status;
  order.updatedAt = Date.now();
  if (techId && status === OrderStatus.ACCEPTED) {
    order.techId = techId;
    order.techName = techName;
  }
  orders[index] = order;
  localStorage.setItem(DB_KEYS.ORDERS, JSON.stringify(orders));
  return order;
};

// 评价订单：远程 POST，否则本地更新对应评价字段
export const rateOrder = async (orderId: string, rating: number, comment: string, type: 'CUSTOMER_TO_TECH' | 'TECH_TO_CUSTOMER'): Promise<Order> => {
  if (isRemote) {
    const payload = { rating, comment, type };
    const r = await fetch(`${BASE}/orders/${encodeURIComponent(orderId)}/rate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(API_TOKEN ? { Authorization: API_TOKEN } : {}) },
      body: JSON.stringify(payload)
    });
    if (!r.ok) throw new Error('rate failed');
    const updated: Order = await r.json();
    return updated;
  }
  const orders: Order[] = JSON.parse(localStorage.getItem(DB_KEYS.ORDERS) || '[]');
  const index = orders.findIndex(o => o.id === orderId);
  if (index === -1) throw new Error("Order not found");
  const order = orders[index];
  if (type === 'CUSTOMER_TO_TECH') {
    order.techRating = rating;
    order.customerComment = comment;
  } else {
    order.customerRating = rating;
    order.techComment = comment;
  }
  orders[index] = order;
  localStorage.setItem(DB_KEYS.ORDERS, JSON.stringify(orders));
  return order;
};
