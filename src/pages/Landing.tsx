import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Shield, Bug, Warehouse, Ship, ClipboardCheck, CheckCircle2, TrendingUp, Users, Award, Zap, Building2, Home, FlaskConical } from 'lucide-react';

const Landing: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 text-white py-24 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute inset-0" style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.05\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
        }}></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-block mb-4 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium">
                🏆 Líder en Control de Plagas y Fumigación
              </div>
              <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                Control de Plagas
                <br />
                <span className="text-orange-200">Profesional y Eficaz</span>
              </h1>
              <p className="text-xl md:text-2xl text-orange-100 mb-8 leading-relaxed">
                FYSA ofrece soluciones integrales de control de plagas, fumigación y monitoreo de granos para proteger tu negocio y garantizar la calidad de tus productos.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/login"
                  className="px-8 py-4 bg-white text-orange-600 rounded-lg font-semibold hover:bg-orange-50 transition-all transform hover:scale-105 flex items-center justify-center gap-2 shadow-lg"
                >
                  Acceder al Sistema
                  <ArrowRight size={20} />
                </Link>
                <Link
                  to="/contactanos"
                  className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-lg font-semibold hover:bg-white/10 transition-all flex items-center justify-center"
                >
                  Solicitar Cotización
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 shadow-2xl border border-white/20">
                <div className="bg-white rounded-lg overflow-hidden shadow-xl">
                  <div className="bg-gray-100 px-4 py-2 flex items-center gap-2 border-b">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <div className="flex-1 text-center text-xs text-gray-500 font-medium">FYSA SaaS - Dashboard</div>
                  </div>
                  <div className="p-4 bg-gray-50">
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="bg-white p-3 rounded shadow-sm">
                        <div className="text-xs text-gray-500 mb-1">Silos Activos</div>
                        <div className="text-2xl font-bold text-blue-600">30</div>
                      </div>
                      <div className="bg-white p-3 rounded shadow-sm">
                        <div className="text-xs text-gray-500 mb-1">Reportes</div>
                        <div className="text-2xl font-bold text-purple-600">156</div>
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded shadow-sm">
                      <div className="text-xs text-gray-500 mb-1">Capacidad Utilizada</div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                        <div className="bg-orange-600 h-2 rounded-full" style={{ width: '65%' }}></div>
                      </div>
                      <div className="text-sm font-semibold text-gray-700">65%</div>
                    </div>
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Industria y Comercio */}
            <div className="p-8 border-2 border-gray-200 rounded-xl hover:border-orange-500 hover:shadow-xl transition-all group">
              <div className="w-16 h-16 bg-orange-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-orange-500 group-hover:scale-110 transition-all">
                <Building2 className="text-orange-600 group-hover:text-white" size={32} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Industria y Comercio
              </h3>
              <p className="text-gray-600 mb-4">
                Prevención y control de plagas con altos estándares de calidad para plantas de procesamiento, supermercados, fábricas, bodegas y más.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-orange-600" />
                  Plantas de procesamiento de alimentos
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-orange-600" />
                  Supermercados y bodegas
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-orange-600" />
                  Cumplimiento ISO, HACCP, GMP
                </li>
              </ul>
            </div>

            {/* Residencias */}
            <div className="p-8 border-2 border-gray-200 rounded-xl hover:border-orange-500 hover:shadow-xl transition-all group">
              <div className="w-16 h-16 bg-orange-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-orange-500 group-hover:scale-110 transition-all">
                <Home className="text-orange-600 group-hover:text-white" size={32} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Residencias
              </h3>
              <p className="text-gray-600 mb-4">
                Control de plagas completo, confiable y ecológico para hogares. Técnicos certificados por el Ministerio de Salud de Guatemala.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-orange-600" />
                  Tratamientos ecológicos y seguros
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-orange-600" />
                  Protección para toda la familia
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-orange-600" />
                  Servicio personalizado y confiable
                </li>
              </ul>
            </div>

            {/* Fumigación General */}
            <div className="p-8 border-2 border-gray-200 rounded-xl hover:border-orange-500 hover:shadow-xl transition-all group">
              <div className="w-16 h-16 bg-orange-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-orange-500 group-hover:scale-110 transition-all">
                <Bug className="text-orange-600 group-hover:text-white" size={32} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Fumigación General
              </h3>
              <p className="text-gray-600 mb-4">
                Servicios completos de fumigación para eliminar plagas en instalaciones industriales, almacenes y áreas de almacenamiento.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-orange-600" />
                  Fumigación con productos certificados
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-orange-600" />
                  Control de insectos y roedores
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-orange-600" />
                  Tratamientos preventivos
                </li>
              </ul>
            </div>

            {/* Control de Roedores */}
            <div className="p-8 border-2 border-gray-200 rounded-xl hover:border-orange-500 hover:shadow-xl transition-all group">
              <div className="w-16 h-16 bg-orange-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-orange-500 group-hover:scale-110 transition-all">
                <Warehouse className="text-orange-600 group-hover:text-white" size={32} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Control de Roedores
              </h3>
              <p className="text-gray-600 mb-4">
                Programas especializados de control y erradicación de roedores en instalaciones de almacenamiento y producción.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-orange-600" />
                  Inspección y diagnóstico
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-orange-600" />
                  Instalación de trampas
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-orange-600" />
                  Monitoreo continuo
                </li>
              </ul>
            </div>

            {/* Tratamiento Cuarentenario */}
            <div className="p-8 border-2 border-gray-200 rounded-xl hover:border-orange-500 hover:shadow-xl transition-all group">
              <div className="w-16 h-16 bg-orange-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-orange-500 group-hover:scale-110 transition-all">
                <Ship className="text-orange-600 group-hover:text-white" size={32} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Tratamiento Cuarentenario
              </h3>
              <p className="text-gray-600 mb-4">
                Servicios de tratamiento cuarentenario OIRSA para barcos y cargas, cumpliendo con normativas internacionales.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-orange-600" />
                  Certificación OIRSA
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-orange-600" />
                  Muestreo y análisis
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-orange-600" />
                  Documentación completa
                </li>
              </ul>
            </div>

            {/* Muestreo de Granos */}
            <div className="p-8 border-2 border-gray-200 rounded-xl hover:border-orange-500 hover:shadow-xl transition-all group">
              <div className="w-16 h-16 bg-orange-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-orange-500 group-hover:scale-110 transition-all">
                <ClipboardCheck className="text-orange-600 group-hover:text-white" size={32} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Muestreo de Granos
              </h3>
              <p className="text-gray-600 mb-4">
                Análisis profesional de granos para detectar plagas, determinar calidad y asegurar el cumplimiento de estándares.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-orange-600" />
                  Muestreo certificado
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-orange-600" />
                  Análisis de insectos
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-orange-600" />
                  Reportes detallados
                </li>
              </ul>
            </div>

            {/* Tratamientos Especiales */}
            <div className="p-8 border-2 border-gray-200 rounded-xl hover:border-orange-500 hover:shadow-xl transition-all group">
              <div className="w-16 h-16 bg-orange-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-orange-500 group-hover:scale-110 transition-all">
                <FlaskConical className="text-orange-600 group-hover:text-white" size={32} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Tratamientos Especiales
              </h3>
              <p className="text-gray-600 mb-4">
                Servicios especializados para termitas, chinches de cama, alacranes, polillas, murciélagos, gorgojos y más.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-orange-600" />
                  Control de termitas
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-orange-600" />
                  Eliminación de chinches
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-orange-600" />
                  Tratamientos personalizados
                </li>
              </ul>
            </div>

            {/* Aspersión en Banda */}
            <div className="p-8 border-2 border-gray-200 rounded-xl hover:border-orange-500 hover:shadow-xl transition-all group">
              <div className="w-16 h-16 bg-orange-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-orange-500 group-hover:scale-110 transition-all">
                <Shield className="text-orange-600 group-hover:text-white" size={32} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Aspersión en Banda
              </h3>
              <p className="text-gray-600 mb-4">
                Tratamientos de aspersión dirigidos para protección perimetral y en áreas específicas de alto riesgo.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-orange-600" />
                  Aplicación profesional
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-orange-600" />
                  Productos seguros y efectivos
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-orange-600" />
                  Programación flexible
                </li>
              </ul>
            </div>

            {/* Desinfección de Ambientes */}
            <div className="p-8 border-2 border-gray-200 rounded-xl hover:border-orange-500 hover:shadow-xl transition-all group">
              <div className="w-16 h-16 bg-orange-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-orange-500 group-hover:scale-110 transition-all">
                <Zap className="text-orange-600 group-hover:text-white" size={32} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Desinfección de Ambientes
              </h3>
              <p className="text-gray-600 mb-4">
                Servicios de desinfección para eliminar bacterias, virus y microorganismos en ambientes industriales y comerciales.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-orange-600" />
                  Desinfección profunda
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-orange-600" />
                  Productos certificados
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-orange-600" />
                  Ambientes seguros y saludables
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 px-4 bg-gradient-to-br from-gray-50 to-orange-50">
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
              <div className="w-20 h-20 bg-orange-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Award className="text-white" size={40} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Certificaciones</h3>
              <p className="text-gray-600">Certificados OIRSA y cumplimiento de normativas internacionales</p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-orange-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Users className="text-white" size={40} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Experiencia</h3>
              <p className="text-gray-600">Equipo de técnicos especializados con años de experiencia</p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-orange-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <TrendingUp className="text-white" size={40} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Tecnología</h3>
              <p className="text-gray-600">Plataforma digital para seguimiento y gestión de servicios</p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-orange-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Shield className="text-white" size={40} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Garantía</h3>
              <p className="text-gray-600">Resultados garantizados y seguimiento post-servicio</p>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Features */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Plataforma Digital Integrada
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Gestiona todos tus servicios, reportes y documentación desde una sola plataforma intuitiva y poderosa.
              </p>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <ClipboardCheck className="text-orange-600" size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Gestión de Reportes</h3>
                    <p className="text-gray-600">Registra y gestiona todos tus reportes de servicio con documentación completa y trazabilidad.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Warehouse className="text-orange-600" size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Monitoreo de Granos</h3>
                    <p className="text-gray-600">Control completo de silos, lotes y seguimiento de granos desde su llegada hasta almacenamiento.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Ship className="text-orange-600" size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Fondeo de Barcos</h3>
                    <p className="text-gray-600">Registro y seguimiento de barcos, tratamientos cuarentenarios y muestreos de granos.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-8 shadow-2xl">
                <div className="bg-white rounded-lg overflow-hidden shadow-xl">
                  <div className="bg-gray-100 px-4 py-2 flex items-center gap-2 border-b">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <div className="flex-1 text-center text-xs text-gray-500 font-medium">FYSA SaaS - Sistema de Gestión</div>
                  </div>
                  <div className="p-6 bg-gray-50">
                    <div className="space-y-4">
                      <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-orange-600">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-gray-900">Reportes del Mes</span>
                          <span className="text-xs text-gray-500">156</span>
                        </div>
                        <div className="text-xs text-gray-600">+12% vs mes anterior</div>
                      </div>
                      <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-600">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-gray-900">Silos Activos</span>
                          <span className="text-xs text-gray-500">30/30</span>
                        </div>
                        <div className="text-xs text-gray-600">Capacidad: 65%</div>
                      </div>
                      <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-green-600">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-gray-900">Barcos Registrados</span>
                          <span className="text-xs text-gray-500">24</span>
                        </div>
                        <div className="text-xs text-gray-600">Este mes</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-orange-600 to-orange-700 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">
            ¿Listo para Proteger tu Negocio?
          </h2>
          <p className="text-xl text-orange-100 mb-8">
            Contáctanos hoy y descubre cómo FYSA puede ayudarte a mantener tus instalaciones libres de plagas
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/contactanos"
              className="px-8 py-4 bg-white text-orange-600 rounded-lg font-semibold hover:bg-orange-50 transition-all transform hover:scale-105 shadow-lg"
            >
              Solicitar Cotización
            </Link>
            <Link
              to="/login"
              className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-lg font-semibold hover:bg-white/10 transition-all"
            >
              Acceder al Sistema
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
