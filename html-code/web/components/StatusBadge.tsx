// 组件：订单状态徽章
// 作用：以颜色区分不同状态的可视化提示
import React from 'react';
import { OrderStatus } from '../../types';

// 属性定义：订单状态
interface StatusBadgeProps {
  status: OrderStatus;
}

// 组件主体：根据状态选择颜色并渲染徽章
const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  let colorClass = "";
  switch (status) {
    case OrderStatus.PENDING: colorClass = 'bg-orange-100 text-orange-700'; break;
    case OrderStatus.ACCEPTED: colorClass = 'bg-blue-100 text-blue-700'; break;
    case OrderStatus.IN_PROGRESS: colorClass = 'bg-purple-100 text-purple-700'; break;
    case OrderStatus.COMPLETED: colorClass = 'bg-green-100 text-green-700'; break;
    case OrderStatus.CANCELLED: colorClass = 'bg-gray-100 text-gray-700'; break;
  }

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold ${colorClass}`}>
      {status}
    </span>
  );
};

export default StatusBadge;
