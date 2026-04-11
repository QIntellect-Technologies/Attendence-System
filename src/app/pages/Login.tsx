import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { User, Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

export const Login: React.FC = () => {
  const { login } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'staff'>('staff');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API delay for a polished feel
    await new Promise(resolve => setTimeout(resolve, 800));
    
    if (login(email, role)) {
      toast.success('Welcome back!');
      if (role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/staff');
      }
    } else {
      toast.error('Invalid credentials. Please check your email or role.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Panel - Image & Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gray-900 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/90 to-black/80 z-10" />
        <img 
          src="https://images.unsplash.com/photo-1717343656288-a1c0c23ba2df?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBvZmZpY2UlMjBidWlsZGluZyUyMGFyY2hpdGVjdHVyZSUyMGdsYXNzJTIwYWJzdHJhY3R8ZW58MXx8fHwxNzcxMDc3NDE5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral" 
          alt="Office" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="relative z-20 flex flex-col justify-between p-12 h-full text-white">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck size={32} className="text-blue-400" />
              <span className="text-2xl font-bold tracking-tight">WorkForce Pro</span>
            </div>
            <p className="text-blue-200">Enterprise Attendance Management System</p>
          </div>
          
          <div className="space-y-6 max-w-md">
            <h2 className="text-4xl font-bold leading-tight">
              Manage your team efficiently and securely.
            </h2>
            <p className="text-lg text-gray-300">
              Track attendance, manage shifts, and generate reports with our advanced biometric verification system.
            </p>
            
            <div className="flex gap-4 pt-4">
              <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/10">
                <h3 className="font-bold text-2xl mb-1">98%</h3>
                <p className="text-sm text-gray-300">Attendance Accuracy</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/10">
                <h3 className="font-bold text-2xl mb-1">24/7</h3>
                <p className="text-sm text-gray-300">System Uptime</p>
              </div>
            </div>
          </div>
          
          <div className="text-sm text-gray-400">
            © 2024 WorkForce Pro. All rights reserved.
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md space-y-8"
        >
          <div className="text-center lg:text-left">
            <h1 className="text-3xl font-bold text-gray-900">Sign in to your account</h1>
            <p className="mt-2 text-gray-600">Enter your details to access the dashboard</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="bg-gray-50 p-1.5 rounded-lg inline-flex w-full border border-gray-100">
              <button
                type="button"
                onClick={() => setRole('staff')}
                className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  role === 'staff' 
                    ? 'bg-white text-blue-600 shadow-sm ring-1 ring-gray-200' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <User size={18} />
                Staff Portal
              </button>
              <button
                type="button"
                onClick={() => setRole('admin')}
                className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  role === 'admin' 
                    ? 'bg-white text-blue-600 shadow-sm ring-1 ring-gray-200' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Lock size={18} />
                Admin Panel
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={role === 'admin' ? "admin@company.com" : "john@company.com"}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <input id="remember-me" type="checkbox" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                  <label htmlFor="remember-me" className="ml-2 block text-gray-500">Remember me</label>
                </div>
                <a href="#" className="font-medium text-blue-600 hover:text-blue-500">Forgot password?</a>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 group"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Protected by reCAPTCHA</span>
            </div>
          </div>
          
           <div className="mt-6 text-center text-xs text-gray-400 bg-gray-50 p-4 rounded-lg border border-dashed border-gray-200">
            <p className="font-medium text-gray-500 mb-1">Demo Access Credentials:</p>
            <p>Admin: <span className="font-mono text-gray-600">admin@company.com</span></p>
            <p>Staff: <span className="font-mono text-gray-600">john@company.com</span></p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
