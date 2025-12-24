import React from 'react';
import { Building2, Target, Users, Award, Shield, TrendingUp, CheckCircle2, Clock, Globe, FileCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

const SobreNosotros: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative text-white py-20 px-4 overflow-hidden" style={{ backgroundColor: '#db7f3a' }}>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Sobre Nosotros
            </h1>
            <p className="text-xl md:text-2xl max-w-3xl mx-auto" style={{ color: 'rgba(255, 255, 255, 0.95)' }}>
              Más de 30 años protegiendo negocios, hogares y granos con soluciones profesionales de control de plagas y fumigación
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Nuestra Historia */}
          <div className="mb-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-block mb-4 px-4 py-2 rounded-full text-sm font-semibold" style={{ backgroundColor: 'rgba(219, 127, 58, 0.1)', color: 'rgba(219, 127, 58, 0.9)' }}>
                  Nuestra Historia
                </div>
                <h2 className="text-4xl font-bold text-gray-900 mb-6">
                  Líderes en Control de Plagas y Fumigación
                </h2>
                <p className="text-lg text-gray-700 mb-4 leading-relaxed text-justify">
                  FYSA es una empresa líder en servicios profesionales de control de plagas, fumigación y protección de granos 
                  en Guatemala. Con más de 30 años de experiencia en el sector, nos hemos consolidado como un referente 
                  en soluciones integrales para la industria, comercios y residencias.
                </p>
                <p className="text-lg text-gray-700 mb-4 leading-relaxed text-justify">
                  Nuestro compromiso es proporcionar servicios de la más alta calidad, utilizando métodos seguros y técnicas 
                  profesionales que garantizan resultados efectivos y seguros para nuestros clientes. Trabajamos con un equipo 
                  de técnicos certificados y especializados en control de plagas.
                </p>
                <p className="text-lg text-gray-700 leading-relaxed text-justify">
                  Trabajamos con empresas de todos los tamaños, desde pequeñas residencias hasta grandes complejos industriales, 
                  adaptando nuestras soluciones a las necesidades específicas de cada cliente. Ofrecemos servicios de fumigación, 
                  control de roedores, insectos rastreros y voladores, así como tratamientos especializados para granos almacenados.
                </p>
              </div>
              <div className="relative">
                <div className="relative">
                  <img 
                    src="/images landing page/ChatGPT Image Dec 23, 2025, 10_37_45 PM.png" 
                    alt="FYSA - Control de Plagas y Fumigación" 
                    className="rounded-2xl shadow-2xl w-full h-auto object-cover"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Misión, Visión, Valores */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
            <div className="p-8 rounded-xl border-2" style={{ background: 'linear-gradient(to bottom right, rgba(219, 127, 58, 0.1), rgba(219, 127, 58, 0.15))', borderColor: 'rgba(219, 127, 58, 0.3)' }}>
              <div className="w-16 h-16 rounded-xl flex items-center justify-center mb-6" style={{ backgroundColor: '#db7f3a' }}>
                <Target className="text-white" size={32} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Nuestra Misión
              </h3>
              <p className="text-gray-700 leading-relaxed text-justify">
                Proporcionar servicios profesionales de control de plagas y fumigación de la más alta calidad, 
                protegiendo negocios, hogares y granos con métodos seguros y técnicas efectivas. Nos comprometemos 
                a garantizar la satisfacción de nuestros clientes y la protección de sus instalaciones.
              </p>
            </div>

            <div className="p-8 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border-2 border-blue-200">
              <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mb-6">
                <TrendingUp className="text-white" size={32} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Nuestra Visión
              </h3>
              <p className="text-gray-700 leading-relaxed text-justify">
                Ser la empresa líder en Guatemala en servicios de control de plagas y fumigación, reconocida 
                por nuestra experiencia, calidad de servicio y compromiso con la excelencia. Aspiramos a ser 
                el referente en protección de instalaciones y granos almacenados.
              </p>
            </div>

            <div className="p-8 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl border-2 border-emerald-200">
              <div className="w-16 h-16 bg-emerald-600 rounded-xl flex items-center justify-center mb-6">
                <Award className="text-white" size={32} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Nuestros Valores
              </h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>Compromiso con la excelencia</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>Innovación constante</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>Servicio al cliente</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>Responsabilidad ambiental</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Por Qué Elegirnos */}
          <div className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                ¿Por Qué Elegir FYSA?
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Nos diferenciamos por nuestra experiencia, tecnología y compromiso con la calidad
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-6 bg-white border-2 border-gray-200 rounded-xl hover:shadow-lg transition-all" onMouseEnter={(e) => e.currentTarget.style.borderColor = '#db7f3a'} onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}>
                <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: 'rgba(219, 127, 58, 0.1)' }}>
                  <Shield style={{ color: '#db7f3a' }} size={24} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Certificaciones</h3>
                <p className="text-sm text-gray-600">
                  Certificados profesionales y cumplimiento de normativas internacionales. Técnicos certificados 
                  por el Ministerio de Salud de Guatemala.
                </p>
              </div>

              <div className="p-6 bg-white border-2 border-gray-200 rounded-xl hover:shadow-lg transition-all" onMouseEnter={(e) => e.currentTarget.style.borderColor = '#db7f3a'} onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}>
                <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: 'rgba(219, 127, 58, 0.1)' }}>
                  <Users style={{ color: '#db7f3a' }} size={24} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Equipo Profesional</h3>
                <p className="text-sm text-gray-600">
                  Técnicos certificados por el Ministerio de Salud y capacitados continuamente
                </p>
              </div>

              <div className="p-6 bg-white border-2 border-gray-200 rounded-xl hover:shadow-lg transition-all" onMouseEnter={(e) => e.currentTarget.style.borderColor = '#db7f3a'} onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}>
                <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: 'rgba(219, 127, 58, 0.1)' }}>
                  <FileCheck style={{ color: '#db7f3a' }} size={24} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Métodos Seguros</h3>
                <p className="text-sm text-gray-600">
                  Utilizamos métodos seguros y técnicas profesionales aprobadas para el control de plagas, 
                  garantizando la seguridad de personas y animales.
                </p>
              </div>

              <div className="p-6 bg-white border-2 border-gray-200 rounded-xl hover:shadow-lg transition-all" onMouseEnter={(e) => e.currentTarget.style.borderColor = '#db7f3a'} onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}>
                <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: 'rgba(219, 127, 58, 0.1)' }}>
                  <Clock style={{ color: '#db7f3a' }} size={24} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Atención Personalizada</h3>
                <p className="text-sm text-gray-600">
                  Servicio adaptado a las necesidades específicas de cada cliente con seguimiento continuo
                </p>
              </div>

              <div className="p-6 bg-white border-2 border-gray-200 rounded-xl hover:shadow-lg transition-all" onMouseEnter={(e) => e.currentTarget.style.borderColor = '#db7f3a'} onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}>
                <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: 'rgba(219, 127, 58, 0.1)' }}>
                  <Globe style={{ color: '#db7f3a' }} size={24} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Cobertura Nacional</h3>
                <p className="text-sm text-gray-600">
                  Servicios disponibles en toda Guatemala con cobertura regional
                </p>
              </div>

              <div className="p-6 bg-white border-2 border-gray-200 rounded-xl hover:shadow-lg transition-all" onMouseEnter={(e) => e.currentTarget.style.borderColor = '#db7f3a'} onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}>
                <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: 'rgba(219, 127, 58, 0.1)' }}>
                  <TrendingUp style={{ color: '#db7f3a' }} size={24} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Tecnología Avanzada</h3>
                <p className="text-sm text-gray-600">
                  Plataforma digital para gestión, seguimiento y documentación de servicios
                </p>
              </div>

              <div className="p-6 bg-white border-2 border-gray-200 rounded-xl hover:shadow-lg transition-all" onMouseEnter={(e) => e.currentTarget.style.borderColor = '#db7f3a'} onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}>
                <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: 'rgba(219, 127, 58, 0.1)' }}>
                  <Award style={{ color: '#db7f3a' }} size={24} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Garantía de Resultados</h3>
                <p className="text-sm text-gray-600">
                  Resultados garantizados con seguimiento post-servicio y soporte continuo
                </p>
              </div>

              <div className="p-6 bg-white border-2 border-gray-200 rounded-xl hover:shadow-lg transition-all" onMouseEnter={(e) => e.currentTarget.style.borderColor = '#db7f3a'} onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}>
                <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: 'rgba(219, 127, 58, 0.1)' }}>
                  <Building2 style={{ color: '#db7f3a' }} size={24} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Experiencia Comprobada</h3>
                <p className="text-sm text-gray-600">
                  Más de 30 años de experiencia en control de plagas, fumigación y protección de granos almacenados
                </p>
              </div>
            </div>
          </div>

          {/* Nuestro Equipo */}
          <div className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Nuestro Equipo
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Profesionales comprometidos con la excelencia y la innovación
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center p-6 bg-white rounded-xl border-2 border-gray-200 transition-all" onMouseEnter={(e) => e.currentTarget.style.borderColor = '#db7f3a'} onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}>
                <div className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: `linear-gradient(to bottom right, #db7f3a, #c46f2f)` }}>
                  <Users className="text-white" size={40} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Técnicos Certificados</h3>
                <p className="text-gray-600">
                  Equipo de técnicos especializados certificados por el Ministerio de Salud de Guatemala 
                  y capacitados en las últimas técnicas de control de plagas.
                </p>
              </div>

              <div className="text-center p-6 bg-white rounded-xl border-2 border-gray-200 transition-all" onMouseEnter={(e) => e.currentTarget.style.borderColor = '#db7f3a'} onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}>
                <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <FileCheck className="text-white" size={40} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Especialistas en Calidad</h3>
                <p className="text-gray-600">
                  Profesionales con experiencia en normas ISO, HACCP, GMP y POES, asegurando el cumplimiento 
                  de todos los estándares de calidad.
                </p>
              </div>

              <div className="text-center p-6 bg-white rounded-xl border-2 border-gray-200 transition-all" onMouseEnter={(e) => e.currentTarget.style.borderColor = '#db7f3a'} onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}>
                <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <TrendingUp className="text-white" size={40} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Equipo de Desarrollo</h3>
                <p className="text-gray-600">
                  Desarrolladores y especialistas en tecnología que crean soluciones innovadoras para 
                  mejorar la gestión y eficiencia de nuestros servicios.
                </p>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="rounded-2xl p-12 text-center text-white" style={{ background: `linear-gradient(to right, #db7f3a, #db7f3a, #1e3a8a)` }}>
            <h2 className="text-3xl font-bold mb-4">
              ¿Listo para Proteger tu Negocio o Residencia?
            </h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto" style={{ color: 'rgba(255, 255, 255, 0.95)' }}>
              Contáctanos hoy para una consulta gratuita y descubre cómo podemos ayudarte a mantener tus instalaciones libres de plagas
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/contactanos"
                className="px-8 py-4 bg-white rounded-lg font-semibold transition-all transform hover:scale-105 shadow-lg"
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
                Contáctanos
              </Link>
              <Link
                to="/servicios"
                className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-lg font-semibold hover:bg-white/10 transition-all"
              >
                Ver Servicios
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SobreNosotros;
