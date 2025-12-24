import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Bug, Warehouse, Ship, ClipboardCheck, Shield, Zap, CheckCircle2, Building2, Home, 
  FlaskConical, ArrowRight, Award, Users, Phone, Mail, Clock, Star
} from 'lucide-react';

const ServiciosLanding: React.FC = () => {

  const servicios = [
    {
      id: 'residencial',
      icon: Home,
      title: 'Control de Plagas Residencial',
      category: 'residencial',
      description: 'Control y fumigación profesional para casas, apartamentos y condominios. Programas preventivos y correctivos con productos seguros para tu familia.',
      features: [
        'Control y fumigación en casas, apartamentos y condominios',
        'Programas preventivos y correctivos',
        'Atención a infestaciones activas y mantenimiento periódico',
        'Técnicos certificados por el Ministerio de Salud',
        'Productos ecológicos y seguros',
        'Protección para toda la familia'
      ],
      color: 'blue',
      popular: false
    },
    {
      id: 'comercial',
      icon: Building2,
      title: 'Control de Plagas Comercial',
      category: 'comercial',
      description: 'Soluciones especializadas para oficinas, restaurantes, hoteles, centros comerciales y más. Programas bajo normas de higiene y auditorías.',
      features: [
        'Oficinas corporativas',
        'Restaurantes, cafeterías y food courts',
        'Hoteles, hospitales y clínicas',
        'Centros comerciales y retail',
        'Colegios y universidades',
        'Programas bajo normas de higiene y auditorías'
      ],
      color: 'orange',
      popular: true
    },
    {
      id: 'industrial',
      icon: Warehouse,
      title: 'Control de Plagas Industrial',
      category: 'industrial',
      description: 'Protección integral para plantas industriales, fábricas y bodegas. Programas especiales para certificaciones HACCP, BPM, ISO.',
      features: [
        'Plantas industriales y fábricas',
        'Bodegas y centros de distribución',
        'Industrias alimentarias y agroindustriales',
        'Programas especiales para certificaciones (HACCP, BPM, ISO)',
        'Cumplimiento de normativas internacionales',
        'Técnicos altamente capacitados'
      ],
      color: 'purple',
      popular: true
    },
    {
      id: 'granos',
      icon: ClipboardCheck,
      title: 'Control de Plagas en Granos Almacenados',
      category: 'granos',
      description: 'Control especializado de gorgojos, polillas y escarabajos en granos almacenados. Fumigación y monitoreo continuo.',
      features: [
        'Control de gorgojos, polillas y escarabajos',
        'Tratamientos en silos, bodegas y sacos',
        'Fumigación de granos (maíz, arroz, frijol, trigo, sorgo, café, cacao)',
        'Programas preventivos y monitoreo',
        'Análisis y muestreo certificado',
        'Reportes detallados'
      ],
      color: 'amber',
      popular: false
    },
    {
      id: 'vehiculos',
      icon: Ship,
      title: 'Tratamiento de Vehículos y Contenedores',
      category: 'vehiculos',
      description: 'Tratamiento fitosanitario de contenedores y control de plagas en vehículos de transporte. Cumplimiento de requisitos sanitarios.',
      features: [
        'Tratamiento fitosanitario de contenedores de carga',
        'Control de plagas en camiones, furgones y vehículos de transporte',
        'Prevención de contaminación cruzada en logística y exportación',
        'Cumplimiento de requisitos sanitarios para transporte de mercancías',
        'Certificación fitosanitaria',
        'Documentación completa'
      ],
      color: 'teal',
      popular: false
    },
    {
      id: 'roedores',
      icon: Bug,
      title: 'Control de Roedores',
      category: 'roedores',
      description: 'Control profesional de ratas y ratones con instalación de trampas, cebaderos y sistemas de monitoreo. Programas continuos.',
      features: [
        'Control de ratas y ratones',
        'Instalación de trampas, cebaderos y sistemas de monitoreo',
        'Sellado de puntos de ingreso (exclusión)',
        'Programas continuos para industria y comercio',
        'Monitoreo y reportes periódicos',
        'Estrategias de prevención'
      ],
      color: 'red',
      popular: false
    },
    {
      id: 'rastreros',
      icon: Shield,
      title: 'Control de Insectos Rastreros',
      category: 'rastreros',
      description: 'Eliminación efectiva de cucarachas, hormigas, chinches, arañas, alacranes, pulgas y garrapatas.',
      features: [
        'Cucarachas',
        'Hormigas',
        'Chinches',
        'Arañas',
        'Alacranes',
        'Pulgas y garrapatas'
      ],
      color: 'emerald',
      popular: false
    },
    {
      id: 'voladores',
      icon: Zap,
      title: 'Control de Insectos Voladores',
      category: 'voladores',
      description: 'Control especializado de moscas, mosquitos, zancudos y polillas. Tratamientos con trampas de luz y métodos efectivos.',
      features: [
        'Moscas',
        'Mosquitos',
        'Zancudos',
        'Polillas',
        'Trampas de luz y monitoreo',
        'Tratamientos preventivos'
      ],
      color: 'indigo',
      popular: false
    },
    {
      id: 'termitas',
      icon: FlaskConical,
      title: 'Control de Termitas',
      category: 'termitas',
      description: 'Tratamientos preventivos y curativos para proteger estructuras de madera. Inspecciones técnicas y planes a largo plazo.',
      features: [
        'Tratamientos preventivos y curativos',
        'Protección de estructuras de madera',
        'Inspecciones técnicas y planes a largo plazo',
        'Control subterráneo y de superficie',
        'Seguimiento continuo',
        'Garantía de resultados'
      ],
      color: 'rose',
      popular: false
    }
  ];


  const colorClasses: Record<string, { bg: string; text: string; border: string; hover: string }> = {
    blue: { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-200', hover: 'hover:border-blue-500' },
    orange: { bg: 'bg-[rgba(219,127,58,0.1)]', text: 'text-[#db7f3a]', border: 'border-[rgba(219,127,58,0.3)]', hover: 'hover:border-[#db7f3a]' },
    purple: { bg: 'bg-purple-100', text: 'text-purple-600', border: 'border-purple-200', hover: 'hover:border-purple-500' },
    amber: { bg: 'bg-amber-100', text: 'text-amber-600', border: 'border-amber-200', hover: 'hover:border-amber-500' },
    teal: { bg: 'bg-teal-100', text: 'text-teal-600', border: 'border-teal-200', hover: 'hover:border-teal-500' },
    red: { bg: 'bg-red-100', text: 'text-red-600', border: 'border-red-200', hover: 'hover:border-red-500' },
    emerald: { bg: 'bg-emerald-100', text: 'text-emerald-600', border: 'border-emerald-200', hover: 'hover:border-emerald-500' },
    indigo: { bg: 'bg-indigo-100', text: 'text-indigo-600', border: 'border-indigo-200', hover: 'hover:border-indigo-500' },
    rose: { bg: 'bg-rose-100', text: 'text-rose-600', border: 'border-rose-200', hover: 'hover:border-rose-500' },
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative text-white py-20 px-4" style={{ backgroundColor: '#db7f3a' }}>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Nuestros Servicios
            </h1>
            <p className="text-xl md:text-2xl max-w-3xl mx-auto" style={{ color: 'rgba(255, 255, 255, 0.95)' }}>
              Soluciones profesionales de control de plagas y fumigación para proteger tus instalaciones
            </p>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {servicios.map((servicio) => {
                const Icon = servicio.icon;
                const colors = colorClasses[servicio.color];
                
                return (
                  <div
                    key={servicio.id}
                    className={`group relative bg-white border-2 ${colors.border} rounded-2xl p-8 hover:shadow-2xl transition-all duration-300 ${colors.hover}`}
                  >
                    <div className="flex items-start gap-6 mb-6">
                      <div className={`${colors.bg} ${colors.text} rounded-xl p-4 flex-shrink-0 group-hover:scale-110 transition-transform`}>
                        <Icon size={32} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">
                          {servicio.title}
                        </h3>
                        <p className="text-gray-600 leading-relaxed">
                          {servicio.description}
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-6">
                      <h4 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">
                        Incluye:
                      </h4>
                      <ul className="space-y-3 mb-6">
                        {servicio.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-3 text-sm text-gray-700">
                            <CheckCircle2 size={18} className={`${colors.text} flex-shrink-0 mt-0.5`} />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                      
                      <Link
                        to="/contactanos"
                        className={`inline-flex items-center gap-2 px-6 py-3 ${colors.bg} ${colors.text} rounded-lg font-semibold hover:opacity-90 transition-all group/link`}
                      >
                        Solicitar Cotización
                        <ArrowRight size={18} className="group-hover/link:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-20 px-4" style={{ background: 'linear-gradient(to bottom right, #f9fafb, rgba(219, 127, 58, 0.1))' }}>
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
            <div className="text-center bg-white p-6 rounded-xl shadow-sm hover:shadow-lg transition-shadow">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg" style={{ backgroundColor: '#db7f3a' }}>
                <Award className="text-white" size={40} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Certificaciones</h3>
              <p className="text-gray-600">Certificados profesionales y cumplimiento de normativas internacionales</p>
            </div>

            <div className="text-center bg-white p-6 rounded-xl shadow-sm hover:shadow-lg transition-shadow">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg" style={{ backgroundColor: '#db7f3a' }}>
                <Users className="text-white" size={40} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Experiencia</h3>
              <p className="text-gray-600">Equipo de técnicos especializados con años de experiencia</p>
            </div>

            <div className="text-center bg-white p-6 rounded-xl shadow-sm hover:shadow-lg transition-shadow">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg" style={{ backgroundColor: '#db7f3a' }}>
                <FlaskConical className="text-white" size={40} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Métodos Seguros</h3>
              <p className="text-gray-600">Uso de métodos seguros y técnicas profesionales para el control de plagas</p>
            </div>

            <div className="text-center bg-white p-6 rounded-xl shadow-sm hover:shadow-lg transition-shadow">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg" style={{ backgroundColor: '#db7f3a' }}>
                <Shield className="text-white" size={40} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Garantía</h3>
              <p className="text-gray-600">Resultados garantizados y seguimiento post-servicio</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact CTA Section */}
      <section className="py-20 px-4 text-white" style={{ background: `linear-gradient(to right, #db7f3a, #c46f2f)` }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">
              ¿Listo para Proteger tu Negocio o Residencia?
            </h2>
            <p className="text-xl mb-8" style={{ color: 'rgba(255, 255, 255, 0.95)' }}>
              Contáctanos hoy para una consulta gratuita y descubre cómo podemos ayudarte
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
              <Phone className="mx-auto mb-3" size={32} />
              <h3 className="font-semibold mb-2">Teléfono</h3>
              <p className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>Llámanos para consultas</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
              <Mail className="mx-auto mb-3" size={32} />
              <h3 className="font-semibold mb-2">Email</h3>
              <p className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>Escríbenos tu consulta</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
              <Clock className="mx-auto mb-3" size={32} />
              <h3 className="font-semibold mb-2">Horario</h3>
              <p className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>Lun - Vie: 8:00 AM - 6:00 PM</p>
            </div>
          </div>

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
              to="/"
              className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-lg font-semibold hover:bg-white/10 transition-all flex items-center justify-center"
            >
              Volver al Inicio
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ServiciosLanding;
