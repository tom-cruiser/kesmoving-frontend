import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Truck, Calendar, MapPin, MessageCircle, Home, LogOut, Bell, User } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../services/api';
import { useNotificationStore } from '../../store/notificationStore';
import { disconnectAll } from '../../services/socket';

const navLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: Home },
  { to: '/bookings', label: 'My Bookings', icon: Calendar },
  { to: '/chat', label: 'Support', icon: MessageCircle },
];

export default function ClientLayout() {
  const { user, logout } = useAuthStore();
  const { unreadCount } = useNotificationStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try { await authApi.logout(); } catch {}
    disconnectAll();
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navigation */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary-600 text-white p-1.5 rounded-lg">
              <Truck size={20} />
            </div>
            <span className="font-bold text-lg text-slate-900">Kesmoving</span>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? 'bg-primary-50 text-primary-600' : 'text-slate-600 hover:bg-slate-100'
                  }`
                }
              >
                <Icon size={16} />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/bookings/new')}
              className="btn-primary text-sm hidden sm:flex items-center gap-1.5"
            >
              <Calendar size={15} />
              Book a Move
            </button>
            <div className="relative">
              <button className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40">
        <div className="flex">
          {navLinks.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center gap-1 py-2 text-xs font-medium transition-colors ${
                  isActive ? 'text-primary-600' : 'text-slate-500'
                }`
              }
            >
              <Icon size={20} />
              {label}
            </NavLink>
          ))}
          <button
            onClick={() => navigate('/bookings/new')}
            className="flex-1 flex flex-col items-center gap-1 py-2 text-xs font-medium text-slate-500"
          >
            <Calendar size={20} />
            Book
          </button>
        </div>
      </nav>
    </div>
  );
}
