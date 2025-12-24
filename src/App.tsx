
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import MainLayout from "@/components/MainLayout";
import PublicLayout from "@/components/PublicLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import ScrollToTop from "@/components/ScrollToTop";
import Landing from "./pages/Landing";
import SobreNosotros from "./pages/SobreNosotros";
import ServiciosLanding from "./pages/ServiciosLanding";
import Tienda from "./pages/Tienda";
import Carrito from "./pages/Carrito";
import Contactanos from "./pages/Contactanos";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Lotes from "./pages/Lotes";
import Barcos from "./pages/Barcos";
import HistorialLotes from "./pages/HistorialLotes";
import BarcosMaestros from "./pages/BarcosMaestros";
import GranosVariedades from "./pages/GranosVariedades";
import Documentacion from "./pages/Documentacion";
import Servicios from "./pages/Servicios";
import ServicioDetalle from "./pages/ServicioDetalle";
import Facturas from "./pages/Facturas";
import ReportesFacturas from "./pages/ReportesFacturas";
import FacturasFormitize from "./pages/FacturasFormitize";
import TrabajosFormitize from "./pages/TrabajosFormitize";
import FormulariosFormitize from "./pages/FormulariosFormitize";
import CotizacionesFormitize from "./pages/CotizacionesFormitize";
import ServiciosFacturacion from "./pages/ServiciosFacturacion";
import PerdidaEconomica from "./pages/PerdidaEconomica";
import AdminServicios from "./pages/AdminServicios";
import AdminReportesServicios from "./pages/AdminReportesServicios";
import AdminFacturas from "./pages/AdminFacturas";
import AdminBarcos from "./pages/AdminBarcos";
import AdminFondeoBarcos from "./pages/AdminFondeoBarcos";
import AdminSilosLotes from "./pages/AdminSilosLotes";
import AnalisisFumigacionAprovigra from "./pages/AnalisisFumigacionAprovigra";
import AdminMonitoreoGranosAP from "./pages/AdminMonitoreoGranosAP";
import HistorialPerdida from "./pages/HistorialPerdida";
import FumigacionSilos from "./pages/FumigacionSilos";
import DashboardMonitoreoGranos from "./pages/DashboardMonitoreoGranos";
import AdminMapasCalor from "./pages/AdminMapasCalor";
import AdminTienda from "./pages/AdminTienda";
import ControlRoedores from "./pages/ControlRoedores";
import ControlInsectosVoladores from "./pages/ControlInsectosVoladores";
import InsectosID from "./pages/InsectosID";
import NotFound from "./pages/NotFound";
import { AppProvider } from "@/contexts/AppContext";
import { CartProvider } from "@/contexts/CartContext";
import { initializeUsers } from "@/services/userService";

const queryClient = new QueryClient();

// Inicializar usuarios al cargar la aplicación
initializeUsers();

const App = () => (
  <ThemeProvider defaultTheme="light">
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <AppProvider>
            <CartProvider>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<PublicLayout><Landing /></PublicLayout>} />
                <Route path="/sobre-nosotros" element={<PublicLayout><SobreNosotros /></PublicLayout>} />
                <Route path="/servicios" element={<PublicLayout><ServiciosLanding /></PublicLayout>} />
                <Route path="/tienda" element={<PublicLayout><Tienda /></PublicLayout>} />
                <Route path="/carrito" element={<PublicLayout><Carrito /></PublicLayout>} />
                <Route path="/contactanos" element={<PublicLayout><Contactanos /></PublicLayout>} />
                <Route path="/login" element={<Login />} />

              {/* Protected Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Dashboard />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/lotes"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Lotes />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/barcos"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Barcos />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/historial-lotes"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <HistorialLotes />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/barcos-maestros"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <BarcosMaestros />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/granos-variedades"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <GranosVariedades />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/documentacion"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Documentacion />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/servicios-app"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Servicios />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/servicios-app/:id"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <ServicioDetalle />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/facturas"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Facturas />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reportes-facturas"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <ReportesFacturas />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/facturas-formitize"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <FacturasFormitize />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/trabajos-formitize"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <TrabajosFormitize />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/formularios-formitize"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <FormulariosFormitize />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/cotizaciones-formitize"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <CotizacionesFormitize />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/servicios-facturacion"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <ServiciosFacturacion />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
                    <Route
                      path="/perdida-economica"
                      element={
                        <ProtectedRoute>
                          <MainLayout>
                            <PerdidaEconomica />
                          </MainLayout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/mapas-calor/control-roedores"
                      element={
                        <ProtectedRoute>
                          <MainLayout>
                            <ControlRoedores />
                          </MainLayout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/mapas-calor/control-insectos-voladores"
                      element={
                        <ProtectedRoute>
                          <MainLayout>
                            <ControlInsectosVoladores />
                          </MainLayout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/servicios"
                      element={
                        <ProtectedRoute>
                          <MainLayout>
                            <AdminServicios />
                          </MainLayout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/reportes-servicios"
                      element={
                        <ProtectedRoute>
                          <MainLayout>
                            <AdminReportesServicios />
                          </MainLayout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/mapas-calor"
                      element={
                        <ProtectedRoute>
                          <MainLayout>
                            <AdminMapasCalor />
                          </MainLayout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/tienda"
                      element={
                        <ProtectedRoute>
                          <MainLayout>
                            <AdminTienda />
                          </MainLayout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/facturas"
                      element={
                        <ProtectedRoute>
                          <MainLayout>
                            <AdminFacturas />
                          </MainLayout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/barcos"
                      element={
                        <ProtectedRoute>
                          <MainLayout>
                            <AdminBarcos />
                          </MainLayout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/fondeo-barcos"
                      element={
                        <ProtectedRoute>
                          <MainLayout>
                            <AdminFondeoBarcos />
                          </MainLayout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/silos-lotes"
                      element={
                        <ProtectedRoute>
                          <MainLayout>
                            <AdminSilosLotes />
                          </MainLayout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/analisis/fumigacion-aprovigra"
                      element={
                        <ProtectedRoute>
                          <MainLayout>
                            <AnalisisFumigacionAprovigra />
                          </MainLayout>
                        </ProtectedRoute>
                      }
                    />
              <Route
                path="/admin/dashboard-monitoreo-granos"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <DashboardMonitoreoGranos />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/monitoreo-granos-ap"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <AdminMonitoreoGranosAP />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
                    <Route
                      path="/admin/historial-perdida"
                      element={
                        <ProtectedRoute>
                          <MainLayout>
                            <HistorialPerdida />
                          </MainLayout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/fumigacion-silos"
                      element={
                        <ProtectedRoute>
                          <MainLayout>
                            <FumigacionSilos />
                          </MainLayout>
                        </ProtectedRoute>
                      }
                    />
                    {/* Temporarily hidden - Insectos ID page
                    <Route
                      path="/insectos-id"
                      element={
                        <ProtectedRoute>
                          <MainLayout>
                            <InsectosID />
                          </MainLayout>
                        </ProtectedRoute>
                      }
                    />
                    */}
                    <Route path="*" element={<PublicLayout><NotFound /></PublicLayout>} />
              </Routes>
            </CartProvider>
          </AppProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
