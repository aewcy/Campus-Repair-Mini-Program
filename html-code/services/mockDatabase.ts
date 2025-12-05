
import { Order, OrderStatus, User, UserRole } from '../types';
import { MOCK_USERS } from '../constants';

const DB_KEYS = {
  ORDERS: 'wefix_orders',
  USERS: 'wefix_users',
  CURRENT_USER: 'wefix_current_user'
};

// Initialize DB
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
  // Simple mock login: find first user of role or create one
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
  const orders: Order[] = JSON.parse(localStorage.getItem(DB_KEYS.ORDERS) || '[]');
  
  if (user.role === UserRole.CUSTOMER) {
    return orders.filter(o => o.customerId === user.id).sort((a, b) => b.createdAt - a.createdAt);
  } else if (user.role === UserRole.TECHNICIAN) {
    // Techs see pending orders (marketplace) AND their own accepted orders
    return orders.filter(o => 
      o.status === OrderStatus.PENDING || o.techId === user.id
    ).sort((a, b) => b.createdAt - a.createdAt);
  }
  return [];
};

export const createOrder = async (orderData: Partial<Order>): Promise<Order> => {
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
