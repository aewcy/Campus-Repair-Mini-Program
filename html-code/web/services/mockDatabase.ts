import { Order, OrderStatus, User, UserRole, ServiceType } from '../../types';
import { MOCK_USERS } from '../constants';
const BASE: string = import.meta.env?.VITE_API_BASE_URL || '';
const API_TOKEN: string = import.meta.env?.VITE_API_TOKEN || '';
const isRemote = !!BASE;

const DB_KEYS = {
  ORDERS: 'wefix_orders',
  USERS: 'wefix_users',
  CURRENT_USER: 'wefix_current_user'
};

const initDB = () => {
  if (!localStorage.getItem(DB_KEYS.USERS)) {
    localStorage.setItem(DB_KEYS.USERS, JSON.stringify(MOCK_USERS));
  }
  if (!localStorage.getItem(DB_KEYS.ORDERS)) {
    localStorage.setItem(DB_KEYS.ORDERS, JSON.stringify([]));
  }
};

initDB();

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

export const logoutUser = async () => {
  localStorage.removeItem(DB_KEYS.CURRENT_USER);
};

export const getCurrentUser = (): User | null => {
  const u = localStorage.getItem(DB_KEYS.CURRENT_USER);
  return u ? JSON.parse(u) : null;
};

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

