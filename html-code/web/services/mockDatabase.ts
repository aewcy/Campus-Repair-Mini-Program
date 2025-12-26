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
  CURRENT_USER: 'wefix_current_user',
  AUTH_TOKEN: 'wefix_auth_token'
};

const getStoredToken = (): string => {
  const raw = (localStorage.getItem(DB_KEYS.AUTH_TOKEN) || '').trim();
  return raw || (API_TOKEN || '').trim();
};

const setStoredToken = (token: string) => {
  const t = (token || '').trim();
  if (!t) {
    localStorage.removeItem(DB_KEYS.AUTH_TOKEN);
    return;
  }
  localStorage.setItem(DB_KEYS.AUTH_TOKEN, t);
};

const request = async <T,>(url: string, options: RequestInit = {}): Promise<T> => {
  const rawToken = getStoredToken();
  const authHeader = rawToken
    ? { Authorization: rawToken.startsWith('Bearer ') ? rawToken : `Bearer ${rawToken}` }
    : {};

  const headers: Record<string, string> = {
    ...(options.headers as any),
    ...authHeader
  };

  const res = await fetch(url, { ...options, headers });
  const contentType = res.headers.get('content-type') || '';

  const payload: any = contentType.includes('application/json') ? await res.json().catch(() => null) : await res.text().catch(() => '');
  if (!res.ok) {
    const message = payload?.message || payload?.error || payload?.errors?.[0]?.msg || `request failed: ${res.status}`;
    throw new Error(message);
  }
  return payload as T;
};

const mapBackendStatusToFrontend = (status: string): OrderStatus => {
  switch (status) {
    case 'pending': return OrderStatus.PENDING;
    case 'doing': return OrderStatus.IN_PROGRESS;
    case 'done': return OrderStatus.COMPLETED;
    case 'completed': return OrderStatus.COMPLETED;
    case 'cancelled': return OrderStatus.CANCELLED;
    default: return OrderStatus.PENDING;
  }
};

