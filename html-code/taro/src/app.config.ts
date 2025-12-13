// 应用配置：声明页面路由与 tabBar
export default {
  pages: [
    'pages/login/index',
    'pages/home/index',
    'pages/create-order/index',
    'pages/order-detail/index',
    'pages/profile/index',
    'pages/privacy/index'
  ],
  window: {
    navigationBarTitleText: 'WeFix',
    navigationBarBackgroundColor: '#ffffff',
    navigationBarTextStyle: 'black'
  },
  tabBar: {
    color: '#9ca3af',
    selectedColor: '#16a34a',
    backgroundColor: '#ffffff',
    list: [
      { pagePath: 'pages/home/index', text: '首页' },
      { pagePath: 'pages/create-order/index', text: '下单' },
      { pagePath: 'pages/profile/index', text: '我的' }
    ]
  }
}
