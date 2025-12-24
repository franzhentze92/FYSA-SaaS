import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, Mail, Lock, ArrowLeft, Loader2 } from 'lucide-react';
import { authenticateUser, setCurrentUser, initializeUsers } from '@/services/userService';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Inicializar usuarios al cargar la página
  useEffect(() => {
    initializeUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!formData.email || !formData.password) {
      setError('Por favor, completa todos los campos');
      setIsLoading(false);
      return;
    }

    try {
      // Autenticar usuario (now async)
      const user = await authenticateUser(formData.email, formData.password);
      
      if (user) {
        // Guardar usuario en sesión
        setCurrentUser(user);
        
        // Redirigir al dashboard
        navigate('/dashboard');
      } else {
        setError('Email o contraseña incorrectos');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Error al iniciar sesión. Por favor, intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8" style={{ background: 'linear-gradient(to bottom right, rgba(219, 127, 58, 0.1), rgba(219, 127, 58, 0.15), rgba(59, 130, 246, 0.1))' }}>
      <div className="max-w-md w-full">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-gray-600 transition-colors"
            onMouseEnter={(e) => e.currentTarget.style.color = '#db7f3a'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#4b5563'}
          >
            <ArrowLeft size={16} />
            Volver al inicio
          </Link>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
          {/* Card Header */}
          <div className="px-8 py-6 text-center bg-white border-b border-gray-200">
            <img 
              src="/LOGO_PNG.png" 
              alt="FYSA" 
              className="h-12 w-auto mx-auto mb-3"
            />
            <h2 className="text-2xl font-bold text-gray-900">
              Iniciar Sesión
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Accede a tu cuenta para gestionar tus operaciones
            </p>
          </div>

          {/* Card Body */}
          <div className="px-8 py-8">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-5">
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      disabled={isLoading}
                      className="block w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ '--tw-ring-color': '#db7f3a' } as React.CSSProperties}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#db7f3a';
                        e.currentTarget.style.boxShadow = '0 0 0 2px rgba(219, 127, 58, 0.5)';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = '#d1d5db';
                        e.currentTarget.style.boxShadow = '';
                      }}
                      placeholder="tu@email.com"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                    Contraseña
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      disabled={isLoading}
                      className="block w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ '--tw-ring-color': '#db7f3a' } as React.CSSProperties}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#db7f3a';
                        e.currentTarget.style.boxShadow = '0 0 0 2px rgba(219, 127, 58, 0.5)';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = '#d1d5db';
                        e.currentTarget.style.boxShadow = '';
                      }}
                      placeholder="Tu contraseña"
                    />
                  </div>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-xl shadow-lg text-base font-semibold text-white transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  style={{ backgroundColor: '#db7f3a' }}
                  onMouseEnter={(e) => !isLoading && (e.currentTarget.style.backgroundColor = '#c46f2f')}
                  onMouseLeave={(e) => !isLoading && (e.currentTarget.style.backgroundColor = '#db7f3a')}
                  onFocus={(e) => e.currentTarget.style.boxShadow = '0 0 0 3px rgba(219, 127, 58, 0.5)'}
                  onBlur={(e) => e.currentTarget.style.boxShadow = ''}
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Iniciando sesión...
                    </>
                  ) : (
                    <>
                      <LogIn size={20} />
                      Iniciar Sesión
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
