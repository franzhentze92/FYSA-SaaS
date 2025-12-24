import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, Clock, MessageSquare, CheckCircle2 } from 'lucide-react';

const Contactanos: React.FC = () => {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    mensaje: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Aquí puedes agregar la lógica para enviar el formulario
    console.log('Formulario enviado:', formData);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ nombre: '', email: '', telefono: '', mensaje: '' });
    }, 3000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };


  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative text-white py-20 px-4 overflow-hidden" style={{ backgroundColor: '#db7f3a' }}>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Contáctanos
            </h1>
            <p className="text-xl md:text-2xl max-w-3xl mx-auto" style={{ color: 'rgba(255, 255, 255, 0.95)' }}>
              Estamos aquí para ayudarte. Envíanos un mensaje y te responderemos lo antes posible.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Información de Contacto */}
            <div className="lg:col-span-1">
              <h2 className="text-3xl font-bold text-gray-900 mb-8">
                Información de Contacto
              </h2>
              
              <div className="space-y-6 mb-8">
                <div className="flex items-start gap-4 p-4 rounded-xl border" style={{ backgroundColor: 'rgba(219, 127, 58, 0.1)', borderColor: 'rgba(219, 127, 58, 0.3)' }}>
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#db7f3a' }}>
                    <Mail className="text-white" size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Email</h3>
                    <a href="mailto:info@fysa-gt.com" className="transition-colors" style={{ color: '#db7f3a' }} onMouseEnter={(e) => e.currentTarget.style.color = '#c46f2f'} onMouseLeave={(e) => e.currentTarget.style.color = '#db7f3a'}>
                      info@fysa-gt.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Phone className="text-white" size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Teléfono</h3>
                    <a href="tel:+50212345678" className="text-blue-600 hover:text-blue-700 transition-colors block">
                      +502 1234-5678
                    </a>
                    <a href="tel:+50287654321" className="text-blue-600 hover:text-blue-700 transition-colors block">
                      +502 8765-4321
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                  <div className="w-12 h-12 bg-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="text-white" size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Dirección</h3>
                    <p className="text-gray-700">
                      35 Calle A 9-44, Z-11 Colonia Las Charcas, Guatemala
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-purple-50 rounded-xl border border-purple-200">
                  <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock className="text-white" size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Horario de Atención</h3>
                    <div className="space-y-1 text-sm text-gray-700">
                      <div className="flex justify-between gap-4">
                        <span className="font-medium">Lun - Vie:</span>
                        <span>8:00 AM - 6:00 PM</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="font-medium">Domingos:</span>
                        <span>Cerrado</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Beneficios Rápidos */}
              <div className="bg-gradient-to-br from-gray-50 rounded-xl p-6 border border-gray-200" style={{ background: 'linear-gradient(to bottom right, #f9fafb, rgba(219, 127, 58, 0.1))' }}>
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <MessageSquare style={{ color: '#db7f3a' }} size={20} />
                  ¿Por qué contactarnos?
                </h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 size={16} style={{ color: '#db7f3a' }} className="flex-shrink-0 mt-0.5" />
                    <span>Respuesta rápida en menos de 24 horas</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 size={16} style={{ color: '#db7f3a' }} className="flex-shrink-0 mt-0.5" />
                    <span>Cotización gratuita sin compromiso</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 size={16} style={{ color: '#db7f3a' }} className="flex-shrink-0 mt-0.5" />
                    <span>Asesoría técnica especializada</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Formulario de Contacto */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl border-2 border-gray-200 p-8 shadow-lg">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Envíanos un Mensaje
                </h2>
                <p className="text-gray-600 mb-8">
                  Completa el formulario y nos pondremos en contacto contigo lo antes posible
                </p>

                {submitted && (
                  <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-3">
                    <CheckCircle2 className="text-emerald-600" size={24} />
                    <div>
                      <p className="font-semibold text-emerald-900">¡Mensaje enviado con éxito!</p>
                      <p className="text-sm text-emerald-700">Te responderemos pronto.</p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre Completo *
                      </label>
                      <input
                        type="text"
                        id="nombre"
                        name="nombre"
                        value={formData.nombre}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none transition-all"
                        onFocus={(e) => e.currentTarget.style.boxShadow = '0 0 0 2px rgba(219, 127, 58, 0.5)'}
                        onBlur={(e) => e.currentTarget.style.boxShadow = ''}
                        placeholder="Tu nombre completo"
                      />
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none transition-all"
                        onFocus={(e) => e.currentTarget.style.boxShadow = '0 0 0 2px rgba(219, 127, 58, 0.5)'}
                        onBlur={(e) => e.currentTarget.style.boxShadow = ''}
                        placeholder="tu@email.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono *
                    </label>
                    <input
                      type="tel"
                      id="telefono"
                      name="telefono"
                      value={formData.telefono}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none transition-all"
                      onFocus={(e) => e.currentTarget.style.boxShadow = '0 0 0 2px rgba(219, 127, 58, 0.5)'}
                      onBlur={(e) => e.currentTarget.style.boxShadow = ''}
                      placeholder="+502 1234-5678"
                    />
                  </div>

                  <div>
                    <label htmlFor="mensaje" className="block text-sm font-medium text-gray-700 mb-2">
                      Mensaje *
                    </label>
                    <textarea
                      id="mensaje"
                      name="mensaje"
                      value={formData.mensaje}
                      onChange={handleChange}
                      required
                      rows={6}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none transition-all resize-none"
                      onFocus={(e) => e.currentTarget.style.boxShadow = '0 0 0 2px rgba(219, 127, 58, 0.5)'}
                      onBlur={(e) => e.currentTarget.style.boxShadow = ''}
                      placeholder="Cuéntanos sobre tu necesidad o consulta..."
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full px-6 py-4 text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                    style={{ backgroundColor: '#db7f3a' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#c46f2f'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#db7f3a'}
                  >
                    <Send size={20} />
                    Enviar Mensaje
                  </button>

                  <p className="text-xs text-gray-500 text-center">
                    Al enviar este formulario, aceptas que nos pongamos en contacto contigo para responder tu consulta.
                  </p>
                </form>
              </div>
            </div>
          </div>

          {/* Mapa */}
          <div className="mt-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
              Nuestra Ubicación
            </h2>
            <div className="rounded-xl overflow-hidden shadow-xl border-2 border-gray-200">
              <iframe
                src="https://www.google.com/maps?q=35+Calle+A+9-44,+Zona+11,+Colonia+Las+Charcas,+Guatemala+City,+Guatemala&output=embed&hl=es"
                width="100%"
                height="450"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full"
                title="Ubicación de FYSA"
              ></iframe>
            </div>
            <p className="text-sm text-gray-500 mt-4 text-center">
              35 Calle A 9-44, Z-11 Colonia Las Charcas, Guatemala
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contactanos;
