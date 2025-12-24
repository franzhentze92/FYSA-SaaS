import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, ChevronDown, Home, ShoppingCart } from 'lucide-react';
import { getCurrentUser, setCurrentUser } from '@/services/userService';
import { useCart } from '@/contexts/CartContext';

interface PublicLayoutProps {
  children: React.ReactNode;
}

const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { getTotalItems } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [currentUser, setCurrentUserState] = useState(getCurrentUser());
  const cartItemsCount = getTotalItems();

  // Verificar estado de autenticación cuando cambia la ruta
  useEffect(() => {
    setCurrentUserState(getCurrentUser());
  }, [location.pathname]);

  // Cerrar menú de usuario al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (userMenuOpen && !target.closest('.user-menu-container')) {
        setUserMenuOpen(false);
      }
    };

    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [userMenuOpen]);

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentUserState(null);
    setUserMenuOpen(false);
    navigate('/');
  };

  const menuItems = [
    { name: 'Inicio', path: '/' },
    { name: 'Sobre Nosotros', path: '/sobre-nosotros' },
    { name: 'Servicios', path: '/servicios' },
    // { name: 'Tienda', path: '/tienda' }, // Hidden temporarily
    { name: 'Contáctanos', path: '/contactanos' },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <img 
                src="/LOGO_PNG.png" 
                alt="FYSA" 
                className="h-12 w-auto"
              />
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-8">
              {menuItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`text-sm font-medium transition-colors ${
                    location.pathname === item.path
                      ? 'text-[#db7f3a]'
                      : 'text-gray-700 hover:text-[#db7f3a]'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
              {/* Shopping Cart Icon - Hidden temporarily */}
              {/* <Link
                to="/carrito"
                className="relative p-2 text-gray-700 hover:text-[#db7f3a] transition-colors"
                title="Carrito de compras"
              >
                <ShoppingCart size={20} />
                {cartItemsCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {cartItemsCount > 9 ? '9+' : cartItemsCount}
                  </span>
                )}
              </Link> */}
              {currentUser ? (
                <div className="relative user-menu-container">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="px-4 py-2 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                    style={{ backgroundColor: '#db7f3a' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#c46f2f'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#db7f3a'}
                  >
                    Ir al Portal
                    <ChevronDown size={16} className={`transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                      <Link
                        to="/dashboard"
                        onClick={() => setUserMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Acceder al Portal
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                      >
                        <LogOut size={16} />
                        Cerrar Sesión
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to="/login"
                  className="px-4 py-2 text-white rounded-lg font-medium transition-colors"
                  style={{ backgroundColor: '#db7f3a' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#c46f2f'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#db7f3a'}
                >
                  Iniciar Sesión
                </Link>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-gray-700"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-200">
              <div className="flex flex-col gap-4">
                {menuItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`text-sm font-medium px-2 py-1 ${
                      location.pathname === item.path
                        ? 'text-[#db7f3a]'
                        : 'text-gray-700'
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
                {/* Shopping Cart Icon - Mobile - Hidden temporarily */}
                {/* <Link
                  to="/carrito"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 text-sm font-medium px-2 py-1 text-gray-700 relative"
                >
                  <ShoppingCart size={18} />
                  <span>Carrito de Compras</span>
                  {cartItemsCount > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {cartItemsCount > 9 ? '9+' : cartItemsCount}
                    </span>
                  )}
                </Link> */}
                {currentUser ? (
                  <>
                    <Link
                      to="/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-4 py-2 text-white rounded-lg font-medium text-center"
                      style={{ backgroundColor: '#db7f3a' }}
                    >
                      Ir al Portal
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout();
                        setMobileMenuOpen(false);
                      }}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg font-medium text-center flex items-center justify-center gap-2"
                    >
                      <LogOut size={16} />
                      Cerrar Sesión
                    </button>
                  </>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-2 text-white rounded-lg font-medium text-center"
                    style={{ backgroundColor: '#db7f3a' }}
                  >
                    Iniciar Sesión
                  </Link>
                )}
              </div>
            </div>
          )}
        </nav>
      </header>

      {/* Main Content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="bg-white text-gray-900 py-12 px-4 mt-20 border-t border-gray-200">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img 
                  src="/LOGO_PNG.png" 
                  alt="FYSA" 
                  className="h-8 w-auto"
                />
              </div>
              <p className="text-gray-600">
                Plataforma integral para la gestión y monitoreo de granos, servicios y documentación.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-gray-900">Enlaces Rápidos</h3>
              <ul className="space-y-2 text-gray-600">
                {menuItems.map((item) => (
                  <li key={item.path}>
                    <Link to={item.path} className="hover:text-[#db7f3a] transition-colors">
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-gray-900">Contacto</h3>
              <ul className="space-y-2 text-gray-600">
                <li>info@fysa-gt.com</li>
                <li>+502 1234-5678</li>
                <li>35 Calle A 9-44, Z-11 Colonia Las Charcas, Guatemala</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 mt-8 pt-8 text-center text-gray-600">
            <p>&copy; {new Date().getFullYear()} FYSA. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;

