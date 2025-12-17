// 应用配置：声明页面路由与 tabBar
export default {
  pages: [
    'pages/home/index',
    'pages/login/index',
    'pages/register/index',
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
      {
        pagePath: 'pages/home/index',
        text: '首页',
        iconPath: 'assets/tabbar/home.png',
        selectedIconPath: 'assets/tabbar/home-active.png'
      },
      {
        pagePath: 'pages/create-order/index',
        text: '下单',
        iconPath: 'assets/tabbar/plus.png',
        selectedIconPath: 'assets/tabbar/plus-active.png'
      },
      {
        pagePath: 'pages/profile/index',
        text: '我的',
        iconPath: 'assets/tabbar/user.png',
        selectedIconPath: 'assets/tabbar/user-active.png'
      }
    ]
  }
}
