import React from 'react';
import { Building2, Target, Users, Award, Shield, TrendingUp, CheckCircle2, Clock, Globe, FileCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

const SobreNosotros: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 text-white py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Sobre Nosotros
            </h1>
            <p className="text-xl md:text-2xl text-orange-100 max-w-3xl mx-auto">
              Más de una década protegiendo negocios y hogares con soluciones profesionales de control de plagas
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
                <div className="inline-block mb-4 px-4 py-2 bg-orange-100 text-orange-700 rounded-full text-sm font-semibold">
                  Nuestra Historia
                </div>
                <h2 className="text-4xl font-bold text-gray-900 mb-6">
                  Líderes en Control de Plagas
                </h2>
                <p className="text-lg text-gray-700 mb-4 leading-relaxed">
                  FYSA es una empresa líder en soluciones tecnológicas y servicios profesionales para la gestión agrícola, 
                  control de plagas y protección de granos. Con años de experiencia en el sector, nos hemos consolidado 
                  como un referente en soluciones integrales para la industria.
                </p>
                <p className="text-lg text-gray-700 mb-4 leading-relaxed">
                  Nuestro compromiso es proporcionar servicios de la más alta calidad, utilizando tecnología de vanguardia 
                  y productos certificados que garantizan resultados efectivos y seguros para nuestros clientes.
                </p>
                <p className="text-lg text-gray-700 leading-relaxed">
                  Trabajamos con empresas de todos los tamaños, desde pequeñas residencias hasta grandes complejos industriales, 
                  adaptando nuestras soluciones a las necesidades específicas de cada cliente.
                </p>
              </div>
              <div className="relative">
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-8 shadow-xl">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-md text-center">
                      <div className="text-4xl font-bold text-orange-600 mb-2">10+</div>
                      <div className="text-sm text-gray-600">Años de Experiencia</div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-md text-center">
                      <div className="text-4xl font-bold text-orange-600 mb-2">500+</div>
                      <div className="text-sm text-gray-600">Clientes Satisfechos</div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-md text-center">
                      <div className="text-4xl font-bold text-orange-600 mb-2">1000+</div>
                      <div className="text-sm text-gray-600">Servicios Realizados</div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-md text-center">
                      <div className="text-4xl font-bold text-orange-600 mb-2">24/7</div>
                      <div className="text-sm text-gray-600">Soporte Disponible</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Misión, Visión, Valores */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
            <div className="p-8 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border-2 border-orange-200">
              <div className="w-16 h-16 bg-orange-600 rounded-xl flex items-center justify-center mb-6">
                <Target className="text-white" size={32} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Nuestra Misión
              </h3>
              <p className="text-gray-700 leading-relaxed">
                Proporcionar herramientas tecnológicas y servicios profesionales de vanguardia que optimicen la gestión 
                de granos, control de plagas y documentación, mejorando la eficiencia operativa y garantizando la calidad 
                de nuestros clientes.
              </p>
            </div>

            <div className="p-8 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border-2 border-blue-200">
              <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mb-6">
                <TrendingUp className="text-white" size={32} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Nuestra Visión
              </h3>
              <p className="text-gray-700 leading-relaxed">
                Ser la empresa líder en Centroamérica en soluciones de control de plagas y gestión de granos, reconocida 
                por nuestra innovación, calidad de servicio y compromiso con la excelencia en cada proyecto.
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
              <div className="p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-orange-500 hover:shadow-lg transition-all">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="text-orange-600" size={24} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Certificaciones</h3>
                <p className="text-sm text-gray-600">
                  Certificados OIRSA, ISO, HACCP, GMP y cumplimiento de normativas internacionales
                </p>
              </div>

              <div className="p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-orange-500 hover:shadow-lg transition-all">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <Users className="text-orange-600" size={24} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Equipo Profesional</h3>
                <p className="text-sm text-gray-600">
                  Técnicos certificados por el Ministerio de Salud y capacitados continuamente
                </p>
              </div>

              <div className="p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-orange-500 hover:shadow-lg transition-all">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <FileCheck className="text-orange-600" size={24} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Productos Certificados</h3>
                <p className="text-sm text-gray-600">
                  Utilizamos solo productos autorizados por el Ministerio de Salud de Guatemala
                </p>
              </div>

              <div className="p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-orange-500 hover:shadow-lg transition-all">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <Clock className="text-orange-600" size={24} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Respuesta Rápida</h3>
                <p className="text-sm text-gray-600">
                  Servicio disponible 24/7 para emergencias y atención inmediata
                </p>
              </div>

              <div className="p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-orange-500 hover:shadow-lg transition-all">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <Globe className="text-orange-600" size={24} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Cobertura Nacional</h3>
                <p className="text-sm text-gray-600">
                  Servicios disponibles en toda Guatemala con cobertura regional
                </p>
              </div>

              <div className="p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-orange-500 hover:shadow-lg transition-all">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="text-orange-600" size={24} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Tecnología Avanzada</h3>
                <p className="text-sm text-gray-600">
                  Plataforma digital para gestión, seguimiento y documentación de servicios
                </p>
              </div>

              <div className="p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-orange-500 hover:shadow-lg transition-all">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <Award className="text-orange-600" size={24} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Garantía de Resultados</h3>
                <p className="text-sm text-gray-600">
                  Resultados garantizados con seguimiento post-servicio y soporte continuo
                </p>
              </div>

              <div className="p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-orange-500 hover:shadow-lg transition-all">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <Building2 className="text-orange-600" size={24} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Experiencia Comprobada</h3>
                <p className="text-sm text-gray-600">
                  Más de 10 años de experiencia en control de plagas y gestión de granos
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
              <div className="text-center p-6 bg-white rounded-xl border-2 border-gray-200 hover:border-orange-500 transition-all">
                <div className="w-24 h-24 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Users className="text-white" size={40} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Técnicos Certificados</h3>
                <p className="text-gray-600">
                  Equipo de técnicos especializados certificados por el Ministerio de Salud de Guatemala 
                  y capacitados en las últimas técnicas de control de plagas.
                </p>
              </div>

              <div className="text-center p-6 bg-white rounded-xl border-2 border-gray-200 hover:border-orange-500 transition-all">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <FileCheck className="text-white" size={40} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Especialistas en Calidad</h3>
                <p className="text-gray-600">
                  Profesionales con experiencia en normas ISO, HACCP, GMP y POES, asegurando el cumplimiento 
                  de todos los estándares de calidad.
                </p>
              </div>

              <div className="text-center p-6 bg-white rounded-xl border-2 border-gray-200 hover:border-orange-500 transition-all">
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
          <div className="bg-gradient-to-r from-orange-600 to-orange-700 rounded-2xl p-12 text-center text-white">
            <h2 className="text-3xl font-bold mb-4">
              ¿Listo para Trabajar con Nosotros?
            </h2>
            <p className="text-xl text-orange-100 mb-8 max-w-2xl mx-auto">
              Contáctanos hoy y descubre cómo FYSA puede ayudarte a proteger tu negocio o residencia
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/contactanos"
                className="px-8 py-4 bg-white text-orange-600 rounded-lg font-semibold hover:bg-orange-50 transition-all transform hover:scale-105 shadow-lg"
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
