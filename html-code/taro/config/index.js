const path = require('path')

const config = {
  projectName: 'wefix-miniapp-taro',
  date: '2025-12-13',
  designWidth: 750,
  deviceRatio: {
    640: 2.34,
    750: 1,
    828: 1.81
  },
  sourceRoot: 'src',
  outputRoot: 'dist',
  framework: 'react',
  compiler: 'webpack5',
  plugins: ['@tarojs/plugin-platform-weapp', '@tarojs/plugin-framework-react'],
  alias: {
    '@': path.resolve(__dirname, '..', 'src')
  },
  defineConstants: {
    'process.env.VITE_API_BASE_URL': JSON.stringify(process.env.VITE_API_BASE_URL || ''),
    'process.env.VITE_API_TOKEN': JSON.stringify(process.env.VITE_API_TOKEN || '')
  },
  babel: {
    presets: [
      ['@babel/preset-react', { runtime: 'automatic' }],
      ['@babel/preset-typescript', { allowDeclareFields: true }]
    ]
  }
}

module.exports = function (merge) {
  if (process.env.NODE_ENV === 'development') {
    return merge({}, config, {
      env: { NODE_ENV: '"development"' }
    })
  }
  return merge({}, config, {
    env: { NODE_ENV: '"production"' }
  })
}
