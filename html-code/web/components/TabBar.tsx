// 组件：底部导航栏
// 作用：在首页/下单/我的之间进行切换，客户角色显示“下单”快捷入口
import React from 'react';
import { Home, List, User as UserIcon, PlusCircle } from 'lucide-react';
import { UserRole } from '../../types';

// 属性定义：当前 tab、切换回调、用户角色
interface TabBarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  role: UserRole;
}

// 组件主体：根据角色与当前 tab 渲染
const TabBar: React.FC<TabBarProps> = ({ currentTab, onTabChange, role }) => {
  const isCustomer = role === UserRole.CUSTOMER;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe pt-2 px-4 flex justify-around items-end z-50 h-16 shadow-lg">
      <button 
        onClick={() => onTabChange('home')}
        className={`flex flex-col items-center justify-center w-16 ${currentTab === 'home' ? 'text-green-600' : 'text-gray-400'}`}
      >
        <Home size={24} />
        <span className="text-xs mt-1">首页</span>
      </button>

      {isCustomer && (
        <button 
          onClick={() => onTabChange('create')}
          className="flex flex-col items-center justify-center -mt-6"
        >
          <div className="bg-green-500 rounded-full p-3 shadow-lg text-white">
            <PlusCircle size={32} />
          </div>
          <span className="text-xs mt-1 text-gray-500">下单</span>
        </button>
      )}

      <button 
        onClick={() => onTabChange('profile')}
        className={`flex flex-col items-center justify-center w-16 ${currentTab === 'profile' ? 'text-green-600' : 'text-gray-400'}`}
      >
        <UserIcon size={24} />
        <span className="text-xs mt-1">我的</span>
      </button>
    </div>
  );
};

export default TabBar;
