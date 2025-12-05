import React from 'react';
import { Order, OrderStatus, UserRole } from '../types';
import { MapPin, Clock, Wrench, AlertCircle, Phone, ArrowRight } from 'lucide-react';

interface OrderCardProps {
  order: Order;
  onClick: (order: Order) => void;
  currentUserRole: UserRole;
}

const getStatusColor = (status: OrderStatus) => {
  switch (status) {
    case OrderStatus.PENDING: return 'text-orange-500 bg-orange-50';
    case OrderStatus.ACCEPTED: return 'text-blue-500 bg-blue-50';
    case OrderStatus.IN_PROGRESS: return 'text-purple-500 bg-purple-50';
    case OrderStatus.COMPLETED: return 'text-green-500 bg-green-50';
    case OrderStatus.CANCELLED: return 'text-gray-500 bg-gray-100';
    default: return 'text-gray-500';
  }
};

const OrderCard: React.FC<OrderCardProps> = ({ order, onClick, currentUserRole }) => {
  return (
    <div 
      onClick={() => onClick(order)}
      className="bg-white p-4 rounded-xl shadow-sm mb-3 active:bg-gray-50 transition-colors border border-gray-100"
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-0.5 text-xs font-medium rounded ${getStatusColor(order.status)}`}>
            {order.status}
          </span>
          <h3 className="font-bold text-gray-800 text-lg line-clamp-1">{order.category}</h3>
        </div>
        <span className="text-xs text-gray-400">
          {new Date(order.createdAt).toLocaleDateString()}
        </span>
      </div>

      <div className="space-y-2 text-sm text-gray-600 mb-3">
         <div className="flex items-start">
           <MapPin size={16} className="mr-2 mt-0.5 shrink-0 text-gray-400" />
           <span className="line-clamp-1">{order.address}</span>
         </div>
         <div className="flex items-start">
           <AlertCircle size={16} className="mr-2 mt-0.5 shrink-0 text-gray-400" />
           <span className="line-clamp-2">{order.description}</span>
         </div>
         {currentUserRole === UserRole.TECHNICIAN && order.status === OrderStatus.PENDING && (
           <div className="flex items-center text-orange-600 bg-orange-50 p-2 rounded text-xs mt-2">
              <Clock size={14} className="mr-1" />
              待接单 - 距离您约 2.5km (模拟)
           </div>
         )}
      </div>

      <div className="flex justify-between items-center border-t border-gray-100 pt-3">
        <div className="flex items-center">
           <img 
             src={currentUserRole === UserRole.CUSTOMER && order.techName ? `https://ui-avatars.com/api/?name=${order.techName}` : `https://ui-avatars.com/api/?name=${order.customerName}`}
             alt="avatar" 
             className="w-6 h-6 rounded-full mr-2"
           />
           <span className="text-xs text-gray-500">
             {currentUserRole === UserRole.CUSTOMER ? (order.techName || '等待接单') : order.customerName}
           </span>
        </div>
        <div className="flex items-center text-gray-400">
          <span className="text-xs mr-1">查看详情</span>
          <ArrowRight size={14} />
        </div>
      </div>
    </div>
  );
};

export default OrderCard;