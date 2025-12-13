// 模拟接口延迟（毫秒），用于模拟网络请求耗时
export const MOCK_DELAY = 500;

// 维修类别列表：用于下单页面与筛选展示
export const REPAIR_CATEGORIES = [
  '手机维修',
  '电脑维修',
  '家电维修',
  '其他'
];

// 模拟用户数据：包含一个顾客与一个认证维修师傅
export const MOCK_USERS = [
  {
    id: 'cust_001',
    name: '张三',
    avatar: 'https://picsum.photos/seed/cust1/100/100',
    role: 'CUSTOMER', // 角色：顾客
    phone: '13800138000' // 联系电话
  },
  {
    id: 'tech_001',
    name: '李师傅',
    avatar: 'https://picsum.photos/seed/tech1/100/100',
    role: 'TECHNICIAN', // 角色：维修师傅
    phone: '13900139000', // 联系电话
    isVerified: true, // 是否平台认证
    rating: 4.8 // 综合评分（5分制）
  }
];
