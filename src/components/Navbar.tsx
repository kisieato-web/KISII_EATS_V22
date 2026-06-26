import { Link } from 'react-router-dom';
import { Menu, X, Bell } from 'lucide-react';
import { useState } from 'react';

interface NavbarProps {
  title?: string;
  showBack?: boolean;
  backTo?: string;
}

export default function Navbar({ title = 'Kisii Eats', showBack, backTo = '/' }: NavbarProps) {
  const [open, setOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-100">
      <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {showBack && (
            <Link to={backTo} className="text-gray-600">&larr;</Link>
          )}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-primary-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">KE</span>
            </div>
            <span className="font-display font-bold text-lg">{title}</span>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 text-gray-500"><Bell size={20} /></button>
          <button onClick={() => setOpen(!open)} className="p-2 text-gray-500">
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
    </nav>
  );
}
