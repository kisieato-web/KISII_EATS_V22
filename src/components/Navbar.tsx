import { Link, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

interface NavbarProps {
  title?: string;
  showBack?: boolean;
  backTo?: string;
}

export default function Navbar({ title = 'Kisii Eats', showBack, backTo = '/' }: NavbarProps) {
  const [open, setOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    setOpen(false);
    await signOut();
    navigate('/');
  };

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {showBack ? (
              <Link to={backTo} className="text-gray-600 text-lg">←</Link>
            ) : null}
            <Link to={user ? '/dashboard' : '/'} className="flex items-center gap-2">
              <div className="w-7 h-7 bg-primary-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs">KE</span>
              </div>
              <span className="font-display font-bold text-lg">{title}</span>
            </Link>
          </div>
          <button
            onClick={() => setOpen(!open)}
            className="p-2 text-gray-500"
            aria-label="Menu"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Dropdown menu */}
      {open && (
        <div className="fixed top-14 left-0 right-0 z-40 bg-white border-b border-gray-100 shadow-lg max-w-lg mx-auto">
          <div className="px-4 py-2">
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  onClick={() => setOpen(false)}
                  className="block py-3 text-gray-700 border-b border-gray-50 font-medium"
                >
                  🏠 Home
                </Link>
                <Link
                  to="/orders"
                  onClick={() => setOpen(false)}
                  className="block py-3 text-gray-700 border-b border-gray-50"
                >
                  📋 My Orders
                </Link>
                <Link
                  to="/profile"
                  onClick={() => setOpen(false)}
                  className="block py-3 text-gray-700 border-b border-gray-50"
                >
                  👤 Profile
                </Link>
                <button
                  onClick={handleSignOut}
                  className="block w-full text-left py-3 text-red-500"
                >
                  🚪 Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setOpen(false)}
                  className="block py-3 text-gray-700 border-b border-gray-50 font-medium"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setOpen(false)}
                  className="block py-3 text-gray-700 border-b border-gray-50"
                >
                  Create Account
                </Link>
                <Link
                  to="/restaurant/signup"
                  onClick={() => setOpen(false)}
                  className="block py-3 text-gray-700 border-b border-gray-50"
                >
                  🍽️ Partner Restaurant
                </Link>
                <Link
                  to="/rider/signup"
                  onClick={() => setOpen(false)}
                  className="block py-3 text-gray-700"
                >
                  🏍️ Become a Rider
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setOpen(false)}
        />
      )}
    </>
  );
}