import React, { useState, useRef, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import Webcam from 'react-webcam';
import { 
  User, 
  Clock, 
  LogOut, 
  Camera, 
  CheckCircle2, 
  XCircle, 
  Calendar,
  Home,
  History,
  MapPin,
  ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

export const StaffDashboard: React.FC = () => {
  const { currentUser, logout, markAttendance, getStaffAttendance } = useApp();
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'profile'>('overview');
  const [showCamera, setShowCamera] = useState(false);
  const [attendanceType, setAttendanceType] = useState<'in' | 'out' | null>(null);
  
  const webcamRef = useRef<Webcam>(null);

  if (!currentUser) return null;

  const today = new Date().toISOString().split('T')[0];
  const myRecords = getStaffAttendance(currentUser.id);
  const todayRecord = myRecords.find(r => r.date === today);

  const capture = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc && attendanceType) {
        markAttendance(attendanceType, imageSrc);
        toast.success(`Marked ${attendanceType === 'in' ? 'In' : 'Out'} Successfully!`);
        setShowCamera(false);
        setAttendanceType(null);
      }
    }
  }, [webcamRef, attendanceType, markAttendance]);

  const handleAttendanceClick = (type: 'in' | 'out') => {
    setAttendanceType(type);
    setShowCamera(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-24 md:pb-0 relative font-sans overflow-hidden">
      {/* Top Decoration */}
      <div className="absolute top-0 left-0 w-full h-64 bg-blue-600 rounded-b-[40px] z-0 shadow-xl shadow-blue-900/20" />

      {/* Header */}
      <header className="px-6 pt-8 pb-4 flex justify-between items-center relative z-10 text-white">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center overflow-hidden border-2 border-white/30 shadow-lg">
            {currentUser.avatar ? (
              <img src={currentUser.avatar} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User className="text-white" size={24} />
            )}
          </div>
          <div>
            <h1 className="text-xl font-bold leading-tight">Hi, {currentUser.name.split(' ')[0]}</h1>
            <p className="text-blue-100 text-sm opacity-90">{currentUser.department}</p>
          </div>
        </div>
        <button 
          onClick={logout}
          className="w-10 h-10 flex items-center justify-center bg-white/10 backdrop-blur-md rounded-full hover:bg-white/20 transition-all border border-white/10"
        >
          <LogOut size={20} />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-6 pt-4 max-w-lg mx-auto w-full relative z-10">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div 
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Today's Status Card */}
              <div className="bg-white rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100 p-6 relative overflow-hidden">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h2 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Today's Status</h2>
                    <div className="text-2xl font-bold text-gray-900">
                      {todayRecord?.inTime ? (
                        todayRecord.outTime ? (
                          <span className="text-green-600 flex items-center gap-2">
                            Completed <CheckCircle2 size={24} />
                          </span>
                        ) : (
                          <span className="text-blue-600 flex items-center gap-2">
                            Working Now <Clock size={24} className="animate-pulse" />
                          </span>
                        )
                      ) : (
                        <span className="text-gray-400">Not Started</span>
                      )}
                    </div>
                  </div>
                  <div className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-bold">
                    {format(new Date(), 'MMM dd')}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 transition-colors hover:bg-gray-100">
                    <div className="text-xs text-gray-400 font-semibold uppercase mb-2 flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      Check In
                    </div>
                    <div className="font-mono font-bold text-xl text-gray-900 tracking-tight">
                      {todayRecord?.inTime ? format(new Date(todayRecord.inTime), 'hh:mm') : '--:--'}
                      <span className="text-xs text-gray-400 ml-1 font-sans font-normal">
                        {todayRecord?.inTime ? format(new Date(todayRecord.inTime), 'aa') : ''}
                      </span>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 transition-colors hover:bg-gray-100">
                    <div className="text-xs text-gray-400 font-semibold uppercase mb-2 flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-orange-500" />
                      Check Out
                    </div>
                    <div className="font-mono font-bold text-xl text-gray-900 tracking-tight">
                      {todayRecord?.outTime ? format(new Date(todayRecord.outTime), 'hh:mm') : '--:--'}
                      <span className="text-xs text-gray-400 ml-1 font-sans font-normal">
                        {todayRecord?.outTime ? format(new Date(todayRecord.outTime), 'aa') : ''}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
               <div className="grid grid-cols-2 gap-5">
                <button
                  disabled={!!todayRecord?.inTime}
                  onClick={() => handleAttendanceClick('in')}
                  className={`group relative overflow-hidden rounded-3xl p-6 flex flex-col items-center justify-center gap-4 transition-all duration-300 ${
                    todayRecord?.inTime 
                      ? 'bg-gray-100 cursor-not-allowed opacity-60' 
                      : 'bg-white shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 hover:-translate-y-1 active:translate-y-0 active:scale-95'
                  }`}
                >
                  <div className={`p-4 rounded-2xl transition-colors ${todayRecord?.inTime ? 'bg-gray-200' : 'bg-blue-50 group-hover:bg-blue-100'}`}>
                    <Camera size={32} className={todayRecord?.inTime ? 'text-gray-400' : 'text-blue-600'} />
                  </div>
                  <span className={`font-bold ${todayRecord?.inTime ? 'text-gray-400' : 'text-gray-900'}`}>Check In</span>
                </button>

                <button
                  disabled={!todayRecord?.inTime || !!todayRecord?.outTime}
                  onClick={() => handleAttendanceClick('out')}
                  className={`group relative overflow-hidden rounded-3xl p-6 flex flex-col items-center justify-center gap-4 transition-all duration-300 ${
                    !todayRecord?.inTime || !!todayRecord?.outTime
                      ? 'bg-gray-100 cursor-not-allowed opacity-60' 
                      : 'bg-white shadow-lg shadow-orange-500/10 hover:shadow-orange-500/20 hover:-translate-y-1 active:translate-y-0 active:scale-95'
                  }`}
                >
                  <div className={`p-4 rounded-2xl transition-colors ${!todayRecord?.inTime || !!todayRecord?.outTime ? 'bg-gray-200' : 'bg-orange-50 group-hover:bg-orange-100'}`}>
                    <LogOut size={32} className={!todayRecord?.inTime || !!todayRecord?.outTime ? 'text-gray-400' : 'text-orange-600'} />
                  </div>
                  <span className={`font-bold ${!todayRecord?.inTime || !!todayRecord?.outTime ? 'text-gray-400' : 'text-gray-900'}`}>Check Out</span>
                </button>
              </div>

              {/* Location Tag */}
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 flex items-center gap-3 border border-gray-100">
                <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                  <MapPin size={20} />
                </div>
                <div>
                  <div className="text-xs text-gray-500 font-medium">Current Location</div>
                  <div className="text-sm font-bold text-gray-900">Headquarters, NY</div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div 
              key="history"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-bold text-gray-900">History</h2>
                <div className="text-sm text-gray-500">Last 30 Days</div>
              </div>
              
              <div className="space-y-3">
                {myRecords.slice().reverse().map((record, index) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    key={record.id} 
                    className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shadow-sm ${
                        record.status === 'present' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {format(new Date(record.date), 'dd')}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">
                          {format(new Date(record.date), 'EEEE')}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {format(new Date(record.date), 'MMMM yyyy')}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                       <div className="text-sm font-mono font-medium text-gray-900">
                        {record.inTime ? format(new Date(record.inTime), 'HH:mm') : '-'}
                        <span className="text-gray-400 mx-1">→</span>
                        {record.outTime ? format(new Date(record.outTime), 'HH:mm') : '-'}
                      </div>
                      <div className={`text-xs font-medium mt-1 ${
                        record.status === 'present' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {record.status === 'present' ? '9h 00m' : 'Absent'}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              
              {myRecords.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <Calendar size={48} className="mx-auto mb-3 opacity-20" />
                  <p>No attendance records found.</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'profile' && (
            <motion.div 
              key="profile"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.3 }}
              className="space-y-6 pt-4"
            >
               <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50 flex flex-col items-center relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-blue-500 to-blue-600" />
                 
                 <div className="w-28 h-28 rounded-full bg-white p-1 relative z-10 mt-8 mb-4 shadow-lg">
                   <div className="w-full h-full rounded-full overflow-hidden bg-gray-200">
                     {currentUser.avatar ? (
                       <img src={currentUser.avatar} alt="Profile" className="w-full h-full object-cover" />
                     ) : (
                       <User size={40} className="text-gray-400 m-auto mt-8" />
                     )}
                   </div>
                 </div>
                 
                 <h3 className="text-2xl font-bold text-gray-900">{currentUser.name}</h3>
                 <p className="text-gray-500 mb-6">{currentUser.role.toUpperCase()}</p>
                 
                 <div className="w-full grid grid-cols-3 divide-x divide-gray-100 border-t border-gray-100 pt-6">
                   <div className="text-center px-2">
                     <div className="text-lg font-bold text-gray-900">{myRecords.length}</div>
                     <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Days</div>
                   </div>
                   <div className="text-center px-2">
                     <div className="text-lg font-bold text-gray-900">98%</div>
                     <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Rate</div>
                   </div>
                   <div className="text-center px-2">
                     <div className="text-lg font-bold text-gray-900">0</div>
                     <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Late</div>
                   </div>
                 </div>
               </div>

               <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                 {[
                   { label: 'Email Address', value: currentUser.email },
                   { label: 'Department', value: currentUser.department },
                   { label: 'Phone Number', value: currentUser.phone },
                   { label: 'Employee ID', value: `#${currentUser.id.substring(0,8)}` },
                   { label: 'Joined On', value: format(new Date(currentUser.joinDate), 'MMM dd, yyyy') },
                 ].map((item, i) => (
                   <div key={i} className="flex justify-between items-center p-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                     <span className="text-sm text-gray-500 font-medium">{item.label}</span>
                     <span className="text-sm text-gray-900 font-semibold">{item.value}</span>
                   </div>
                 ))}
               </div>
               
               <button 
                 onClick={logout}
                 className="w-full py-4 rounded-2xl bg-red-50 text-red-600 font-bold hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
               >
                 <LogOut size={20} />
                 Sign Out
               </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-gray-200/50 flex justify-around p-4 pb-8 z-20 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
        <NavButton 
          active={activeTab === 'overview'} 
          onClick={() => setActiveTab('overview')} 
          icon={<Home size={24} />} 
          label="Home" 
        />
        <NavButton 
          active={activeTab === 'history'} 
          onClick={() => setActiveTab('history')} 
          icon={<History size={24} />} 
          label="History" 
        />
        <NavButton 
          active={activeTab === 'profile'} 
          onClick={() => setActiveTab('profile')} 
          icon={<User size={24} />} 
          label="Profile" 
        />
      </div>

      {/* Camera Modal */}
      <AnimatePresence>
        {showCamera && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-50 flex flex-col"
          >
            <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                className="w-full h-full object-cover"
                videoConstraints={{ facingMode: "user" }}
              />
              <div className="absolute top-0 left-0 right-0 p-8 bg-gradient-to-b from-black/80 to-transparent flex justify-between items-start">
                 <div className="text-white">
                   <h3 className="font-bold text-lg">Verify Attendance</h3>
                   <p className="text-white/70 text-sm">Please position your face in the frame</p>
                 </div>
                 <button 
                  onClick={() => setShowCamera(false)}
                  className="text-white/80 hover:text-white bg-white/10 backdrop-blur-md p-2 rounded-full"
                >
                  <XCircle size={32} />
                </button>
              </div>
              
              {/* Face Guide Overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-64 h-80 border-2 border-white/30 rounded-[40px] relative">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-500 rounded-tl-2xl -mt-1 -ml-1" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-500 rounded-tr-2xl -mt-1 -mr-1" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-500 rounded-bl-2xl -mb-1 -ml-1" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-500 rounded-br-2xl -mb-1 -mr-1" />
                </div>
              </div>
            </div>
            
            <div className="p-8 bg-black flex flex-col items-center pb-12 gap-4">
              <button 
                onClick={capture}
                className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center bg-white/20 active:bg-white/50 transition-all active:scale-95"
              >
                <div className="w-16 h-16 bg-white rounded-full shadow-[0_0_20px_rgba(255,255,255,0.5)]" />
              </button>
              <p className="text-white/50 text-sm">Tap to capture</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const NavButton = ({ active, onClick, icon, label }: any) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center gap-1.5 transition-all duration-300 relative ${
      active ? 'text-blue-600 -translate-y-1' : 'text-gray-400 hover:text-gray-600'
    }`}
  >
    <div className={`p-1 rounded-xl transition-colors ${active ? 'bg-blue-50' : 'bg-transparent'}`}>
      {React.cloneElement(icon, { strokeWidth: active ? 2.5 : 2, size: 24 })}
    </div>
    <span className="text-[10px] font-bold tracking-wide">{label}</span>
    {active && (
      <motion.div 
        layoutId="activeTab"
        className="absolute -bottom-2 w-1 h-1 bg-blue-600 rounded-full"
      />
    )}
  </button>
);