const mapBackendOrderToFrontend = (o: any): Order => {
  const now = Date.now();
  return {
    id: String(o?.id ?? o?.order_no ?? `ord_${now}`),
    customerId: String(o?.user_id ?? o?.customer_id ?? ''),
    customerName: o?.customer_name ?? (o?.user_id ? `用户${o.user_id}` : ''),
    customerPhone: o?.phone ?? o?.customer_phone ?? '',
    techId: o?.staff_id !== undefined && o?.staff_id !== null ? String(o.staff_id) : undefined,
    techName: o?.tech_name ?? o?.staff_name ?? undefined,
    techPhone: o?.tech_phone ?? undefined,
    category: o?.category ?? '其他',
    address: o?.location ?? o?.address ?? '',
    description: o?.description ?? '',
    serviceType: o?.service_type ?? ServiceType.HOME,
    status: mapBackendStatusToFrontend(o?.status ?? 'pending'),
    createdAt: typeof o?.created_at === 'number' ? o.created_at : (o?.created_at ? Date.parse(o.created_at) : now),
    updatedAt: typeof o?.updated_at === 'number' ? o.updated_at : (o?.updated_at ? Date.parse(o.updated_at) : now),
    images: Array.isArray(o?.images) ? o.images : (o?.image_url ? [o.image_url] : []),
    techRating: o?.rating ?? undefined,
    customerComment: o?.rating_comment ?? undefined
  };
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
  if (isRemote) {
    throw new Error('远程模式请使用账号密码登录');
  }
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

export const loginWithPassword = async (account: string, password: string, role?: UserRole): Promise<User> => {
  if (!isRemote) {
    return await loginUser(role || UserRole.CUSTOMER);
  }
  if (!account || !password) throw new Error('请输入账号和密码');

  const res = await request<{ success: boolean; token: string; user: any; message?: string }>(`${BASE}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: account, password })
  });

  const backendUser = res.user;
  const backendRole: UserRole = backendUser?.role === 'staff' ? UserRole.TECHNICIAN : UserRole.CUSTOMER;
  if (role && role !== backendRole) {
    throw new Error('所选身份与账号角色不匹配');
  }

  const user: User = {
    id: String(backendUser?.id ?? ''),
    name: String(backendUser?.username ?? ''),
    avatar: 'https://picsum.photos/100/100',
    role: backendRole,
    phone: String(backendUser?.phone ?? ''),
    rating: 5.0
  };

  setStoredToken(res.token);
  localStorage.setItem(DB_KEYS.CURRENT_USER, JSON.stringify(user));
  return user;
};

// 登出：清除当前用户登录态
export const logoutUser = async () => {
  localStorage.removeItem(DB_KEYS.CURRENT_USER);
  localStorage.removeItem(DB_KEYS.AUTH_TOKEN);
};

// 获取当前用户：未登录则返回 null
export const getCurrentUser = (): User | null => {
  const u = localStorage.getItem(DB_KEYS.CURRENT_USER);
  return u ? JSON.parse(u) : null;
};

// 获取订单列表：远程优先，否则读取本地并按角色过滤
export const getOrders = async (user: User): Promise<Order[]> => {
  if (isRemote) {
    if (user.role === UserRole.TECHNICIAN) {
      const res = await request<{ success: boolean; data: any[] }>(`${BASE}/api/orders?page=1&pageSize=50`, { method: 'GET' });
      return (res?.data || []).map(mapBackendOrderToFrontend);
    }
    const res = await request<{ success: boolean; data: any[] }>(`${BASE}/api/orders/my?page=1&pageSize=50`, { method: 'GET' });
    return (res?.data || []).map(mapBackendOrderToFrontend);
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
      location: orderData.address,
      phone: orderData.customerPhone,
      description: orderData.description,
      image_url: orderData.images && orderData.images.length > 0 ? orderData.images[0] : ''
    };

    const res = await request<{ success: boolean; message: string; order_no: string }>(`${BASE}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const list = await request<{ success: boolean; data: any[] }>(`${BASE}/api/orders/my?page=1&pageSize=20`, { method: 'GET' });
    const hit = (list?.data || []).find((o: any) => String(o?.order_no) === String(res.order_no)) || (list?.data || [])[0];
    if (hit) return mapBackendOrderToFrontend(hit);

    const now = Date.now();
    return {
      id: String(res.order_no),
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
    };
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
    if (status === OrderStatus.IN_PROGRESS) {
      await request(`${BASE}/api/orders/${encodeURIComponent(orderId)}/take`, { method: 'POST' });
    } else if (status === OrderStatus.COMPLETED) {
      await request(`${BASE}/api/orders/${encodeURIComponent(orderId)}/finish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: '' })
      });
    } else if (status === OrderStatus.CANCELLED) {
      await request(`${BASE}/api/orders/${encodeURIComponent(orderId)}/cancel`, { method: 'POST' });
    }

    const fresh = await request<{ success: boolean; data: any }>(`${BASE}/api/orders/${encodeURIComponent(orderId)}`, { method: 'GET' });
    return mapBackendOrderToFrontend(fresh?.data);
  }
  const orders: Order[] = JSON.parse(localStorage.getItem(DB_KEYS.ORDERS) || '[]');
  const index = orders.findIndex(o => o.id === orderId);
  if (index === -1) throw new Error("Order not found");
  const order = orders[index];
  order.status = status;
  order.updatedAt = Date.now();
  if (techId && (status === OrderStatus.ACCEPTED || status === OrderStatus.IN_PROGRESS) && !order.techId) {
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
    await request(`${BASE}/api/orders/${encodeURIComponent(orderId)}/rate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating, rating_comment: comment })
    });
    const fresh = await request<{ success: boolean; data: any }>(`${BASE}/api/orders/${encodeURIComponent(orderId)}`, { method: 'GET' });
    return mapBackendOrderToFrontend(fresh?.data);
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
