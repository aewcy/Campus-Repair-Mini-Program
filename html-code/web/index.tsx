// Web 应用入口：挂载 React 应用到页面根节点
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// 获取页面中用于挂载的根节点
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// 使用 React 18 的 createRoot API 创建根实例
const root = ReactDOM.createRoot(rootElement);
root.render(
  // 严格模式：帮助发现潜在问题（仅开发时启用）
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
