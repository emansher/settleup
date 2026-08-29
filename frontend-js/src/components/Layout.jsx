import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, User, LayoutDashboard } from 'lucide-react';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14 items-center">
            <Link to="/dashboard" className="flex items-center gap-2 font-bold text-brand-700 text-lg">
              <span className="text-2xl">💰</span> SettleUp
            </Link>
            <div className="flex items-center gap-4">
              <Link to="/dashboard" className="flex items-center gap-1 text-sm text-gray-600 hover:text-brand-600">
                <LayoutDashboard size={16} /> Dashboard
              </Link>
              <Link to="/profile" className="flex items-center gap-1 text-sm text-gray-600 hover:text-brand-600">
                <User size={16} /> {user?.name?.split(' ')[0]}
              </Link>
              <button onClick={handleLogout} className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-600">
                <LogOut size={16} /> Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
    </div>
  );
}
