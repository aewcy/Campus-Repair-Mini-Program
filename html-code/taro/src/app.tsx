import React, { useEffect } from 'react'
import Taro from '@tarojs/taro'

const App = (props) => {
  useEffect(() => {
    Taro.getSystemInfo().then(() => {})
  }, [])
  return props.children
}

export default App
