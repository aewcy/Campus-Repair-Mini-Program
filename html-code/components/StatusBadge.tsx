import React from 'react';
import { OrderStatus } from '../types';

interface StatusBadgeProps {
  status: OrderStatus;
}

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