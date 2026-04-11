import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Staff, AttendanceRecord } from '../types';
import { AdminLayout } from '../components/AdminLayout';
import { 
  Users, 
  UserPlus, 
  Trash2, 
  Edit2, 
  Search, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  MoreVertical,
  Filter
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

// Mock data for the chart
const generateChartData = () => {
  const data = [];
  for (let i = 6; i >= 0; i--) {
    const date = subDays(new Date(), i);
    data.push({
      name: format(date, 'EEE'),
      present: Math.floor(Math.random() * 50) + 20,
      absent: Math.floor(Math.random() * 10) + 2,
    });
  }
  return data;
};

export const AdminDashboard: React.FC = () => {
  const { staffList, attendanceRecords, addStaff, updateStaff, removeStaff } = useApp();
  const [activeTab, setActiveTab] = useState<'staff' | 'attendance'>('staff');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [chartData] = useState(generateChartData());

  // Stats
  const totalStaff = staffList.length;
  const today = new Date().toISOString().split('T')[0];
  const presentToday = attendanceRecords.filter(r => r.date === today && r.status === 'present').length;
  const absentToday = totalStaff - presentToday;

  // Filtered lists
  const filteredStaff = staffList.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAttendance = attendanceRecords.filter(r => {
    const staff = staffList.find(s => s.id === r.staffId);
    return staff?.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to remove this staff member?')) {
      removeStaff(id);
      toast.success('Staff member removed');
    }
  };

  const handleEdit = (staff: Staff) => {
    setEditingStaff(staff);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingStaff(null);
    setIsModalOpen(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
            <p className="text-gray-500 mt-1">Monitor your team's performance and attendance.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-2 shadow-sm">
              <Calendar size={16} />
              {format(new Date(), 'MMM dd, yyyy')}
            </button>
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-blue-500/20 flex items-center gap-2">
              <ArrowDownRight size={16} />
              Export Report
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard 
            title="Total Staff" 
            value={totalStaff} 
            trend="+12%" 
            trendUp={true}
            icon={<Users className="text-blue-600" size={24} />} 
            bg="bg-blue-50" 
          />
          <StatCard 
            title="Present Today" 
            value={presentToday} 
            trend="+5%" 
            trendUp={true}
            icon={<CheckCircle className="text-green-600" size={24} />} 
            bg="bg-green-50" 
          />
          <StatCard 
            title="Absent Today" 
            value={absentToday} 
            trend="-2%" 
            trendUp={false} // Good that it's down
            icon={<XCircle className="text-orange-600" size={24} />} 
            bg="bg-orange-50" 
          />
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - List */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tabs */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div className="flex gap-1 bg-gray-100/50 p-1 rounded-lg border border-gray-200/50">
                  <button
                    onClick={() => setActiveTab('staff')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      activeTab === 'staff' 
                        ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Staff List
                  </button>
                  <button
                    onClick={() => setActiveTab('attendance')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      activeTab === 'attendance' 
                        ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Attendance Logs
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative w-48 hidden sm:block">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                    <input
                      type="text"
                      placeholder="Search..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                    />
                  </div>
                  {activeTab === 'staff' && (
                    <button
                      onClick={handleAdd}
                      className="bg-gray-900 hover:bg-black text-white px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors shadow-lg shadow-gray-900/20"
                    >
                      <UserPlus size={16} />
                      <span className="hidden sm:inline">Add New</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto">
                {activeTab === 'staff' ? (
                  <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-50/50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 font-semibold text-gray-900">Employee</th>
                        <th className="px-6 py-3 font-semibold text-gray-900">Role & Dept</th>
                        <th className="px-6 py-3 font-semibold text-gray-900">Contact</th>
                        <th className="px-6 py-3 font-semibold text-gray-900">Status</th>
                        <th className="px-6 py-3 font-semibold text-gray-900 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredStaff.map((staff) => (
                        <tr key={staff.id} className="hover:bg-gray-50/80 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border border-white shadow-sm">
                                {staff.avatar ? (
                                  <img src={staff.avatar} alt={staff.name} className="w-full h-full object-cover" />
                                ) : (
                                  <Users size={18} className="text-gray-400" />
                                )}
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900">{staff.name}</div>
                                <div className="text-xs text-gray-500">ID: #{staff.id.substring(0, 6)}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-900">{staff.department}</div>
                            <div className="text-xs text-blue-600 capitalize">{staff.role}</div>
                          </td>
                          <td className="px-6 py-4 text-gray-500">
                            <div>{staff.email}</div>
                            <div className="text-xs">{staff.phone}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200/50">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                              Active
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => handleEdit(staff)}
                                className="p-2 hover:bg-white border border-transparent hover:border-gray-200 hover:shadow-sm rounded-lg text-gray-400 hover:text-blue-600 transition-all"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button 
                                onClick={() => handleDelete(staff.id)}
                                className="p-2 hover:bg-white border border-transparent hover:border-gray-200 hover:shadow-sm rounded-lg text-gray-400 hover:text-red-600 transition-all"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-50/50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 font-semibold text-gray-900">Staff Member</th>
                        <th className="px-6 py-3 font-semibold text-gray-900">Date</th>
                        <th className="px-6 py-3 font-semibold text-gray-900">Check In</th>
                        <th className="px-6 py-3 font-semibold text-gray-900">Check Out</th>
                        <th className="px-6 py-3 font-semibold text-gray-900 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredAttendance.map((record) => {
                        const staff = staffList.find(s => s.id === record.staffId);
                        return (
                          <tr key={record.id} className="hover:bg-gray-50/80 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden border border-white shadow-sm">
                                  {staff?.avatar ? (
                                    <img src={staff.avatar} alt={staff.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <Users size={16} className="text-gray-400 m-auto mt-2" />
                                  )}
                                </div>
                                <span className="font-medium text-gray-900">{staff?.name || 'Unknown'}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-gray-500 font-medium">
                              {format(new Date(record.date), 'MMM dd')}
                            </td>
                            <td className="px-6 py-4 font-mono text-xs text-gray-600">
                              {record.inTime ? (
                                <span className="bg-green-50 text-green-700 px-2 py-1 rounded border border-green-100">
                                  {format(new Date(record.inTime), 'hh:mm aa')}
                                </span>
                              ) : '-'}
                            </td>
                            <td className="px-6 py-4 font-mono text-xs text-gray-600">
                              {record.outTime ? (
                                <span className="bg-orange-50 text-orange-700 px-2 py-1 rounded border border-orange-100">
                                  {format(new Date(record.outTime), 'hh:mm aa')}
                                </span>
                              ) : '-'}
                            </td>
                            <td className="px-6 py-4 text-center">
                               <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                                record.status === 'present' 
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}>
                                {record.status === 'present' ? 'Present' : 'Absent'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Charts & Extra Info */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-semibold text-gray-900">Weekly Attendance</h3>
                <button className="p-1 hover:bg-gray-50 rounded text-gray-400 hover:text-gray-600">
                  <MoreVertical size={16} />
                </button>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#6B7280', fontSize: 12 }} 
                      dy={10}
                    />
                    <Tooltip 
                      cursor={{ fill: '#F3F4F6' }}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="present" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white relative overflow-hidden shadow-lg shadow-indigo-500/20">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Users size={120} />
              </div>
              <h3 className="font-bold text-xl mb-2 relative z-10">Upgrade to Pro</h3>
              <p className="text-indigo-100 text-sm mb-6 relative z-10 opacity-90">
                Get advanced analytics, payroll integration, and more features.
              </p>
              <button className="bg-white text-indigo-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-50 transition-colors relative z-10">
                View Plans
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal for Add/Edit Staff - Kept simple but styled */}
      {isModalOpen && (
        <StaffModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          staff={editingStaff}
          onSave={(staffData) => {
            if (editingStaff) {
              updateStaff({ ...editingStaff, ...staffData });
              toast.success('Staff updated successfully');
            } else {
              addStaff(staffData);
              toast.success('Staff added successfully');
            }
            setIsModalOpen(false);
          }}
        />
      )}
    </AdminLayout>
  );
};

const StatCard = ({ title, value, icon, bg, trend, trendUp }: any) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl ${bg}`}>
        {icon}
      </div>
      <div className={`flex items-center gap-1 text-sm font-medium ${trendUp ? 'text-green-600' : 'text-red-600'} bg-gray-50 px-2 py-1 rounded-lg`}>
        {trendUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
        {trend}
      </div>
    </div>
    <h3 className="text-3xl font-bold text-gray-900 mb-1">{value}</h3>
    <p className="text-sm font-medium text-gray-500">{title}</p>
  </div>
);

const StaffModal = ({ isOpen, onClose, staff, onSave }: { 
  isOpen: boolean; 
  onClose: () => void; 
  staff: Staff | null; 
  onSave: (data: any) => void; 
}) => {
  const [formData, setFormData] = useState({
    name: staff?.name || '',
    email: staff?.email || '',
    phone: staff?.phone || '',
    department: staff?.department || '',
    role: staff?.role || 'staff',
    joinDate: staff?.joinDate || new Date().toISOString().split('T')[0],
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
      >
        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {staff ? 'Edit Staff Member' : 'Add New Staff'}
            </h2>
            <p className="text-sm text-gray-500">Enter the details below</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 bg-white p-2 rounded-full shadow-sm border border-gray-100">
            <XCircle size={20} />
          </button>
        </div>
        
        <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Full Name</label>
              <input
                required
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all bg-gray-50 focus:bg-white"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Email</label>
              <input
                required
                type="email"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all bg-gray-50 focus:bg-white"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Phone</label>
              <input
                required
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all bg-gray-50 focus:bg-white"
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Department</label>
              <input
                required
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all bg-gray-50 focus:bg-white"
                value={formData.department}
                onChange={e => setFormData({...formData, department: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Role</label>
              <select
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all bg-gray-50 focus:bg-white appearance-none"
                value={formData.role}
                onChange={e => setFormData({...formData, role: e.target.value as any})}
              >
                <option value="staff">Staff Member</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Join Date</label>
              <input
                type="date"
                required
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all bg-gray-50 focus:bg-white"
                value={formData.joinDate}
                onChange={e => setFormData({...formData, joinDate: e.target.value})}
              />
            </div>
          </div>

          <div className="pt-6 flex gap-3 justify-end border-t border-gray-100 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-gray-700 hover:bg-gray-100 rounded-xl font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-gray-900 hover:bg-black text-white rounded-xl font-medium shadow-lg shadow-gray-900/20 transition-all hover:-translate-y-0.5"
            >
              Save Changes
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
