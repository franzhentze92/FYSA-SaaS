import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Shield, Bug, Warehouse, Ship, ClipboardCheck, CheckCircle2, TrendingUp, Users, Award, Zap, Building2, Home, FlaskConical, FileText, BarChart3, Activity, DollarSign, Package, Thermometer, Map } from 'lucide-react';

const Landing: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative py-24 px-4 overflow-hidden" style={{ backgroundColor: '#db7f3a', color: 'white' }}>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-block mb-4 px-4 py-2 bg-blue-900/30 backdrop-blur-sm rounded-full text-sm font-medium border border-blue-900/20">
                🏆 Líder en Control de Plagas y Fumigación en Guatemala
              </div>
              <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                Expertos en Control
                <br />
                <span style={{ color: 'rgba(255, 255, 255, 0.9)' }}>de Plagas y Fumigación</span>
              </h1>
              <p className="text-xl md:text-2xl mb-8 leading-relaxed" style={{ color: 'rgba(255, 255, 255, 0.95)' }}>
                Más de 30 años protegiendo negocios, hogares y granos con servicios profesionales de control de plagas, fumigación y tratamientos especializados. Certificados profesionales y cumplimiento de normativas internacionales.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/contactanos"
                  className="px-8 py-4 bg-white rounded-lg font-semibold hover:opacity-90 transition-all transform hover:scale-105 flex items-center justify-center gap-2 shadow-lg"
                  style={{ color: '#db7f3a' }}
                >
                  Solicitar Cotización
                  <ArrowRight size={20} />
                </Link>
                <Link
                  to="/servicios"
                  className="px-8 py-4 bg-blue-900/80 border-2 border-blue-900 text-white rounded-lg font-semibold hover:bg-blue-900 transition-all flex items-center justify-center backdrop-blur-sm"
                >
                  Ver Nuestros Servicios
                </Link>
              </div>
            </div>
            <div className="relative">
              {/* Pest control images */}
              <div className="relative">
                <img 
                  src="/images landing page/3e7769a43b7da6407e56d23d40df5ac6.jpg" 
                  alt="Control de Plagas Profesional" 
                  className="rounded-2xl shadow-2xl w-full h-auto object-cover"
                />
                <div className="absolute -bottom-4 -right-4 bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-xl border border-white/20">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={20} style={{ color: '#db7f3a' }} />
                    <span className="text-sm font-bold text-gray-900">+30 años de experiencia</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Overview */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Nuestros Servicios de Control de Plagas
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Soluciones especializadas para proteger tus instalaciones, granos y productos almacenados
            </p>
          </div>

          {/* Services Images Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            {/* Card 1: Servicios Profesionales */}
            <div className="relative rounded-2xl overflow-hidden shadow-2xl group cursor-pointer transform transition-all duration-300 hover:-translate-y-2">
              <img 
                src="/images landing page/ChatGPT Image Dec 22, 2025, 03_15_36 PM.png" 
                alt="Servicios de Fumigación y Control de Plagas" 
                className="w-full h-96 object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20 z-10"></div>
              <div className="absolute inset-0 z-20 flex flex-col justify-end p-8 text-white">
                <div className="mb-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 backdrop-blur-sm rounded-full text-sm font-medium mb-4" style={{ backgroundColor: 'rgba(219, 127, 58, 0.9)' }}>
                    <Award className="w-4 h-4" />
                    Más de 30 años de experiencia
                  </div>
                </div>
                <h3 className="text-3xl font-bold mb-3 transition-colors" style={{ color: 'rgba(255, 255, 255, 0.9)' }} onMouseEnter={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)'} onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)'}>
                  Servicios Profesionales
                </h3>
                <p className="text-lg mb-6 leading-relaxed" style={{ color: 'rgba(255, 255, 255, 0.95)' }}>
                  Técnicos certificados y métodos seguros para máxima efectividad y seguridad
                </p>
                <div className="flex flex-wrap gap-3 mb-4">
                  <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-lg text-sm">✓ Técnicos Certificados</span>
                  <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-lg text-sm">✓ Métodos Seguros</span>
                  <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-lg text-sm">✓ Máxima Efectividad</span>
                </div>
                <Link
                  to="/contactanos"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white rounded-lg font-semibold transition-all transform hover:scale-105 w-fit group-hover:shadow-xl"
                  style={{ color: '#db7f3a' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(219, 127, 58, 0.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                >
                  Solicitar Servicio
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Card 2: Protección Integral */}
            <div className="relative rounded-2xl overflow-hidden shadow-2xl group cursor-pointer transform transition-all duration-300 hover:-translate-y-2">
              <img 
                src="/images landing page/rodent_control_in_commercial.jpg" 
                alt="Control de Plagas Industrial" 
                className="w-full h-96 object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20 z-10"></div>
              <div className="absolute inset-0 z-20 flex flex-col justify-end p-8 text-white">
                <div className="mb-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 backdrop-blur-sm rounded-full text-sm font-medium mb-4" style={{ backgroundColor: 'rgba(219, 127, 58, 0.9)' }}>
                    <Building2 className="w-4 h-4" />
                    Cobertura Nacional
                  </div>
                </div>
                <h3 className="text-3xl font-bold mb-3 transition-colors" style={{ color: 'rgba(255, 255, 255, 0.9)' }} onMouseEnter={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)'} onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)'}>
                  Protección Integral
                </h3>
                <p className="text-lg mb-6 leading-relaxed" style={{ color: 'rgba(255, 255, 255, 0.95)' }}>
                  Para industrias, comercios y residencias en toda Guatemala
                </p>
                <div className="flex flex-wrap gap-3 mb-4">
                  <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-lg text-sm">🏭 Industrias</span>
                  <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-lg text-sm">🏢 Comercios</span>
                  <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-lg text-sm">🏠 Residencias</span>
                </div>
                <Link
                  to="/servicios"
                  className="inline-flex items-center gap-2 px-6 py-3 text-white rounded-lg font-semibold transition-all transform hover:scale-105 w-fit group-hover:shadow-xl"
                  style={{ backgroundColor: '#db7f3a' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#c46f2f'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#db7f3a'}
                >
                  Conocer Más
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Control de Plagas Residencial */}
            <div className="p-8 border-2 border-gray-200 rounded-xl hover:shadow-xl transition-all group bg-white" onMouseEnter={(e) => e.currentTarget.style.borderColor = '#db7f3a'} onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}>
              <div className="w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-all" style={{ backgroundColor: 'rgba(219, 127, 58, 0.1)' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#db7f3a'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(219, 127, 58, 0.1)'}>
                <Home size={32} style={{ color: '#db7f3a' }} onMouseEnter={(e) => e.currentTarget.style.color = 'white'} onMouseLeave={(e) => e.currentTarget.style.color = '#db7f3a'} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Control de Plagas Residencial
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} style={{ color: '#db7f3a' }} />
                  Control y fumigación en casas, apartamentos y condominios
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} style={{ color: '#db7f3a' }} />
                  Programas preventivos y correctivos
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} style={{ color: '#db7f3a' }} />
                  Atención a infestaciones activas y mantenimiento periódico
                </li>
              </ul>
            </div>

            {/* Control de Plagas Comercial */}
            <div className="p-8 border-2 border-gray-200 rounded-xl hover:shadow-xl transition-all group bg-white" onMouseEnter={(e) => e.currentTarget.style.borderColor = '#db7f3a'} onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}>
              <div className="w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-all" style={{ backgroundColor: 'rgba(219, 127, 58, 0.1)' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#db7f3a'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(219, 127, 58, 0.1)'}>
                <Home size={32} style={{ color: '#db7f3a' }} onMouseEnter={(e) => e.currentTarget.style.color = 'white'} onMouseLeave={(e) => e.currentTarget.style.color = '#db7f3a'} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Control de Plagas Residencial
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} style={{ color: '#db7f3a' }} />
                  Control y fumigación en casas, apartamentos y condominios
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} style={{ color: '#db7f3a' }} />
                  Programas preventivos y correctivos
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} style={{ color: '#db7f3a' }} />
                  Atención a infestaciones activas y mantenimiento periódico
                </li>
              </ul>
            </div>

            {/* Control de Plagas Comercial */}
            <div className="p-8 border-2 border-gray-200 rounded-xl hover:shadow-xl transition-all group bg-white" onMouseEnter={(e) => e.currentTarget.style.borderColor = '#db7f3a'} onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}>
              <div className="w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-all" style={{ backgroundColor: 'rgba(219, 127, 58, 0.1)' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#db7f3a'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(219, 127, 58, 0.1)'}>
                <Building2 size={32} style={{ color: '#db7f3a' }} onMouseEnter={(e) => e.currentTarget.style.color = 'white'} onMouseLeave={(e) => e.currentTarget.style.color = '#db7f3a'} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Control de Plagas Comercial
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} style={{ color: '#db7f3a' }} />
                  Oficinas corporativas
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} style={{ color: '#db7f3a' }} />
                  Restaurantes, cafeterías y food courts
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} style={{ color: '#db7f3a' }} />
                  Hoteles, hospitales y clínicas
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} style={{ color: '#db7f3a' }} />
                  Centros comerciales y retail
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} style={{ color: '#db7f3a' }} />
                  Colegios y universidades
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} style={{ color: '#db7f3a' }} />
                  Programas bajo normas de higiene y auditorías
                </li>
              </ul>
            </div>

            {/* Control de Plagas Industrial */}
            <div className="p-8 border-2 border-gray-200 rounded-xl hover:shadow-xl transition-all group bg-white" onMouseEnter={(e) => e.currentTarget.style.borderColor = '#db7f3a'} onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}>
              <div className="w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-all" style={{ backgroundColor: 'rgba(219, 127, 58, 0.1)' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#db7f3a'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(219, 127, 58, 0.1)'}>
                <Warehouse size={32} style={{ color: '#db7f3a' }} onMouseEnter={(e) => e.currentTarget.style.color = 'white'} onMouseLeave={(e) => e.currentTarget.style.color = '#db7f3a'} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Control de Plagas Industrial
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} style={{ color: '#db7f3a' }} />
                  Plantas industriales y fábricas
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} style={{ color: '#db7f3a' }} />
                  Bodegas y centros de distribución
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} style={{ color: '#db7f3a' }} />
                  Industrias alimentarias y agroindustriales
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} style={{ color: '#db7f3a' }} />
                  Programas especiales para certificaciones (HACCP, BPM, ISO)
                </li>
              </ul>
            </div>

            {/* Control de Plagas en Granos Almacenados */}
            <div className="p-8 border-2 border-gray-200 rounded-xl hover:shadow-xl transition-all group bg-white" onMouseEnter={(e) => e.currentTarget.style.borderColor = '#db7f3a'} onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}>
              <div className="w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-all" style={{ backgroundColor: 'rgba(219, 127, 58, 0.1)' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#db7f3a'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(219, 127, 58, 0.1)'}>
                <ClipboardCheck size={32} style={{ color: '#db7f3a' }} onMouseEnter={(e) => e.currentTarget.style.color = 'white'} onMouseLeave={(e) => e.currentTarget.style.color = '#db7f3a'} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Control de Plagas en Granos Almacenados
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} style={{ color: '#db7f3a' }} />
                  Control de gorgojos, polillas y escarabajos
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} style={{ color: '#db7f3a' }} />
                  Tratamientos en silos, bodegas y sacos
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} style={{ color: '#db7f3a' }} />
                  Fumigación de granos (maíz, arroz, frijol, trigo, sorgo, café, cacao)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} style={{ color: '#db7f3a' }} />
                  Programas preventivos y monitoreo
                </li>
              </ul>
            </div>

            {/* Tratamiento de Vehículos y Contenedores */}
            <div className="p-8 border-2 border-gray-200 rounded-xl hover:shadow-xl transition-all group bg-white" onMouseEnter={(e) => e.currentTarget.style.borderColor = '#db7f3a'} onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}>
              <div className="w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-all" style={{ backgroundColor: 'rgba(219, 127, 58, 0.1)' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#db7f3a'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(219, 127, 58, 0.1)'}>
                <Ship size={32} style={{ color: '#db7f3a' }} onMouseEnter={(e) => e.currentTarget.style.color = 'white'} onMouseLeave={(e) => e.currentTarget.style.color = '#db7f3a'} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Tratamiento de Vehículos y Contenedores
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} style={{ color: '#db7f3a' }} />
                  Tratamiento fitosanitario de contenedores de carga
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} style={{ color: '#db7f3a' }} />
                  Control de plagas en camiones, furgones y vehículos de transporte
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} style={{ color: '#db7f3a' }} />
                  Prevención de contaminación cruzada en logística y exportación
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} style={{ color: '#db7f3a' }} />
                  Cumplimiento de requisitos sanitarios para transporte de mercancías
                </li>
              </ul>
            </div>

            {/* Control de Roedores */}
            <div className="p-8 border-2 border-gray-200 rounded-xl hover:shadow-xl transition-all group bg-white" onMouseEnter={(e) => e.currentTarget.style.borderColor = '#db7f3a'} onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}>
              <div className="w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-all" style={{ backgroundColor: 'rgba(219, 127, 58, 0.1)' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#db7f3a'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(219, 127, 58, 0.1)'}>
                <Bug size={32} style={{ color: '#db7f3a' }} onMouseEnter={(e) => e.currentTarget.style.color = 'white'} onMouseLeave={(e) => e.currentTarget.style.color = '#db7f3a'} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Control de Roedores
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} style={{ color: '#db7f3a' }} />
                  Control de ratas y ratones
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} style={{ color: '#db7f3a' }} />
                  Instalación de trampas, cebaderos y sistemas de monitoreo
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} style={{ color: '#db7f3a' }} />
                  Sellado de puntos de ingreso (exclusión)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} style={{ color: '#db7f3a' }} />
                  Programas continuos para industria y comercio
                </li>
              </ul>
            </div>

            {/* Control de Insectos Rastreros */}
            <div className="p-8 border-2 border-gray-200 rounded-xl hover:shadow-xl transition-all group bg-white" onMouseEnter={(e) => e.currentTarget.style.borderColor = '#db7f3a'} onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}>
              <div className="w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-all" style={{ backgroundColor: 'rgba(219, 127, 58, 0.1)' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#db7f3a'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(219, 127, 58, 0.1)'}>
                <Shield size={32} style={{ color: '#db7f3a' }} onMouseEnter={(e) => e.currentTarget.style.color = 'white'} onMouseLeave={(e) => e.currentTarget.style.color = '#db7f3a'} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Control de Insectos Rastreros
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} style={{ color: '#db7f3a' }} />
                  Cucarachas
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} style={{ color: '#db7f3a' }} />
                  Hormigas
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} style={{ color: '#db7f3a' }} />
                  Chinches
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} style={{ color: '#db7f3a' }} />
                  Arañas
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} style={{ color: '#db7f3a' }} />
                  Alacranes
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} style={{ color: '#db7f3a' }} />
                  Pulgas y garrapatas
                </li>
              </ul>
            </div>

            {/* Control de Insectos Voladores */}
            <div className="p-8 border-2 border-gray-200 rounded-xl hover:shadow-xl transition-all group bg-white" onMouseEnter={(e) => e.currentTarget.style.borderColor = '#db7f3a'} onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}>
              <div className="w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-all" style={{ backgroundColor: 'rgba(219, 127, 58, 0.1)' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#db7f3a'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(219, 127, 58, 0.1)'}>
                <Zap size={32} style={{ color: '#db7f3a' }} onMouseEnter={(e) => e.currentTarget.style.color = 'white'} onMouseLeave={(e) => e.currentTarget.style.color = '#db7f3a'} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Control de Insectos Voladores
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} style={{ color: '#db7f3a' }} />
                  Moscas
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} style={{ color: '#db7f3a' }} />
                  Mosquitos
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} style={{ color: '#db7f3a' }} />
                  Zancudos
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} style={{ color: '#db7f3a' }} />
                  Polillas
                </li>
              </ul>
            </div>

            {/* Control de Termitas */}
            <div className="p-8 border-2 border-gray-200 rounded-xl hover:shadow-xl transition-all group bg-white" onMouseEnter={(e) => e.currentTarget.style.borderColor = '#db7f3a'} onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}>
              <div className="w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-all" style={{ backgroundColor: 'rgba(219, 127, 58, 0.1)' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#db7f3a'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(219, 127, 58, 0.1)'}>
                <FlaskConical size={32} style={{ color: '#db7f3a' }} onMouseEnter={(e) => e.currentTarget.style.color = 'white'} onMouseLeave={(e) => e.currentTarget.style.color = '#db7f3a'} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Control de Termitas
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} style={{ color: '#db7f3a' }} />
                  Tratamientos preventivos y curativos
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} style={{ color: '#db7f3a' }} />
                  Protección de estructuras de madera
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} style={{ color: '#db7f3a' }} />
                  Inspecciones técnicas y planes a largo plazo
                </li>
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 px-4" style={{ background: 'linear-gradient(to bottom right, rgba(219, 127, 58, 0.1), rgba(219, 127, 58, 0.15))' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              ¿Por Qué Elegir FYSA?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Más de una década de experiencia en control de plagas y protección de granos
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg" style={{ backgroundColor: '#db7f3a' }}>
                <Award className="text-white" size={40} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Certificaciones</h3>
              <p className="text-gray-600">Certificados profesionales y cumplimiento de normativas internacionales</p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Users className="text-white" size={40} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Experiencia</h3>
              <p className="text-gray-600">Equipo de técnicos especializados con años de experiencia</p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg" style={{ backgroundColor: '#db7f3a' }}>
                <FlaskConical className="text-white" size={40} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Métodos Seguros</h3>
              <p className="text-gray-600">Uso de métodos seguros y técnicas profesionales para el control de plagas</p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Shield className="text-white" size={40} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Garantía</h3>
              <p className="text-gray-600">Resultados garantizados y seguimiento post-servicio</p>
            </div>
          </div>
        </div>
      </section>

      {/* Client Portal Section */}
      <section className="py-20 px-4" style={{ background: 'linear-gradient(to bottom right, #f9fafb, rgba(219, 127, 58, 0.1))' }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <div className="bg-gradient-to-br from-blue-50 to-orange-100 rounded-2xl p-6 shadow-2xl">
                <div className="bg-white rounded-lg overflow-hidden shadow-xl border border-blue-900/20">
                  {/* Browser Bar */}
                  <div className="bg-blue-900/10 px-4 py-2.5 flex items-center gap-2 border-b border-blue-900/20">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <div className="flex-1 text-center">
                      <div className="inline-flex items-center gap-2 bg-white px-3 py-1 rounded-md text-xs text-blue-900 border border-blue-900/30">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: '#db7f3a' }}></div>
                        <span className="font-medium">portal.fysa.com</span>
                      </div>
                    </div>
                  </div>
                  
                    {/* Mockup Content */}
                    <div className="p-6 bg-blue-50/50">
                      {/* Header */}
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-lg font-bold text-blue-900 flex items-center gap-2">
                            <ClipboardCheck size={20} style={{ color: '#db7f3a' }} />
                            Reportes y Facturas
                          </h3>
                        </div>
                        <p className="text-xs text-blue-800/70">Visualiza tus reportes y su estado de facturación</p>
                      </div>

                      {/* Stats Cards */}
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="bg-white rounded-lg border border-blue-900/20 p-3">
                          <div className="text-xs text-blue-800/70 mb-1">Total</div>
                          <div className="text-xl font-bold text-blue-900">24</div>
                        </div>
                        <div className="rounded-lg border p-3" style={{ backgroundColor: 'rgba(219, 127, 58, 0.1)', borderColor: 'rgba(219, 127, 58, 0.3)' }}>
                          <div className="text-xs mb-1" style={{ color: 'rgba(219, 127, 58, 0.8)' }}>Facturados</div>
                          <div className="text-xl font-bold" style={{ color: '#db7f3a' }}>18</div>
                        </div>
                        <div className="bg-blue-900/10 rounded-lg border border-blue-900/30 p-3">
                          <div className="text-xs text-blue-800 mb-1">Pendientes</div>
                          <div className="text-xl font-bold text-blue-900">6</div>
                        </div>
                      </div>

                      {/* Table Preview */}
                      <div className="bg-white rounded-lg border border-blue-900/20 overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead className="bg-blue-900/10 border-b border-blue-900/20">
                              <tr>
                                <th className="px-3 py-2 text-left text-blue-900 font-semibold">Reporte</th>
                                <th className="px-3 py-2 text-left text-blue-900 font-semibold">Servicio</th>
                                <th className="px-3 py-2 text-left text-blue-900 font-semibold">Fecha</th>
                                <th className="px-3 py-2 text-left text-blue-900 font-semibold">Estado</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-blue-900/10">
                              <tr className="hover:bg-blue-50/50">
                                <td className="px-3 py-2.5 text-blue-900 font-medium">#REP-2024-001</td>
                                <td className="px-3 py-2.5 text-blue-800/70">Fumigación General</td>
                                <td className="px-3 py-2.5 text-blue-800/70">15/12/2024</td>
                                <td className="px-3 py-2.5">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                    Facturado
                                  </span>
                                </td>
                              </tr>
                              <tr className="hover:bg-blue-50/50">
                                <td className="px-3 py-2.5 text-blue-900 font-medium">#REP-2024-002</td>
                                <td className="px-3 py-2.5 text-blue-800/70">Control de Roedores</td>
                                <td className="px-3 py-2.5 text-blue-800/70">12/12/2024</td>
                                <td className="px-3 py-2.5">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-900/20 text-blue-900">
                                    Pendiente
                                  </span>
                                </td>
                              </tr>
                              <tr className="hover:bg-blue-50/50">
                                <td className="px-3 py-2.5 text-blue-900 font-medium">#REP-2024-003</td>
                                <td className="px-3 py-2.5 text-blue-800/70">Monitoreo de Granos</td>
                                <td className="px-3 py-2.5 text-blue-800/70">10/12/2024</td>
                                <td className="px-3 py-2.5">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                    Facturado
                                  </span>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Quick Access Cards */}
                      <div className="grid grid-cols-2 gap-3 mt-4">
                        <div className="bg-white rounded-lg border border-blue-900/20 p-3 flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-900/10 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Warehouse size={16} className="text-blue-900" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold text-blue-900">Mapas de Calor</div>
                            <div className="text-xs text-blue-800/70">Actualizados</div>
                          </div>
                        </div>
                        <div className="bg-white rounded-lg border border-blue-900/20 p-3 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(219, 127, 58, 0.1)' }}>
                            <FileText size={16} style={{ color: '#db7f3a' }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold text-blue-900">Facturas</div>
                            <div className="text-xs text-blue-800/70">Disponibles</div>
                          </div>
                        </div>
                      </div>
                    </div>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="inline-block mb-4 px-4 py-2 rounded-full text-sm font-medium" style={{ backgroundColor: 'rgba(219, 127, 58, 0.1)', color: 'rgba(219, 127, 58, 0.9)' }}>
                Portal del Cliente
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Acceso Digital para Nuestros Clientes
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Como parte de nuestro servicio, ofrecemos a nuestros clientes acceso a una plataforma digital donde pueden consultar sus reportes de servicio, mapas de calor, facturas y toda la documentación relacionada con nuestros tratamientos.
              </p>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(219, 127, 58, 0.1)' }}>
                    <ClipboardCheck style={{ color: '#db7f3a' }} size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Reportes de Servicio</h3>
                    <p className="text-gray-600">Accede a todos tus reportes de fumigación y control de plagas con documentación completa y certificados.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-900/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Warehouse className="text-blue-900" size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Mapas de Calor</h3>
                    <p className="text-gray-600">Visualiza los mapas de calor de control de roedores e insectos voladores de tus instalaciones.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(219, 127, 58, 0.1)' }}>
                    <FileText style={{ color: '#db7f3a' }} size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Facturas y Documentación</h3>
                    <p className="text-gray-600">Descarga tus facturas y toda la documentación relacionada con nuestros servicios.</p>
                  </div>
                </div>
              </div>
              <div className="mt-8">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 px-6 py-3 text-white rounded-lg font-semibold transition-all"
                  style={{ backgroundColor: '#db7f3a' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#c46f2f'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#db7f3a'}
                >
                  Acceder al Portal
                  <ArrowRight size={20} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Grain Loss Analysis Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-1 lg:order-1">
              <div className="inline-block mb-4 px-4 py-2 rounded-full text-sm font-medium" style={{ backgroundColor: 'rgba(219, 127, 58, 0.1)', color: 'rgba(219, 127, 58, 0.9)' }}>
                Análisis Avanzado
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Análisis de Pérdidas Económicas y Calidad del Grano
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Monitoreo completo de plagas, pérdidas económicas y calidad del grano almacenado con análisis detallados, gráficos interactivos y recomendaciones en tiempo real.
              </p>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(219, 127, 58, 0.1)' }}>
                    <BarChart3 style={{ color: '#db7f3a' }} size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Análisis en Tiempo Real</h3>
                    <p className="text-gray-600">Visualiza pérdidas económicas, ácido úrico y daños causados por plagas con gráficos detallados y métricas actualizadas.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Activity className="text-red-600" size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Monitoreo de Calidad</h3>
                    <p className="text-gray-600">Controla el ácido úrico acumulado y la calidad del grano con alertas automáticas y seguimiento por silo y batch.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <DollarSign className="text-emerald-600" size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Pérdidas Económicas</h3>
                    <p className="text-gray-600">Calcula automáticamente el impacto económico de las plagas en tus granos almacenados con reportes acumulados.</p>
                  </div>
                </div>
              </div>
              <div className="mt-8">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 px-6 py-3 text-white rounded-lg font-semibold transition-all"
                  style={{ backgroundColor: '#db7f3a' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#c46f2f'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#db7f3a'}
                >
                  Ver Análisis Completo
                  <ArrowRight size={20} />
                </Link>
              </div>
            </div>
            <div className="order-2 lg:order-2">
              <div className="bg-gradient-to-br from-red-50 rounded-2xl p-6 shadow-2xl" style={{ background: 'linear-gradient(to bottom right, rgba(219, 127, 58, 0.1), rgba(239, 68, 68, 0.1))' }}>
                <div className="bg-white rounded-lg overflow-hidden shadow-xl border" style={{ borderColor: 'rgba(219, 127, 58, 0.3)' }}>
                  {/* Browser Bar */}
                  <div className="px-4 py-2.5 flex items-center gap-2 border-b" style={{ backgroundColor: 'rgba(219, 127, 58, 0.1)', borderColor: 'rgba(219, 127, 58, 0.3)' }}>
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <div className="flex-1 text-center">
                      <div className="inline-flex items-center gap-2 bg-white px-3 py-1 rounded-md text-xs border" style={{ color: '#db7f3a', borderColor: 'rgba(219, 127, 58, 0.4)' }}>
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: '#db7f3a' }}></div>
                        <span className="font-medium">portal.fysa.com/perdida-economica</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Mockup Content */}
                  <div className="p-6" style={{ backgroundColor: 'rgba(219, 127, 58, 0.05)' }}>
                    {/* Header */}
                    <div className="mb-4">
                      <h3 className="text-sm font-bold mb-1" style={{ color: '#db7f3a' }}>Análisis de Pérdidas Económicas</h3>
                      <p className="text-xs" style={{ color: 'rgba(219, 127, 58, 0.7)' }}>Último muestreo: 30/12/2025</p>
                    </div>

                    {/* KPI Cards */}
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div className="bg-emerald-50 rounded-lg border border-emerald-200 p-2">
                        <div className="text-xs text-emerald-700 mb-1">Ácido Úrico</div>
                        <div className="text-lg font-bold text-emerald-900">73.8</div>
                        <div className="text-xs text-emerald-700">mg/100g</div>
                      </div>
                      <div className="bg-red-50 rounded-lg border border-red-200 p-2">
                        <div className="text-xs text-red-700 mb-1">Daño Total</div>
                        <div className="text-lg font-bold text-red-900">6,525</div>
                        <div className="text-xs text-red-700">kg</div>
                      </div>
                      <div className="rounded-lg border p-2" style={{ backgroundColor: 'rgba(219, 127, 58, 0.1)', borderColor: 'rgba(219, 127, 58, 0.3)' }}>
                        <div className="text-xs mb-1" style={{ color: 'rgba(219, 127, 58, 0.8)' }}>Pérdida Econ.</div>
                        <div className="text-lg font-bold" style={{ color: '#db7f3a' }}>Q. 23,842</div>
                      </div>
                    </div>

                    {/* Charts Preview */}
                    <div className="space-y-3">
                      <div className="bg-white rounded-lg border p-3" style={{ borderColor: 'rgba(219, 127, 58, 0.3)' }}>
                        <div className="text-xs font-semibold mb-2" style={{ color: '#db7f3a' }}>Gorgojos Vivos Encontrados</div>
                        <div className="flex items-end gap-1 h-16">
                          {[8, 12, 5, 15, 10, 6, 9].map((height, i) => (
                            <div key={i} className="flex-1 bg-blue-500 rounded-t" style={{ height: `${(height / 15) * 100}%` }}></div>
                          ))}
                        </div>
                      </div>
                      <div className="bg-white rounded-lg border p-3" style={{ borderColor: 'rgba(219, 127, 58, 0.3)' }}>
                        <div className="text-xs font-semibold mb-2" style={{ color: '#db7f3a' }}>Piojillo Encontrado</div>
                        <div className="flex items-end gap-1 h-16">
                          {[15, 22, 18, 25, 12, 20, 14].map((height, i) => (
                            <div key={i} className="flex-1 bg-purple-500 rounded-t" style={{ height: `${(height / 25) * 100}%` }}></div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Grain Monitoring Dashboard Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <div className="bg-gradient-to-br from-blue-50 to-orange-50 rounded-2xl p-6 shadow-2xl">
                <div className="bg-white rounded-lg overflow-hidden shadow-xl border border-blue-900/20">
                  {/* Browser Bar */}
                  <div className="bg-blue-900/10 px-4 py-2.5 flex items-center gap-2 border-b border-blue-900/20">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <div className="flex-1 text-center">
                      <div className="inline-flex items-center gap-2 bg-white px-3 py-1 rounded-md text-xs text-blue-900 border border-blue-900/30">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: '#db7f3a' }}></div>
                        <span className="font-medium">portal.fysa.com/dashboard-monitoreo</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Mockup Content */}
                  <div className="p-6 bg-blue-50/50">
                    {/* Header */}
                    <div className="mb-4">
                      <h3 className="text-sm font-bold text-blue-900 mb-1 flex items-center gap-2">
                        <BarChart3 size={16} />
                        Dashboard de Monitoreo de Granos
                      </h3>
                      <p className="text-xs text-blue-800/70">Resumen general del monitoreo</p>
                    </div>

                    {/* KPI Cards */}
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <div className="bg-white rounded-lg border border-blue-200 p-3">
                        <div className="text-xs text-blue-700 mb-1">Total Muestreos</div>
                        <div className="text-2xl font-bold text-blue-900">24</div>
                        <div className="text-xs text-blue-700">Reportes</div>
                      </div>
                      <div className="bg-white rounded-lg border border-blue-200 p-3">
                        <div className="text-xs text-blue-700 mb-1">Silos con Grano</div>
                        <div className="text-2xl font-bold text-blue-900">12</div>
                        <div className="text-xs text-blue-700">De 30 totales</div>
                      </div>
                      <div className="bg-white rounded-lg border p-3" style={{ borderColor: 'rgba(219, 127, 58, 0.3)' }}>
                        <div className="text-xs mb-1" style={{ color: 'rgba(219, 127, 58, 0.8)' }}>Pérdida Económica</div>
                        <div className="text-xl font-bold" style={{ color: '#db7f3a' }}>Q. 85,420</div>
                        <div className="text-xs" style={{ color: 'rgba(219, 127, 58, 0.8)' }}>Total acumulado</div>
                      </div>
                      <div className="bg-white rounded-lg border border-red-200 p-3">
                        <div className="text-xs text-red-700 mb-1">Ácido Úrico</div>
                        <div className="text-xl font-bold text-red-900">156.3</div>
                        <div className="text-xs text-red-700">mg/100g total</div>
                      </div>
                    </div>

                    {/* Quick Links */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-white rounded-lg border border-blue-200 p-2 text-center">
                        <Package size={16} className="text-blue-600 mx-auto mb-1" />
                        <div className="text-xs font-semibold text-blue-900">Silos</div>
                      </div>
                      <div className="bg-white rounded-lg border border-blue-200 p-2 text-center">
                        <FileText size={16} className="text-blue-600 mx-auto mb-1" />
                        <div className="text-xs font-semibold text-blue-900">Muestreos</div>
                      </div>
                      <div className="bg-white rounded-lg border border-red-200 p-2 text-center">
                        <Bug size={16} className="text-red-600 mx-auto mb-1" />
                        <div className="text-xs font-semibold text-red-900">Fumigación</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="inline-block mb-4 px-4 py-2 rounded-full text-sm font-medium" style={{ backgroundColor: 'rgba(219, 127, 58, 0.1)', color: 'rgba(219, 127, 58, 0.9)' }}>
                Monitoreo Inteligente
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Dashboard de Monitoreo de Granos
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Gestiona y monitorea tus granos almacenados con un dashboard completo que incluye muestreos, análisis de plagas, fumigaciones y trazabilidad completa de cada batch.
              </p>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(219, 127, 58, 0.1)' }}>
                    <Warehouse style={{ color: '#db7f3a' }} size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Gestión de Silos</h3>
                    <p className="text-gray-600">Controla todos tus silos, batches de grano, movimientos y cantidades almacenadas en tiempo real.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="text-blue-600" size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Muestreos Semanales</h3>
                    <p className="text-gray-600">Registra y analiza muestreos de plagas con detección automática y cálculo de daños económicos.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Activity className="text-purple-600" size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Trazabilidad Completa</h3>
                    <p className="text-gray-600">Sigue el historial completo de cada batch desde su entrada hasta hoy con todos sus movimientos y actualizaciones.</p>
                  </div>
                </div>
              </div>
              <div className="mt-8">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 px-6 py-3 text-white rounded-lg font-semibold transition-all"
                  style={{ backgroundColor: '#db7f3a' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#c46f2f'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#db7f3a'}
                >
                  Acceder al Dashboard
                  <ArrowRight size={20} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r to-blue-900 text-white" style={{ background: `linear-gradient(to right, #db7f3a, #db7f3a, #1e3a8a)` }}>
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">
            Protege tu Negocio con Expertos en Control de Plagas
          </h2>
          <p className="text-xl mb-8" style={{ color: 'rgba(255, 255, 255, 0.95)' }}>
            Más de 30 años de experiencia protegiendo empresas, hogares y granos en Guatemala. Contáctanos hoy para una consulta gratuita y descubre cómo podemos ayudarte a mantener tus instalaciones libres de plagas.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/contactanos"
              className="px-8 py-4 bg-white rounded-lg font-semibold transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
              style={{ color: '#db7f3a' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(219, 127, 58, 0.1)';
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.color = '#db7f3a';
              }}
            >
              Solicitar Cotización Gratuita
              <ArrowRight size={20} />
            </Link>
            <Link
              to="/servicios"
              className="px-8 py-4 bg-blue-900/80 border-2 border-blue-900 text-white rounded-lg font-semibold hover:bg-blue-900 transition-all flex items-center justify-center backdrop-blur-sm"
            >
              Ver Nuestros Servicios
            </Link>
          </div>
          <div className="mt-8 pt-8 border-t border-white/20">
            <p className="text-sm mb-4" style={{ color: 'rgba(255, 255, 255, 0.95)' }}>¿Ya eres cliente? Accede a tu portal para ver reportes y documentación:</p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 font-medium transition-colors"
              style={{ color: 'rgba(255, 255, 255, 0.95)' }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'white'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.95)'}
            >
              Acceder al Portal del Cliente
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
