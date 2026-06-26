import { Link, useLocation } from 'react-router-dom';
import { Home, ShoppingCart, ClipboardList, User } from 'lucide-react';

export default function BottomNav() {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  const tabs = [
    { path: '/dashboard', icon: Home, label: 'Home' },
    { path: '/cart', icon: ShoppingCart, label: 'Cart' },
    { path: '/orders', icon: ClipboardList, label: 'Orders' },
    { path: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50 safe-bottom">
      <div className="max-w-lg mx-auto flex justify-around py-2">
        {tabs.map(({ path, icon: Icon, label }) => (
          <Link
            key={path}
            to={path}
            className={`flex flex-col items-center gap-1 px-3 py-1 text-xs ${
              isActive(path) ? 'text-primary-500' : 'text-gray-400'
            }`}
          >
            <Icon size={20} />
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
