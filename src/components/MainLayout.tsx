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
import { LayoutDashboard, Warehouse, Ship, Settings, Database, History, FileText, BookOpen, ClipboardList, ChevronRight, Receipt, TrendingDown, FileCheck, ExternalLink, Briefcase, Link2, Shield } from 'lucide-react';
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
  
  // Importar dinámicamente para evitar problemas de dependencias circulares
  const [servicios, setServicios] = React.useState<Array<{ id: number; titulo: string; href: string }>>([]);
  
  React.useEffect(() => {
    if (isAdmin) {
      // Admin ve todos los servicios
      setServicios([
        { id: 148998, titulo: 'Aspersión en banda', href: '/servicios-app/148998' },
        { id: 148591, titulo: 'Lib. De Encarpado', href: '/servicios-app/148591' },
        { id: 136260, titulo: 'Fumigación General', href: '/servicios-app/136260' },
        { id: 136259, titulo: 'Muestreo de Granos', href: '/servicios-app/136259' },
        { id: 136257, titulo: 'Gas. y Encarpado', href: '/servicios-app/136257' },
        { id: 136258, titulo: 'Control de Roedores', href: '/servicios-app/136258' },
        { id: 136256, titulo: 'Servicios Generales', href: '/servicios-app/136256' },
      ]);
    } else {
      // Cliente solo ve servicios asignados
      const saved = localStorage.getItem('admin-servicios-asignados');
      if (saved) {
        try {
          const serviciosAsignados = JSON.parse(saved);
          const serviciosDelCliente = serviciosAsignados
            .filter((s: any) => s.clienteEmail === userEmail && s.activo)
            .map((s: any) => ({
              id: s.servicioId,
              titulo: s.servicioTitulo,
              href: `/servicios-app/${s.servicioId}`,
            }));
          setServicios(serviciosDelCliente);
        } catch {
          setServicios([]);
        }
      } else {
        setServicios([]);
      }
    }
  }, [userEmail, isAdmin]);

  const monitoreoItems = [
    {
      title: 'Silos y Lotes',
      icon: Warehouse,
      href: '/lotes',
    },
    {
      title: 'Fondeo de Barcos',
      icon: Ship,
      href: '/barcos',
    },
    {
      title: 'Historial de Lotes',
      icon: History,
      href: '/historial-lotes',
    },
    {
      title: 'Catálogo Barcos',
      icon: Database,
      href: '/barcos-maestros',
    },
    {
      title: 'Granos y Variedades',
      icon: Settings,
      href: '/granos-variedades',
    },
    {
      title: 'Pérdida Económica',
      icon: TrendingDown,
      href: '/perdida-economica',
    },
  ];

  const documentacionItems = [
    {
      title: 'Documentación Auditoría',
      icon: FileText,
      href: '/documentacion-auditoria',
    },
    {
      title: 'Documentación Técnicos',
      icon: BookOpen,
      href: '/documentacion-tecnicos',
    },
    {
      title: 'Croquis',
      icon: FileText,
      href: '/documentacion-croquis',
    },
  ];

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

          {/* Servicios - Segundo */}
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

          {/* Monitoreo de Granos - Tercero */}
          <SidebarGroup>
            {!isCollapsed && <SidebarGroupLabel>Monitoreo de Granos</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu>
                {monitoreoItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.href;
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.title}
                      >
                        <Link to={item.href}>
                          <Icon />
                          {!isCollapsed && <span>{item.title}</span>}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

                {/* Facturas - Cuarto */}
                <SidebarGroup>
                  {!isCollapsed && <SidebarGroupLabel>Facturas</SidebarGroupLabel>}
                  <SidebarGroupContent>
                    <SidebarMenu>
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          asChild
                          isActive={location.pathname === '/facturas'}
                          tooltip="Facturas"
                        >
                          <Link to="/facturas">
                            <Receipt />
                            {!isCollapsed && <span>Facturas</span>}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          asChild
                          isActive={location.pathname === '/reportes-facturas'}
                          tooltip="Reportes y Facturas"
                        >
                          <Link to="/reportes-facturas">
                            <FileCheck />
                            {!isCollapsed && <span>Reportes y Facturas</span>}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                       {/* Páginas de Formitize ocultas temporalmente */}
                       {/* <SidebarMenuItem>
                         <SidebarMenuButton
                           asChild
                           isActive={location.pathname === '/facturas-formitize'}
                           tooltip="Facturas Formitize"
                         >
                           <Link to="/facturas-formitize">
                             <ExternalLink />
                             {!isCollapsed && <span>Facturas Formitize</span>}
                           </Link>
                         </SidebarMenuButton>
                       </SidebarMenuItem>
                       <SidebarMenuItem>
                         <SidebarMenuButton
                           asChild
                           isActive={location.pathname === '/trabajos-formitize'}
                           tooltip="Trabajos Formitize"
                         >
                           <Link to="/trabajos-formitize">
                             <Briefcase />
                             {!isCollapsed && <span>Trabajos Formitize</span>}
                           </Link>
                         </SidebarMenuButton>
                       </SidebarMenuItem>
                       <SidebarMenuItem>
                         <SidebarMenuButton
                           asChild
                           isActive={location.pathname === '/formularios-formitize'}
                           tooltip="Formularios Formitize"
                         >
                           <Link to="/formularios-formitize">
                             <FileText />
                             {!isCollapsed && <span>Formularios Formitize</span>}
                           </Link>
                         </SidebarMenuButton>
                       </SidebarMenuItem>
                       <SidebarMenuItem>
                         <SidebarMenuButton
                           asChild
                           isActive={location.pathname === '/cotizaciones-formitize'}
                           tooltip="Cotizaciones Formitize"
                         >
                           <Link to="/cotizaciones-formitize">
                             <FileText />
                             {!isCollapsed && <span>Cotizaciones Formitize</span>}
                           </Link>
                         </SidebarMenuButton>
                       </SidebarMenuItem>
                       <SidebarMenuItem>
                         <SidebarMenuButton
                           asChild
                           isActive={location.pathname === '/servicios-facturacion'}
                           tooltip="Servicios y Facturación"
                         >
                           <Link to="/servicios-facturacion">
                             <Link2 />
                             {!isCollapsed && <span>Servicios y Facturación</span>}
                           </Link>
                         </SidebarMenuButton>
                       </SidebarMenuItem> */}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>

          {/* Admin - Solo visible para administradores */}
          {isAdmin && (
            <SidebarGroup>
              {!isCollapsed && <SidebarGroupLabel>Admin</SidebarGroupLabel>}
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={location.pathname === '/admin/servicios'}
                      tooltip="Administración de Servicios"
                    >
                      <Link to="/admin/servicios">
                        <Settings />
                        {!isCollapsed && <span>Servicios</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={location.pathname === '/admin/reportes-servicios'}
                      tooltip="Agregar Reportes a Servicios"
                    >
                      <Link to="/admin/reportes-servicios">
                        <FileText />
                        {!isCollapsed && <span>Reportes</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={location.pathname === '/admin/facturas'}
                      tooltip="Administración de Facturas"
                    >
                      <Link to="/admin/facturas">
                        <Receipt />
                        {!isCollapsed && <span>Facturas</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={location.pathname === '/admin/barcos'}
                      tooltip="Administración de Barcos"
                    >
                      <Link to="/admin/barcos">
                        <Ship />
                        {!isCollapsed && <span>Barcos</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={location.pathname === '/admin/fondeo-barcos'}
                      tooltip="Administración de Fondeo de Barcos"
                    >
                      <Link to="/admin/fondeo-barcos">
                        <Ship />
                        {!isCollapsed && <span>Fondeo de Barcos</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={location.pathname === '/admin/silos-lotes'}
                      tooltip="Administración de Silos y Lotes"
                    >
                      <Link to="/admin/silos-lotes">
                        <Warehouse />
                        {!isCollapsed && <span>Silos y Lotes</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}

          {/* Documentación - Sexto */}
          <SidebarGroup>
            {!isCollapsed && <SidebarGroupLabel>Documentación</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu>
                {documentacionItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.href;
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.title}
                      >
                        <Link to={item.href}>
                          <Icon />
                          {!isCollapsed && <span>{item.title}</span>}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
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

