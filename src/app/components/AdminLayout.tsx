import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate, useLocation } from 'react-router';
import { 
  Users, 
  Calendar, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  PieChart,
  Bell,
  Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { logout, currentUser } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const menuItems = [
    { icon: PieChart, label: 'Dashboard', path: '/admin' },
    { icon: Users, label: 'Staff Management', path: '/admin/staff' },
    { icon: Calendar, label: 'Attendance Logs', path: '/admin/attendance' },
    { icon: Settings, label: 'Settings', path: '/admin/settings' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans">
      {/* Sidebar */}
      <motion.aside 
        initial={{ width: 280 }}
        animate={{ width: isSidebarOpen ? 280 : 80 }}
        className="bg-white border-r border-gray-200 fixed h-full z-30 hidden md:flex flex-col transition-all duration-300 shadow-xl shadow-gray-200/50"
      >
        <div className="p-6 flex items-center justify-between h-20 border-b border-gray-100">
          <div className={`flex items-center gap-3 overflow-hidden ${!isSidebarOpen && 'justify-center w-full'}`}>
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/30">
              <span className="text-white font-bold text-xl">W</span>
            </div>
            {isSidebarOpen && (
              <motion.span 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="font-bold text-xl text-gray-800 whitespace-nowrap"
              >
                WorkForce
              </motion.span>
            )}
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path === '/admin' && location.pathname === '/admin');
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 p-3.5 rounded-xl transition-all group relative overflow-hidden ${
                  isActive 
                    ? 'bg-blue-50 text-blue-600 font-medium shadow-sm ring-1 ring-blue-100' 
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                } ${!isSidebarOpen && 'justify-center'}`}
              >
                <item.icon size={22} className={`shrink-0 transition-colors ${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                {isSidebarOpen && (
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    {item.label}
                  </motion.span>
                )}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-600 rounded-r-full" />
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button 
            onClick={logout}
            className={`w-full flex items-center gap-3 p-3.5 rounded-xl text-red-500 hover:bg-red-50 transition-colors ${!isSidebarOpen && 'justify-center'}`}
          >
            <LogOut size={22} />
            {isSidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </motion.aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {/* Mobile Header */}
        <div className="md:hidden fixed top-0 w-full bg-white border-b border-gray-200 z-40 px-4 py-3 flex items-center justify-between shadow-sm">
           <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-gray-600">
              <Menu size={24} />
            </button>
            <span className="font-bold text-lg text-gray-800">WorkForce</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden">
             {currentUser?.avatar && <img src={currentUser.avatar} alt="User" />}
          </div>
        </div>
      </AnimatePresence>

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 pt-16 md:pt-0 ${isSidebarOpen ? 'md:ml-[280px]' : 'md:ml-[80px]'}`}>
        {/* Top Header */}
        <header className="h-20 bg-white/80 backdrop-blur-md sticky top-0 z-20 border-b border-gray-200 px-8 flex items-center justify-between hidden md:flex">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
            >
              <Menu size={20} />
            </button>
            <div className="h-6 w-px bg-gray-200" />
            <h2 className="font-semibold text-gray-800">
              {menuItems.find(i => i.path === location.pathname)?.label || 'Dashboard'}
            </h2>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="Search..." 
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-transparent focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-500/10 rounded-lg text-sm transition-all outline-none"
              />
            </div>
            
            <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </button>
            
            <div className="flex items-center gap-3 pl-6 border-l border-gray-200">
              <div className="text-right hidden lg:block">
                <div className="text-sm font-semibold text-gray-900">{currentUser?.name}</div>
                <div className="text-xs text-gray-500 capitalize">{currentUser?.role}</div>
              </div>
              <div className="w-10 h-10 rounded-full bg-gray-200 border-2 border-white shadow-sm overflow-hidden">
                {currentUser?.avatar ? (
                  <img src={currentUser.avatar} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <Users className="text-gray-400 m-auto mt-2" size={20} />
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
};
