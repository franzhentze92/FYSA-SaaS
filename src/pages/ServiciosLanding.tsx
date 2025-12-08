import React from 'react';
import { Bug, Warehouse, Ship, ClipboardCheck, Shield, Zap, CheckCircle2, Building2, Home, FlaskConical } from 'lucide-react';

const ServiciosLanding: React.FC = () => {
  const servicios = [
    {
      icon: Building2,
      title: 'Industria y Comercio',
      description: 'Prevención y control de plagas con altos estándares de calidad. Todos nuestros técnicos están capacitados con nuevas técnicas de control de plagas, uso de químicos y entomología. Cumplimiento con normas ISO, HACCP, GMP, POES y otras certificaciones de calidad.',
      features: [
        'Plantas de procesamiento de alimentos',
        'Supermercados y centros comerciales',
        'Industria pecuaria y agropecuaria',
        'Fábricas y plantas industriales',
        'Industria hotelera',
        'Instituciones de enseñanza',
        'Oficinas y edificios corporativos',
        'Bodegas y centros de distribución',
        'Hospitales y Centros de Salud',
        'Cumplimiento ISO, HACCP, GMP, POES'
      ],
      color: 'orange'
    },
    {
      icon: Home,
      title: 'Residencias',
      description: 'Control de plagas completo, confiable y conveniente para hogares. Servicios ecológicos que respetan el medio ambiente y la salud de su familia. Técnicos certificados por el Ministerio de Salud de Guatemala.',
      features: [
        'Tratamientos ecológicos y seguros',
        'Protección para toda la familia',
        'Servicio personalizado y confiable',
        'Técnicos certificados y capacitados',
        'Respeto al medio ambiente',
        'Uso responsable de productos'
      ],
      color: 'blue'
    },
    {
      icon: Bug,
      title: 'Fumigación General',
      description: 'Servicios completos de fumigación para eliminar plagas en instalaciones industriales, almacenes y áreas de almacenamiento. Utilizamos solo productos autorizados por el Ministerio de Salud de Guatemala.',
      features: [
        'Fumigación con productos certificados',
        'Control integral de insectos y plagas',
        'Tratamientos preventivos y correctivos',
        'Certificación y documentación completa',
        'Seguimiento post-tratamiento',
        'Productos autorizados por Ministerio de Salud'
      ],
      color: 'emerald'
    },
    {
      icon: Warehouse,
      title: 'Control de Roedores',
      description: 'Programas especializados de control y erradicación de roedores en instalaciones de almacenamiento, producción y áreas comerciales. Soluciones personalizadas según el tipo de instalación.',
      features: [
        'Inspección y diagnóstico profesional',
        'Instalación de trampas y sistemas de control',
        'Monitoreo continuo y reportes',
        'Estrategias de prevención',
        'Manejo integrado de plagas',
        'Control en bodegas y almacenes'
      ],
      color: 'purple'
    },
    {
      icon: Ship,
      title: 'Tratamiento Cuarentenario OIRSA',
      description: 'Servicios de tratamiento cuarentenario para barcos y cargas, cumpliendo con normativas internacionales y certificaciones OIRSA. Garantizamos el cumplimiento de todos los requisitos sanitarios.',
      features: [
        'Certificación OIRSA completa',
        'Muestreo y análisis de granos',
        'Tratamiento de barcos y cargas',
        'Documentación y trazabilidad',
        'Cumplimiento normativo internacional',
        'Servicios para importación/exportación'
      ],
      color: 'red'
    },
    {
      icon: ClipboardCheck,
      title: 'Muestreo de Granos',
      description: 'Análisis profesional de granos para detectar plagas, determinar calidad y asegurar el cumplimiento de estándares. Servicios certificados con reportes detallados.',
      features: [
        'Muestreo certificado y profesional',
        'Análisis de insectos y plagas',
        'Evaluación de calidad de granos',
        'Reportes detallados y documentación',
        'Asesoría técnica especializada',
        'Control de calidad de granos almacenados'
      ],
      color: 'amber'
    },
    {
      icon: Shield,
      title: 'Aspersión en Banda',
      description: 'Tratamientos de aspersión dirigidos para protección perimetral y en áreas específicas de alto riesgo. Aplicación profesional con productos seguros y efectivos.',
      features: [
        'Aplicación profesional y dirigida',
        'Productos seguros y certificados',
        'Protección perimetral',
        'Programación flexible según necesidades',
        'Mantenimiento preventivo',
        'Protocolo de 3 Zonas (Verde, Amarillo, Rojo)'
      ],
      color: 'indigo'
    },
    {
      icon: Zap,
      title: 'Gasificación y Encarpado',
      description: 'Servicios especializados de gasificación y encarpado para tratamiento de áreas grandes y almacenamiento. Soluciones efectivas para control de plagas en espacios amplios.',
      features: [
        'Gasificación profesional',
        'Encarpado y sellado de áreas',
        'Tratamiento de grandes volúmenes',
        'Equipos especializados',
        'Control de calidad garantizado',
        'Liberación de encarpado certificada'
      ],
      color: 'teal'
    },
    {
      icon: Warehouse,
      title: 'Liberación de Encarpado',
      description: 'Servicios de liberación y retiro de encarpados después de tratamientos. Aseguramos la correcta remoción y verificación de resultados del tratamiento.',
      features: [
        'Retiro profesional de encarpados',
        'Verificación de resultados',
        'Limpieza y preparación de áreas',
        'Documentación de liberación',
        'Certificación de proceso completo',
        'Inspección post-tratamiento'
      ],
      color: 'pink'
    },
    {
      icon: FlaskConical,
      title: 'Tratamientos Especiales',
      description: 'Servicios especializados para termitas, chinches de cama, alacranes, polillas, murciélagos, gorgojos, pulgas y garrapatas. Tratamientos personalizados según el tipo de plaga.',
      features: [
        'Control de termitas (sobre y bajo tierra)',
        'Eliminación de chinches de cama',
        'Control de alacranes y escorpiones',
        'Tratamiento de polillas',
        'Control de murciélagos',
        'Eliminación de gorgojos',
        'Control de pulgas y garrapatas',
        'Tratamientos personalizados'
      ],
      color: 'rose'
    },
    {
      icon: Zap,
      title: 'Desinfección de Ambientes',
      description: 'Servicios de desinfección para eliminar bacterias, virus y microorganismos en ambientes industriales y comerciales. Garantizamos ambientes seguros y saludables.',
      features: [
        'Desinfección profunda',
        'Productos certificados y seguros',
        'Ambientes seguros y saludables',
        'Eliminación de bacterias y virus',
        'Control de microorganismos',
        'Certificación de desinfección'
      ],
      color: 'cyan'
    },
    {
      icon: Zap,
      title: 'Servicios Generales',
      description: 'Soluciones personalizadas para necesidades específicas de control de plagas y mantenimiento preventivo. Consultoría especializada y planes adaptados a tu negocio.',
      features: [
        'Consultoría especializada',
        'Planes de mantenimiento personalizados',
        'Soporte técnico 24/7',
        'Soluciones a medida',
        'Asesoría en prevención de plagas',
        'Manejo Integrado de Plagas (MIP)'
      ],
      color: 'violet'
    }
  ];

  return (
    <div className="min-h-screen bg-white py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Nuestros Servicios de Control de Plagas
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Soluciones integrales y profesionales para proteger tus instalaciones, granos y productos almacenados. 
            Tenemos la capacidad de atender cualquier tipo de plaga en cualquier industria, comercio o residencia.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {servicios.map((servicio, index) => {
            const Icon = servicio.icon;
            const colorClasses: Record<string, string> = {
              orange: 'bg-orange-100 text-orange-600',
              blue: 'bg-blue-100 text-blue-600',
              emerald: 'bg-emerald-100 text-emerald-600',
              purple: 'bg-purple-100 text-purple-600',
              red: 'bg-red-100 text-red-600',
              amber: 'bg-amber-100 text-amber-600',
              indigo: 'bg-indigo-100 text-indigo-600',
              teal: 'bg-teal-100 text-teal-600',
              pink: 'bg-pink-100 text-pink-600',
              rose: 'bg-rose-100 text-rose-600',
              cyan: 'bg-cyan-100 text-cyan-600',
              violet: 'bg-violet-100 text-violet-600',
            };
            
            return (
              <div
                key={index}
                className="p-8 border-2 border-gray-200 rounded-xl hover:shadow-xl transition-all bg-white"
              >
                <div className={`w-16 h-16 ${colorClasses[servicio.color]} rounded-xl flex items-center justify-center mb-6`}>
                  <Icon size={32} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  {servicio.title}
                </h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  {servicio.description}
                </p>
                <ul className="space-y-3">
                  {servicio.features.map((feature, idx) => {
                    const iconColorClasses: Record<string, string> = {
                      orange: 'text-orange-600',
                      blue: 'text-blue-600',
                      emerald: 'text-emerald-600',
                      purple: 'text-purple-600',
                      red: 'text-red-600',
                      amber: 'text-amber-600',
                      indigo: 'text-indigo-600',
                      teal: 'text-teal-600',
                      pink: 'text-pink-600',
                      rose: 'text-rose-600',
                      cyan: 'text-cyan-600',
                      violet: 'text-violet-600',
                    };
                    return (
                      <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                        <CheckCircle2 size={18} className={`${iconColorClasses[servicio.color]} flex-shrink-0 mt-0.5`} />
                        <span>{feature}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Protocolo de 3 Zonas */}
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-12 mb-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Protocolo de 3 Zonas
            </h2>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto">
              Dividimos las zonas de una estructura y sus alrededores para aplicar un protocolo de trabajo específico 
              para cada área, obteniendo un mejor control de las plagas con el menor impacto para los usuarios y el medio ambiente.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border-2 border-green-500">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl font-bold">V</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">Zona Verde</h3>
              <p className="text-gray-600 text-center">Áreas de bajo riesgo con tratamientos preventivos suaves</p>
            </div>
            <div className="bg-white p-6 rounded-xl border-2 border-yellow-500">
              <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl font-bold">A</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">Zona Amarilla</h3>
              <p className="text-gray-600 text-center">Áreas de riesgo medio con monitoreo y tratamientos moderados</p>
            </div>
            <div className="bg-white p-6 rounded-xl border-2 border-red-500">
              <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl font-bold">R</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">Zona Roja</h3>
              <p className="text-gray-600 text-center">Áreas de alto riesgo con tratamientos intensivos y monitoreo constante</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-orange-600 to-orange-700 rounded-2xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">
            ¿Necesitas un Servicio Personalizado?
          </h2>
          <p className="text-xl text-orange-100 mb-8 max-w-2xl mx-auto">
            Contáctanos para una consulta gratuita y descubre cómo podemos ayudarte a proteger tu negocio o residencia
          </p>
          <a
            href="/contactanos"
            className="inline-block px-8 py-4 bg-white text-orange-600 rounded-lg font-semibold hover:bg-orange-50 transition-all transform hover:scale-105 shadow-lg"
          >
            Solicitar Cotización
          </a>
        </div>
      </div>
    </div>
  );
};

export default ServiciosLanding;
