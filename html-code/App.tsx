
import React, { useState, useEffect } from 'react';
import { User, UserRole, Order, OrderStatus, ServiceType } from './types';
import { loginUser, logoutUser, getCurrentUser, getOrders, createOrder, updateOrderStatus, rateOrder } from './services/mockDatabase';
import TabBar from './components/TabBar';
import OrderCard from './components/OrderCard';
import StatusBadge from './components/StatusBadge';
import { REPAIR_CATEGORIES } from './constants';
import { 
  Loader2, 
  Camera, 
  MapPin, 
  Phone, 
  ShieldCheck, 
  LogOut, 
  FileText, 
  ChevronRight, 
  UserCheck, 
  Star, 
  User as UserIcon,
  Wrench,
  ChevronLeft,
  MessageSquare
} from 'lucide-react';

// Simplified Router
type View = 'LOGIN' | 'HOME' | 'CREATE_ORDER' | 'ORDER_DETAIL' | 'PROFILE' | 'PRIVACY';

const App = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [view, setView] = useState<View>('LOGIN');
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Create Order Form State
  const [formData, setFormData] = useState({
    category: REPAIR_CATEGORIES[0],
    address: '',
    description: '',
    serviceType: ServiceType.HOME,
    contactName: '',
    contactPhone: ''
  });

  // Rating State
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  // Initial Load
  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setCurrentUser(user);
      loadOrders(user);
      setView('HOME');
    }
  }, []);

  const loadOrders = async (user: User) => {
    setIsLoading(true);
    try {
      const data = await getOrders(user);
      setOrders(data);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (role: UserRole) => {
    setIsLoading(true);
    try {
      const user = await loginUser(role);
      setCurrentUser(user);
      await loadOrders(user);
      setView('HOME');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    setCurrentUser(null);
    setView('LOGIN');
  };

  const handleCreateOrder = async () => {
    if (!currentUser || !formData.address || !formData.description) {
      alert("请填写完整信息");
      return;
    }
    setIsLoading(true);
    try {
      await createOrder({
        customerId: currentUser.id,
        customerName: formData.contactName || currentUser.name,
        customerPhone: formData.contactPhone || currentUser.phone,
        ...formData
      });
      await loadOrders(currentUser);
      setView('HOME');
      // Reset form
      setFormData({
         category: REPAIR_CATEGORIES[0],
         address: '',
         description: '',
         serviceType: ServiceType.HOME,
         contactName: '',
         contactPhone: ''
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (status: OrderStatus) => {
    if (!selectedOrder || !currentUser) return;
    setIsLoading(true);
    try {
      const techId = currentUser.role === UserRole.TECHNICIAN ? currentUser.id : selectedOrder.techId;
      const techName = currentUser.role === UserRole.TECHNICIAN ? currentUser.name : selectedOrder.techName;
      await updateOrderStatus(selectedOrder.id, status, techId, techName);
      const data = await getOrders(currentUser);
      setOrders(data);
      const next = data.find(o => o.id === selectedOrder.id) || null;
      setSelectedOrder(next);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRating = async () => {
    if (!selectedOrder || !currentUser) return;
    setIsLoading(true);
    try {
      const type = currentUser.role === UserRole.CUSTOMER ? 'CUSTOMER_TO_TECH' : 'TECH_TO_CUSTOMER';
      await rateOrder(selectedOrder.id, rating, comment, type);
      const data = await getOrders(currentUser);
      setOrders(data);
      const next = data.find(o => o.id === selectedOrder.id) || null;
      setSelectedOrder(next);
      setComment('');
      setRating(5);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Views ---

  if (view === 'LOGIN') {
    return (
      <div className="min-h-screen bg-white flex flex-col justify-center px-6">
        <div className="text-center mb-16">
          <div className="w-24 h-24 bg-green-500 rounded-3xl mx-auto flex items-center justify-center shadow-lg mb-8">
             <Wrench className="text-white" size={48} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">WeFix</h1>
          <p className="text-gray-500 text-sm">专业的社区维修服务平台</p>
        </div>

        <div className="space-y-4">
          <button 
            onClick={() => handleLogin(UserRole.CUSTOMER)}
            className="w-full bg-green-500 hover:bg-green-600 active:bg-green-700 text-white font-semibold py-4 rounded-xl shadow-md transition-all flex items-center justify-center text-lg"
          >
             <UserCheck className="mr-3" /> 客户登录 (发布需求)
          </button>
          <button 
            onClick={() => handleLogin(UserRole.TECHNICIAN)}
            className="w-full bg-gray-50 hover:bg-gray-100 active:bg-gray-200 text-gray-700 font-semibold py-4 rounded-xl border border-gray-200 transition-all flex items-center justify-center text-lg"
          >
             <Wrench className="mr-3" /> 师傅登录 (接单赚钱)
          </button>
        </div>
        
        <div className="mt-auto pb-8 text-center text-xs text-gray-400">
          <p>点击登录即代表同意 <button onClick={() => setView('PRIVACY')} className="text-green-600 font-medium">隐私政策</button></p>
        </div>
      </div>
    );
  }

  if (view === 'PRIVACY') {
    return (
      <div className="min-h-screen bg-white p-6">
        <button onClick={() => setView('LOGIN')} className="mb-6 flex items-center text-gray-600">
            <ChevronLeft size={20} /> 返回
        </button>
        <h1 className="text-2xl font-bold mb-6 text-gray-900">隐私政策</h1>
        <div className="prose text-sm text-gray-600 leading-relaxed">
          <p className="mb-4">WeFix 尊重并保护所有使用服务用户的个人隐私权。</p>
          <ul className="list-disc pl-5 mt-2 space-y-3">
             <li><strong>信息收集：</strong> 我们仅收集完成服务所必须的姓名、电话、地址及故障描述信息。</li>
             <li><strong>信息使用：</strong> 仅用于订单匹配和联系。</li>
             <li><strong>安全保护：</strong> 我们使用JWT验证和加密存储技术保护您的数据。</li>
             <li><strong>权限说明：</strong> 需要相机权限用于上传故障照片。</li>
          </ul>
        </div>
      </div>
    );
  }

  // Helper for rendering header
  const getHeaderTitle = () => {
    switch (view) {
      case 'HOME': return 'WeFix 维修';
      case 'CREATE_ORDER': return '发布需求';
      case 'PROFILE': return '个人中心';
      case 'ORDER_DETAIL': return '订单详情';
      default: return 'WeFix';
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-safe">
      {/* Header - Fixed & Native Look */}
      <div className="bg-white text-gray-900 border-b border-gray-200 px-4 pt-safe h-12 flex items-center sticky top-0 z-40">
        {(view === 'ORDER_DETAIL') && (
          <button onClick={() => setView('HOME')} className="absolute left-4 p-1 -ml-1 text-gray-600">
            <ChevronLeft size={24} />
          </button>
        )}
        <h1 className="font-semibold text-lg flex-1 text-center">{getHeaderTitle()}</h1>
      </div>

      {/* Main Content */}
      <div className="p-4 pb-24">
        {isLoading && (
          <div className="fixed inset-0 bg-black/10 z-50 flex items-center justify-center backdrop-blur-sm">
            <div className="bg-white p-4 rounded-2xl shadow-xl">
                <Loader2 className="animate-spin text-green-500" size={32} />
            </div>
          </div>
        )}

        {/* HOME VIEW */}
        {view === 'HOME' && (
          <div>
            {currentUser?.role === UserRole.TECHNICIAN && (
              <div className="bg-blue-50 text-blue-700 p-4 rounded-xl mb-4 text-sm flex items-start shadow-sm border border-blue-100">
                <ShieldCheck className="mr-3 shrink-0 mt-0.5" size={18} />
                <span>您的资质已审核通过，可以开始接单。</span>
              </div>
            )}
            
            <div className="space-y-4">
              {orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-gray-400">
                  <div className="bg-gray-200 p-6 rounded-full mb-4">
                    <FileText size={40} className="text-gray-400" />
                  </div>
                  <p className="text-sm">暂无订单</p>
                </div>
              ) : (
                orders.map(order => (
                  <OrderCard 
                    key={order.id} 
                    order={order} 
                    currentUserRole={currentUser?.role || UserRole.CUSTOMER}
                    onClick={(o) => { setSelectedOrder(o); setView('ORDER_DETAIL'); }}
                  />
                ))
              )}
            </div>
          </div>
        )}

        {/* CREATE ORDER VIEW */}
        {view === 'CREATE_ORDER' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <label className="block text-sm font-medium text-gray-900 mb-2">维修类别</label>
              <div className="relative">
                <select 
                  className="w-full appearance-none p-3.5 bg-gray-50 rounded-xl text-base text-gray-900 border border-transparent focus:bg-white focus:border-green-500 focus:ring-0 transition-colors"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                >
                  {REPAIR_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <div className="absolute right-3 top-3.5 pointer-events-none text-gray-500">
                  <ChevronRight size={20} className="rotate-90" />
                </div>
              </div>
            </div>

            <div className="p-4 border-b border-gray-100">
              <label className="block text-sm font-medium text-gray-900 mb-2">服务方式</label>
              <div className="flex space-x-3">
                {[ServiceType.HOME, ServiceType.SHOP].map(type => (
                  <label key={type} className={`flex-1 flex items-center justify-center p-3 rounded-xl border transition-all cursor-pointer ${formData.serviceType === type ? 'bg-green-50 border-green-500 text-green-700' : 'bg-gray-50 border-transparent text-gray-600'}`}>
                    <input 
                      type="radio" 
                      name="serviceType" 
                      className="hidden"
                      checked={formData.serviceType === type}
                      onChange={() => setFormData({...formData, serviceType: type})}
                    />
                    <span className="text-sm font-medium">{type}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="p-4 border-b border-gray-100">
              <label className="block text-sm font-medium text-gray-900 mb-2">问题描述</label>
              <textarea 
                className="w-full p-3 bg-gray-50 rounded-xl text-base border border-transparent focus:bg-white focus:border-green-500 focus:ring-0 min-h-[120px] transition-colors"
                placeholder="请详细描述故障情况，例如：屏幕碎裂、开机无反应..."
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>

            <div className="p-4 border-b border-gray-100">
              <label className="block text-sm font-medium text-gray-900 mb-2">上传照片</label>
              <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400 bg-gray-50 active:bg-gray-100 transition-colors">
                <Camera size={24} className="mb-1" />
                <span className="text-[10px]">添加照片</span>
              </div>
            </div>

            <div className="p-4">
              <label className="block text-sm font-medium text-gray-900 mb-2">详细地址</label>
              <div className="flex items-center bg-gray-50 rounded-xl p-3.5 border border-transparent focus-within:bg-white focus-within:border-green-500 transition-colors">
                 <MapPin className="text-gray-400 mr-3" size={20} />
                 <input 
                  type="text" 
                  className="bg-transparent w-full outline-none text-base text-gray-900 placeholder:text-gray-400"
                  placeholder="请输入街道、小区、楼号"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                 />
              </div>
            </div>

            <div className="p-4 pt-2">
               <button 
                onClick={handleCreateOrder}
                className="w-full bg-green-500 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-green-200 active:scale-95 transition-transform text-base"
              >
                立即发布
              </button>
            </div>
          </div>
        )}

        {/* ORDER DETAIL VIEW */}
        {view === 'ORDER_DETAIL' && selectedOrder && (
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl shadow-sm">
              <div className="flex justify-between items-start border-b border-gray-100 pb-4 mb-4">
                <div>
                   <h2 className="text-xl font-bold text-gray-900">{selectedOrder.category}</h2>
                   <p className="text-xs text-gray-400 mt-1 font-mono">ID: {selectedOrder.id}</p>
                </div>
                <StatusBadge status={selectedOrder.status} />
              </div>

              <div className="space-y-6">
                <div className="flex items-start">
                  <MapPin className="text-green-500 mr-3 mt-0.5" size={20} />
                  <div>
                    <p className="text-sm font-bold text-gray-900">维修地址</p>
                    <p className="text-sm text-gray-600 mt-0.5 leading-relaxed">{selectedOrder.address}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <FileText className="text-green-500 mr-3 mt-0.5" size={20} />
                  <div>
                    <p className="text-sm font-bold text-gray-900">故障描述</p>
                    <p className="text-sm text-gray-600 mt-0.5 leading-relaxed">{selectedOrder.description}</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <UserIcon className="text-green-500 mr-3 mt-0.5" size={20} />
                  <div>
                    <p className="text-sm font-bold text-gray-900">联系人</p>
                    <p className="text-sm text-gray-600 mt-0.5">{selectedOrder.customerName} {selectedOrder.customerPhone}</p>
                  </div>
                </div>

                {selectedOrder.techName && (
                  <div className="flex items-center bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                        <Wrench className="text-green-600" size={20} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-gray-900">维修师傅</p>
                      <p className="text-sm text-gray-600">{selectedOrder.techName}</p>
                    </div>
                    <a href={`tel:${(currentUser?.role === UserRole.CUSTOMER) ? (selectedOrder.techPhone || selectedOrder.customerPhone) : selectedOrder.customerPhone}`} className="w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center text-green-600 shadow-sm">
                        <Phone size={20} />
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="pb-8">
               {/* Technician Actions */}
               {currentUser?.role === UserRole.TECHNICIAN && (
                 <>
                   {selectedOrder.status === OrderStatus.PENDING && (
                     <button 
                       onClick={() => handleStatusChange(OrderStatus.ACCEPTED)}
                       className="w-full bg-green-500 text-white py-3.5 rounded-xl font-bold shadow-lg text-base"
                     >
                       立即接单
                     </button>
                   )}
                   {selectedOrder.status === OrderStatus.ACCEPTED && selectedOrder.techId === currentUser.id && (
                     <button 
                       onClick={() => handleStatusChange(OrderStatus.IN_PROGRESS)}
                       className="w-full bg-blue-500 text-white py-3.5 rounded-xl font-bold shadow-lg text-base"
                     >
                       开始维修
                     </button>
                   )}
                   {selectedOrder.status === OrderStatus.IN_PROGRESS && selectedOrder.techId === currentUser.id && (
                     <button 
                       onClick={() => handleStatusChange(OrderStatus.COMPLETED)}
                       className="w-full bg-green-600 text-white py-3.5 rounded-xl font-bold shadow-lg text-base"
                     >
                       维修完成
                     </button>
                   )}
                 </>
               )}

               {/* Customer Actions */}
               {currentUser?.role === UserRole.CUSTOMER && (
                 <>
                   {selectedOrder.status === OrderStatus.PENDING && (
                     <button 
                       onClick={() => handleStatusChange(OrderStatus.CANCELLED)}
                       className="w-full bg-white text-gray-500 py-3.5 rounded-xl font-bold border border-gray-200 text-base"
                     >
                       取消订单
                     </button>
                   )}
                   {selectedOrder.status === OrderStatus.COMPLETED && !selectedOrder.techRating && (
                     <div className="bg-white p-5 rounded-2xl shadow-sm mt-4">
                       <h3 className="font-bold mb-4 text-center text-gray-900">评价本次服务</h3>
                       <div className="flex justify-center space-x-3 mb-5">
                         {[1, 2, 3, 4, 5].map(star => (
                           <button key={star} onClick={() => setRating(star)} className="focus:outline-none transition-transform active:scale-110">
                             <Star 
                               className={`${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} 
                               size={36} 
                             />
                           </button>
                         ))}
                       </div>
                       <textarea 
                         className="w-full bg-gray-50 p-3 rounded-xl mb-4 text-sm text-gray-900 resize-none h-24 focus:outline-none focus:ring-1 focus:ring-green-500"
                         placeholder="说说您的体验，师傅技术怎么样..."
                         value={comment}
                         onChange={e => setComment(e.target.value)}
                       />
                       <button 
                         onClick={handleRating}
                         className="w-full bg-green-500 text-white py-3 rounded-xl font-bold shadow-md"
                       >
                         提交评价
                       </button>
                     </div>
                   )}
                 </>
               )}
            </div>
          </div>
        )}

        {/* PROFILE VIEW */}
        {view === 'PROFILE' && (
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-2xl shadow-sm flex items-center space-x-4">
               <img src={currentUser?.avatar} alt="Avatar" className="w-16 h-16 rounded-full bg-gray-100 object-cover" />
               <div className="flex-1">
                 <h2 className="text-xl font-bold text-gray-900">{currentUser?.name}</h2>
                 <p className="text-sm text-gray-500 mt-0.5">{currentUser?.phone}</p>
                 <span className={`inline-block px-2.5 py-0.5 text-xs font-medium rounded-full mt-2 ${currentUser?.role === UserRole.CUSTOMER ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'}`}>
                   {currentUser?.role === UserRole.CUSTOMER ? '普通客户' : '认证维修师'}
                 </span>
               </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
               <button className="w-full flex items-center justify-between p-4 border-b border-gray-100 active:bg-gray-50">
                  <div className="flex items-center text-gray-900 text-sm font-medium">
                    <MessageSquare size={20} className="mr-3 text-green-500" />
                    <span>我的消息</span>
                  </div>
                  <ChevronRight size={16} className="text-gray-400" />
               </button>
               <button className="w-full flex items-center justify-between p-4 border-b border-gray-100 active:bg-gray-50">
                  <div className="flex items-center text-gray-900 text-sm font-medium">
                    <ShieldCheck size={20} className="mr-3 text-green-500" />
                    <span>{currentUser?.role === UserRole.TECHNICIAN ? '资质管理' : '地址管理'}</span>
                  </div>
                  <ChevronRight size={16} className="text-gray-400" />
               </button>
               <button onClick={() => setView('PRIVACY')} className="w-full flex items-center justify-between p-4 active:bg-gray-50">
                  <div className="flex items-center text-gray-900 text-sm font-medium">
                    <FileText size={20} className="mr-3 text-green-500" />
                    <span>隐私政策</span>
                  </div>
                  <ChevronRight size={16} className="text-gray-400" />
               </button>
            </div>

            <button 
              onClick={handleLogout}
              className="w-full bg-white text-red-500 p-4 rounded-2xl shadow-sm flex items-center justify-center font-medium active:bg-red-50 transition-colors"
            >
              <LogOut size={20} className="mr-2" />
              退出登录
            </button>
            
            <p className="text-center text-xs text-gray-300 pt-4">WeFix v1.0.2</p>
          </div>
        )}
      </div>

      {/* Tab Bar */}
      {view !== 'LOGIN' && view !== 'PRIVACY' && view !== 'ORDER_DETAIL' && (
        <TabBar 
          currentTab={view === 'CREATE_ORDER' ? 'create' : view === 'PROFILE' ? 'profile' : 'home'}
          onTabChange={(t) => {
            if (t === 'home') setView('HOME');
            if (t === 'create') setView('CREATE_ORDER');
            if (t === 'profile') setView('PROFILE');
          }}
          role={currentUser?.role || UserRole.CUSTOMER}
        />
      )}
    </div>
  );
};

export default App;
