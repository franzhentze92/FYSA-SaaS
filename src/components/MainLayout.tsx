import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarMenuAction,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
  useSidebar,
} from '@/components/ui/sidebar';
import { LayoutDashboard, Warehouse, Ship, Settings, Database, History, FileText, ClipboardList, ChevronRight, Receipt, TrendingDown, FileCheck, BarChart3, Map, Bug, Activity, Wrench, ShoppingBag } from 'lucide-react';

// Custom icons for Mapas de Calor
const RatIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {/* Head - circle */}
    <circle cx="8" cy="10" r="3.5" fill="currentColor"/>
    {/* Body - oval behind head */}
    <ellipse cx="11" cy="12" rx="3.5" ry="4" fill="currentColor"/>
    {/* Large round ears */}
    <circle cx="6" cy="8" r="1.8" fill="currentColor"/>
    <circle cx="10" cy="8" r="1.8" fill="currentColor"/>
    {/* Small eyes */}
    <circle cx="7" cy="10" r="0.8" fill="white"/>
    <circle cx="9" cy="10" r="0.8" fill="white"/>
    {/* Pointed nose */}
    <ellipse cx="5.5" cy="11" rx="0.6" ry="0.8" fill="white"/>
    {/* Whiskers - three lines from nose */}
    <line x1="4.5" y1="10.5" x2="2.5" y2="10.5" stroke="currentColor" strokeWidth="1.5"/>
    <line x1="4.5" y1="11.5" x2="2" y2="12.5" stroke="currentColor" strokeWidth="1.5"/>
    <line x1="4.5" y1="9.5" x2="2" y2="8.5" stroke="currentColor" strokeWidth="1.5"/>
    {/* Long curved tail */}
    <path d="M14.5 12 Q18 10, 20 8 Q21.5 6, 21.5 4" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const BeetleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    {/* Beetle body/elytra */}
    <ellipse cx="12" cy="12" rx="7" ry="5" fill="currentColor"/>
    {/* Head */}
    <ellipse cx="12" cy="6" rx="2.5" ry="2" fill="currentColor"/>
    {/* Antennae */}
    <path d="M10 4 Q8 2, 6 3" stroke="currentColor" fill="none" strokeWidth="1.5"/>
    <path d="M14 4 Q16 2, 18 3" stroke="currentColor" fill="none" strokeWidth="1.5"/>
    <circle cx="6" cy="3" r="0.8" fill="currentColor"/>
    <circle cx="18" cy="3" r="0.8" fill="currentColor"/>
    {/* Legs */}
    <path d="M6 12 L4 16" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M8 13 L6 17" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M18 12 L20 16" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M16 13 L18 17" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M10 16 L10 20" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M14 16 L14 20" stroke="currentColor" strokeWidth="1.5"/>
    {/* Wing division line */}
    <path d="M12 8 L12 16" stroke="white" strokeWidth="0.8" opacity="0.6"/>
    {/* Spots on elytra */}
    <circle cx="9" cy="11" r="1" fill="white" opacity="0.4"/>
    <circle cx="15" cy="11" r="1" fill="white" opacity="0.4"/>
  </svg>
);
import UserMenu from '@/components/UserMenu';

interface MainLayoutProps {
  children: React.ReactNode;
}

const SidebarHeaderContent: React.FC = () => {
  const { state } = useSidebar();
  
  return (
    <div className="flex items-center justify-center px-2 py-4">
      {state === "expanded" && (
        <img 
          src="/LOGO_PNG.png" 
          alt="FYSA Logo" 
          className="h-12 w-auto"
        />
      )}
    </div>
  );
};

const MainLayoutContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { state: sidebarState } = useSidebar();
  const [serviciosOpen, setServiciosOpen] = useState(false);
  const [mapasCalorOpen, setMapasCalorOpen] = useState(false);
  const [monitoreoGranosOpen, setMonitoreoGranosOpen] = useState(false);
  const [facturacionOpen, setFacturacionOpen] = useState(false);
  // Admin states
  const [adminServiciosOpen, setAdminServiciosOpen] = useState(false);
  const [adminFacturacionOpen, setAdminFacturacionOpen] = useState(false);
  const [adminMonitoreoGranosOpen, setAdminMonitoreoGranosOpen] = useState(false);
  const [adminTiendaOpen, setAdminTiendaOpen] = useState(false);
  // Temporarily hidden - const [adminAnalisisOpen, setAdminAnalisisOpen] = useState(false);
  // Temporarily hidden - const [herramientasOpen, setHerramientasOpen] = useState(false);
  const isCollapsed = sidebarState === "collapsed";

  // Obtener usuario actual y verificar rol
  const currentUser = React.useMemo(() => {
    const userJson = localStorage.getItem('fysa-current-user');
    if (!userJson) return null;
    try {
      return JSON.parse(userJson);
    } catch {
      return null;
    }
  }, []);
  
  const userEmail = currentUser?.email || '';
  const isAdmin = currentUser?.role === 'admin';
  
  // Fetch servicios from Supabase
  const [servicios, setServicios] = React.useState<Array<{ id: number; titulo: string; href: string }>>([]);
  
  React.useEffect(() => {
    const fetchServicios = async () => {
      if (isAdmin) {
        // Admin ve todos los servicios disponibles
        setServicios([
          { id: 148998, titulo: 'Aspersión en banda', href: '/servicios-app/148998' },
          { id: 148591, titulo: 'Lib. De Encarpado', href: '/servicios-app/148591' },
          { id: 136260, titulo: 'Fumigación General', href: '/servicios-app/136260' },
          { id: 136259, titulo: 'Muestreo de Granos', href: '/servicios-app/136259' },
          { id: 136257, titulo: 'Gas. y Encarpado', href: '/servicios-app/136257' },
          { id: 136258, titulo: 'Control de Roedores', href: '/servicios-app/136258' },
          { id: 136256, titulo: 'Servicios Generales', href: '/servicios-app/136256' },
          { id: 1362563, titulo: 'Trampas de Luz', href: '/servicios-app/1362563' },
          { id: 1362564, titulo: 'Tratamiento de Contenedores', href: '/servicios-app/1362564' },
          { id: 1362565, titulo: 'Fum. de Silo Vacío', href: '/servicios-app/1362565' },
          { id: 1362566, titulo: 'Fum. Graneleras', href: '/servicios-app/1362566' },
        ]);
      } else if (userEmail) {
        // Cliente solo ve servicios asignados - fetch from Supabase
        try {
          const { supabase } = await import('@/lib/supabase');
          const { SERVICIOS_DISPONIBLES } = await import('@/hooks/useAdminServicios');
          const { data, error } = await supabase
            .from('servicios_asignados')
            .select('*')
            .eq('cliente_email', userEmail)
            .eq('activo', true);

          if (error) throw error;

          const serviciosDelCliente = (data || []).map((s: any) => {
            // Normalizar el título usando SERVICIOS_DISPONIBLES para asegurar nombres consistentes
            const servicioDefinido = SERVICIOS_DISPONIBLES.find(serv => serv.id === s.servicio_id);
            const titulo = servicioDefinido?.titulo || s.servicio_titulo;
            
            return {
              id: s.servicio_id,
              titulo: titulo,
              href: `/servicios-app/${s.servicio_id}`,
            };
          });
          setServicios(serviciosDelCliente);
        } catch (err) {
          console.error('Error fetching servicios:', err);
          setServicios([]);
        }
      } else {
        setServicios([]);
      }
    };

    fetchServicios();
  }, [userEmail, isAdmin]);

  const monitoreoItems = [
    {
      title: 'Dashboard',
      icon: LayoutDashboard,
      href: '/admin/dashboard-monitoreo-granos',
    },
    {
      title: 'Silos y Granos',
      icon: Warehouse,
      href: '/admin/silos-lotes',
    },
    {
      title: 'Movimientos',
      icon: History,
      href: '/historial-lotes',
    },
    {
      title: 'Muestreos',
      icon: FileText,
      href: '/admin/monitoreo-granos-ap',
    },
    {
      title: 'Fumigación de Silos',
      icon: Bug,
      href: '/admin/fumigacion-silos',
    },
    {
      title: 'Trazabilidad',
      icon: Activity,
      href: '/admin/historial-perdida',
    },
    {
      title: 'Análisis de Pérdidas',
      icon: TrendingDown,
      href: '/perdida-economica',
    },
    {
      title: 'Fondeo de Barcos',
      icon: Ship,
      href: '/admin/fondeo-barcos',
    },
    {
      title: 'Catálogo Barcos',
      icon: Database,
      href: '/admin/barcos',
    },
    // Tipos de Granos solo para admin - se renderiza manualmente en la sección de admin
  ].filter(item => item.href !== '/granos-variedades'); // Filtrar Tipos de Granos para clientes


  return (
    <>
      <Sidebar collapsible>
        <SidebarHeader>
          <SidebarHeaderContent />
        </SidebarHeader>
        <SidebarContent>
          {/* Dashboard - Primero */}
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === '/dashboard'}
                    tooltip="Dashboard"
                  >
                    <Link to="/dashboard">
                      <LayoutDashboard />
                      {!isCollapsed && <span>Dashboard</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Servicios - Solo para clientes (no admin) */}
          {!isAdmin && (
            <SidebarGroup>
              {!isCollapsed && <SidebarGroupLabel>Servicios</SidebarGroupLabel>}
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      tooltip="Servicios"
                      data-state={serviciosOpen ? 'open' : 'closed'}
                      onClick={() => setServiciosOpen(!serviciosOpen)}
                    >
                      <ClipboardList />
                      {!isCollapsed && <span>Servicios</span>}
                    </SidebarMenuButton>
                    {!isCollapsed && (
                    <SidebarMenuAction
                      onClick={() => setServiciosOpen(!serviciosOpen)}
                      aria-label="Toggle Servicios"
                    >
                      <ChevronRight
                        className={`transition-transform ${serviciosOpen ? 'rotate-90' : ''}`}
                      />
                    </SidebarMenuAction>
                    )}
                    {serviciosOpen && !isCollapsed && (
                      <SidebarMenuSub>
                        {servicios.map((servicio) => (
                          <SidebarMenuSubItem key={servicio.id}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={location.pathname === servicio.href}
                            >
                              <Link to={servicio.href}>
                                <span>{servicio.titulo}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    )}
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}

          {/* Mapas de Calor - Solo para clientes (no admin) */}
          {!isAdmin && (
            <SidebarGroup>
              {!isCollapsed && <SidebarGroupLabel>Mapas de Calor</SidebarGroupLabel>}
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      tooltip="Mapas de Calor"
                      data-state={mapasCalorOpen ? 'open' : 'closed'}
                      onClick={() => setMapasCalorOpen(!mapasCalorOpen)}
                    >
                      <Map />
                      {!isCollapsed && <span>Mapas de Calor</span>}
                    </SidebarMenuButton>
                    {!isCollapsed && (
                      <SidebarMenuAction
                        onClick={() => setMapasCalorOpen(!mapasCalorOpen)}
                        aria-label="Toggle Mapas de Calor"
                      >
                        <ChevronRight
                          className={`transition-transform ${mapasCalorOpen ? 'rotate-90' : ''}`}
                        />
                      </SidebarMenuAction>
                    )}
                    {mapasCalorOpen && !isCollapsed && (
                      <SidebarMenuSub>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton
                            asChild
                            isActive={location.pathname === '/mapas-calor/control-roedores'}
                          >
                            <Link to="/mapas-calor/control-roedores">
                              <RatIcon className="h-4 w-4" />
                              <span>Roedores</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton
                            asChild
                            isActive={location.pathname === '/mapas-calor/control-insectos-voladores'}
                          >
                            <Link to="/mapas-calor/control-insectos-voladores">
                              <BeetleIcon className="h-4 w-4" />
                              <span>Insectos Voladores</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      </SidebarMenuSub>
                    )}
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}

          {/* Monitoreo de Granos - Solo para clientes (no admin) */}
          {!isAdmin && (
            <SidebarGroup>
              {!isCollapsed && <SidebarGroupLabel>Monitoreo de Granos</SidebarGroupLabel>}
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      tooltip="Monitoreo de Granos"
                      data-state={monitoreoGranosOpen ? 'open' : 'closed'}
                      onClick={() => setMonitoreoGranosOpen(!monitoreoGranosOpen)}
                    >
                      <BarChart3 />
                      {!isCollapsed && <span>Monitoreo de Granos</span>}
                    </SidebarMenuButton>
                    {!isCollapsed && (
                      <SidebarMenuAction
                        onClick={() => setMonitoreoGranosOpen(!monitoreoGranosOpen)}
                        aria-label="Toggle Monitoreo de Granos"
                      >
                        <ChevronRight
                          className={`transition-transform ${monitoreoGranosOpen ? 'rotate-90' : ''}`}
                        />
                      </SidebarMenuAction>
                    )}
                    {monitoreoGranosOpen && !isCollapsed && (
                      <SidebarMenuSub>
                        {monitoreoItems.map((item) => {
                          const Icon = item.icon;
                          const isActive = location.pathname === item.href;
                          return (
                            <SidebarMenuSubItem key={item.href}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={isActive}
                              >
                                <Link to={item.href}>
                                  <Icon className="h-4 w-4" />
                                  <span>{item.title}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          );
                        })}
                      </SidebarMenuSub>
                    )}
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}

                {/* Facturación - Solo para clientes (no admin) */}
                {!isAdmin && (
                  <SidebarGroup>
                    {!isCollapsed && <SidebarGroupLabel>Facturación</SidebarGroupLabel>}
                    <SidebarGroupContent>
                      <SidebarMenu>
                        <SidebarMenuItem>
                          <SidebarMenuButton
                            tooltip="Facturación"
                            data-state={facturacionOpen ? 'open' : 'closed'}
                            onClick={() => setFacturacionOpen(!facturacionOpen)}
                          >
                            <Receipt />
                            {!isCollapsed && <span>Facturación</span>}
                          </SidebarMenuButton>
                          {!isCollapsed && (
                            <SidebarMenuAction
                              onClick={() => setFacturacionOpen(!facturacionOpen)}
                              aria-label="Toggle Facturación"
                            >
                              <ChevronRight
                                className={`transition-transform ${facturacionOpen ? 'rotate-90' : ''}`}
                              />
                            </SidebarMenuAction>
                          )}
                          {facturacionOpen && !isCollapsed && (
                            <SidebarMenuSub>
                              <SidebarMenuSubItem>
                                <SidebarMenuSubButton
                                  asChild
                                  isActive={location.pathname === '/facturas'}
                                >
                                  <Link to="/facturas">
                                    <Receipt className="h-4 w-4" />
                                    <span>Facturas</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                              <SidebarMenuSubItem>
                                <SidebarMenuSubButton
                                  asChild
                                  isActive={location.pathname === '/reportes-facturas'}
                                >
                                  <Link to="/reportes-facturas">
                                    <FileCheck className="h-4 w-4" />
                                    <span>Reportes y Facturas</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            </SidebarMenuSub>
                          )}
                        </SidebarMenuItem>
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>
                )}

          {/* Admin Sections - Solo visible para administradores */}
          {isAdmin && (
            <>
              {/* Servicios Section */}
              <SidebarGroup>
                {!isCollapsed && <SidebarGroupLabel>Servicios</SidebarGroupLabel>}
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        tooltip="Servicios"
                        data-state={adminServiciosOpen ? 'open' : 'closed'}
                        onClick={() => setAdminServiciosOpen(!adminServiciosOpen)}
                      >
                        <Settings />
                        {!isCollapsed && <span>Servicios</span>}
                      </SidebarMenuButton>
                      {!isCollapsed && (
                        <SidebarMenuAction
                          onClick={() => setAdminServiciosOpen(!adminServiciosOpen)}
                          aria-label="Toggle Servicios"
                        >
                          <ChevronRight
                            className={`transition-transform ${adminServiciosOpen ? 'rotate-90' : ''}`}
                          />
                        </SidebarMenuAction>
                      )}
                      {adminServiciosOpen && !isCollapsed && (
                        <SidebarMenuSub>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton
                              asChild
                              isActive={location.pathname === '/admin/reportes-servicios'}
                            >
                              <Link to="/admin/reportes-servicios">
                                <FileText className="h-4 w-4" />
                                <span>Reportes</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton
                              asChild
                              isActive={location.pathname === '/admin/mapas-calor'}
                            >
                              <Link to="/admin/mapas-calor">
                                <Map className="h-4 w-4" />
                                <span>Mapas de Calor</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton
                              asChild
                              isActive={location.pathname === '/admin/servicios'}
                            >
                              <Link to="/admin/servicios">
                                <Settings className="h-4 w-4" />
                                <span>Clientes y Servicios</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        </SidebarMenuSub>
                      )}
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>

              {/* Facturación Section */}
              <SidebarGroup>
                {!isCollapsed && <SidebarGroupLabel>Facturación</SidebarGroupLabel>}
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        tooltip="Facturación"
                        data-state={adminFacturacionOpen ? 'open' : 'closed'}
                        onClick={() => setAdminFacturacionOpen(!adminFacturacionOpen)}
                      >
                        <Receipt />
                        {!isCollapsed && <span>Facturación</span>}
                      </SidebarMenuButton>
                      {!isCollapsed && (
                        <SidebarMenuAction
                          onClick={() => setAdminFacturacionOpen(!adminFacturacionOpen)}
                          aria-label="Toggle Facturación"
                        >
                          <ChevronRight
                            className={`transition-transform ${adminFacturacionOpen ? 'rotate-90' : ''}`}
                          />
                        </SidebarMenuAction>
                      )}
                      {adminFacturacionOpen && !isCollapsed && (
                        <SidebarMenuSub>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton
                              asChild
                              isActive={location.pathname === '/admin/facturas'}
                            >
                              <Link to="/admin/facturas">
                                <Receipt className="h-4 w-4" />
                                <span>Facturas</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton
                              asChild
                              isActive={location.pathname === '/reportes-facturas'}
                            >
                              <Link to="/reportes-facturas">
                                <FileCheck className="h-4 w-4" />
                                <span>Reportes y Facturas</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        </SidebarMenuSub>
                      )}
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>

              {/* Tienda Section */}
              <SidebarGroup>
                {!isCollapsed && <SidebarGroupLabel>Tienda</SidebarGroupLabel>}
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        tooltip="Tienda"
                        data-state={adminTiendaOpen ? 'open' : 'closed'}
                        onClick={() => setAdminTiendaOpen(!adminTiendaOpen)}
                        asChild
                        isActive={location.pathname === '/admin/tienda'}
                      >
                        <Link to="/admin/tienda">
                          <ShoppingBag />
                          {!isCollapsed && <span>Tienda</span>}
                        </Link>
                      </SidebarMenuButton>
                      {!isCollapsed && (
                        <SidebarMenuAction
                          onClick={() => setAdminTiendaOpen(!adminTiendaOpen)}
                          aria-label="Toggle Tienda"
                        >
                          <ChevronRight
                            className={`transition-transform ${adminTiendaOpen ? 'rotate-90' : ''}`}
                          />
                        </SidebarMenuAction>
                      )}
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>

              {/* Monitoreo Granos Section */}
              <SidebarGroup>
                {!isCollapsed && <SidebarGroupLabel>Monitoreo Granos</SidebarGroupLabel>}
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        tooltip="Monitoreo Granos"
                        data-state={adminMonitoreoGranosOpen ? 'open' : 'closed'}
                        onClick={() => setAdminMonitoreoGranosOpen(!adminMonitoreoGranosOpen)}
                      >
                        <BarChart3 />
                        {!isCollapsed && <span>Monitoreo Granos</span>}
                      </SidebarMenuButton>
                      {!isCollapsed && (
                        <SidebarMenuAction
                          onClick={() => setAdminMonitoreoGranosOpen(!adminMonitoreoGranosOpen)}
                          aria-label="Toggle Monitoreo Granos"
                        >
                          <ChevronRight
                            className={`transition-transform ${adminMonitoreoGranosOpen ? 'rotate-90' : ''}`}
                          />
                        </SidebarMenuAction>
                      )}
                      {adminMonitoreoGranosOpen && !isCollapsed && (
                        <SidebarMenuSub>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton
                              asChild
                              isActive={location.pathname === '/admin/dashboard-monitoreo-granos'}
                            >
                              <Link to="/admin/dashboard-monitoreo-granos">
                                <LayoutDashboard className="h-4 w-4" />
                                <span>Dashboard</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton
                              asChild
                              isActive={location.pathname === '/admin/silos-lotes'}
                            >
                              <Link to="/admin/silos-lotes">
                                <Warehouse className="h-4 w-4" />
                                <span>Silos y Granos</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton
                              asChild
                              isActive={location.pathname === '/historial-lotes'}
                            >
                              <Link to="/historial-lotes">
                                <History className="h-4 w-4" />
                                <span>Movimientos</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton
                              asChild
                              isActive={location.pathname === '/admin/monitoreo-granos-ap'}
                            >
                              <Link to="/admin/monitoreo-granos-ap">
                                <FileText className="h-4 w-4" />
                                <span>Muestreos</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton
                              asChild
                              isActive={location.pathname === '/admin/fumigacion-silos'}
                            >
                              <Link to="/admin/fumigacion-silos">
                                <Bug className="h-4 w-4" />
                                <span>Fumigación de Silos</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton
                              asChild
                              isActive={location.pathname === '/admin/historial-perdida'}
                            >
                              <Link to="/admin/historial-perdida">
                                <Activity className="h-4 w-4" />
                                <span>Trazabilidad</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton
                              asChild
                              isActive={location.pathname === '/perdida-economica'}
                            >
                              <Link to="/perdida-economica">
                                <TrendingDown className="h-4 w-4" />
                                <span>Análisis de Pérdidas</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton
                              asChild
                              isActive={location.pathname === '/admin/fondeo-barcos'}
                            >
                              <Link to="/admin/fondeo-barcos">
                                <Ship className="h-4 w-4" />
                                <span>Fondeo de Barcos</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton
                              asChild
                              isActive={location.pathname === '/admin/barcos'}
                            >
                              <Link to="/admin/barcos">
                                <Database className="h-4 w-4" />
                                <span>Catálogo Barcos</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                          {/* Tipos de Granos - Solo visible para admin */}
                          {isAdmin && (
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton
                                asChild
                                isActive={location.pathname === '/granos-variedades'}
                              >
                                <Link to="/granos-variedades">
                                  <Settings className="h-4 w-4" />
                                  <span>Tipos de Granos</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          )}
                        </SidebarMenuSub>
                      )}
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
              {/* Temporarily hidden - Análisis Section - Admin only
              <SidebarGroup>
                {!isCollapsed && <SidebarGroupLabel>Análisis</SidebarGroupLabel>}
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        tooltip="Análisis"
                        data-state={adminAnalisisOpen ? 'open' : 'closed'}
                        onClick={() => setAdminAnalisisOpen(!adminAnalisisOpen)}
                      >
                        <BarChart3 />
                        {!isCollapsed && <span>Análisis</span>}
                      </SidebarMenuButton>
                      {!isCollapsed && (
                        <SidebarMenuAction
                          onClick={() => setAdminAnalisisOpen(!adminAnalisisOpen)}
                          aria-label="Toggle Análisis"
                        >
                          <ChevronRight
                            className={`transition-transform ${adminAnalisisOpen ? 'rotate-90' : ''}`}
                          />
                        </SidebarMenuAction>
                      )}
                      {adminAnalisisOpen && !isCollapsed && (
                        <SidebarMenuSub>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton
                              asChild
                              isActive={location.pathname === '/analisis/fumigacion-aprovigra'}
                            >
                              <Link to="/analisis/fumigacion-aprovigra">
                                <BarChart3 className="h-4 w-4" />
                                <span>Fumigación Aprovigra</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        </SidebarMenuSub>
                      )}
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
              */}
            </>
          )}

          {/* Temporarily hidden - Herramientas section
          <SidebarGroup>
            {!isCollapsed && <SidebarGroupLabel>Herramientas</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    tooltip="Herramientas"
                    data-state={herramientasOpen ? 'open' : 'closed'}
                    onClick={() => setHerramientasOpen(!herramientasOpen)}
                  >
                    <Wrench />
                    {!isCollapsed && <span>Herramientas</span>}
                  </SidebarMenuButton>
                  {!isCollapsed && (
                    <SidebarMenuAction
                      onClick={() => setHerramientasOpen(!herramientasOpen)}
                      aria-label="Toggle Herramientas"
                    >
                      <ChevronRight
                        className={`transition-transform ${herramientasOpen ? 'rotate-90' : ''}`}
                      />
                    </SidebarMenuAction>
                  )}
                  {herramientasOpen && !isCollapsed && (
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton
                          asChild
                          isActive={location.pathname === '/insectos-id'}
                        >
                          <Link to="/insectos-id">
                            <Bug className="h-4 w-4" />
                            <span>Insectos ID</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  )}
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          */}

          {/* Documentación */}
          <SidebarGroup>
            {!isCollapsed && <SidebarGroupLabel>Documentación</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === '/documentacion'}
                    tooltip="Documentación"
                  >
                    <Link to="/documentacion">
                      <FileText />
                      {!isCollapsed && <span>Documentación</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <div className="flex-1" />
          <UserMenu />
        </header>
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </SidebarInset>
    </>
  );
};

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <SidebarProvider>
      <MainLayoutContent>{children}</MainLayoutContent>
    </SidebarProvider>
  );
};

export default MainLayout;

