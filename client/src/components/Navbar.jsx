import React, { useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Plane, User, LogOut, Menu } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition">
            <Plane className="h-8 w-8 rotate-[-45deg]" />
            <span className="text-2xl font-bold tracking-tight">SkyBook</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              to="/" 
              className={`text-sm font-medium transition-colors hover:text-blue-600 ${isActive('/') ? 'text-blue-600' : 'text-slate-600'}`}
            >
              Find Flights
            </Link>
            
            {user ? (
              <div className="flex items-center space-x-6">
                <Link 
                  to="/dashboard" 
                  className={`text-sm font-medium transition-colors hover:text-blue-600 ${isActive('/dashboard') ? 'text-blue-600' : 'text-slate-600'}`}
                >
                  My Bookings
                </Link>
                {user.isAdmin && (
                  <Link 
                    to="/add-flight" 
                    className={`text-sm font-medium transition-colors hover:text-blue-600 ${isActive('/add-flight') ? 'text-blue-600' : 'text-slate-600'}`}
                  >
                    Add Flight
                  </Link>
                )}
                <div className="flex items-center space-x-4 pl-6 border-l border-slate-200">
                  <div className="flex items-center space-x-2 text-slate-700">
                    <div className="bg-blue-100 p-2 rounded-full">
                      <User className="h-4 w-4 text-blue-600" />
                    </div>
                    <span className="text-sm font-medium">{user.name}</span>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="flex items-center space-x-1 text-slate-500 hover:text-red-600 transition-colors text-sm font-medium"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link 
                  to="/login" 
                  className="text-slate-600 hover:text-blue-600 font-medium text-sm transition-colors"
                >
                  Log in
                </Link>
                <Link 
                  to="/register" 
                  className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm hover:shadow"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button (Placeholder) */}
          <button className="md:hidden text-slate-600">
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
