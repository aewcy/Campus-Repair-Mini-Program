// 通用类型定义，供两端复用
export enum UserRole {
  GUEST = 'GUEST',
  CUSTOMER = 'CUSTOMER',
  TECHNICIAN = 'TECHNICIAN'
}

export enum OrderStatus {
  PENDING = '待接单',
  ACCEPTED = '已接单',
  IN_PROGRESS = '维修中',
  COMPLETED = '已完成',
  CANCELLED = '已取消'
}

export enum ServiceType {
  HOME = '上门服务',
  SHOP = '到店维修'
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  role: UserRole;
  phone: string;
  isVerified?: boolean; // For technicians
  rating?: number;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  techId?: string;
  techName?: string;
  techPhone?: string;
  category: string;
  address: string;
  description: string;
  serviceType: ServiceType;
  status: OrderStatus;
  createdAt: number;
  updatedAt: number;
  images: string[];
  customerRating?: number;
  techRating?: number;
  customerComment?: string;
  techComment?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}
