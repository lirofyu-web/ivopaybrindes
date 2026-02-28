'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart,
  DollarSign,
  Gift,
  MapPin,
  Map as MapIcon,
  TrendingDown,
  Settings,
  Users,
} from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from '@/components/ui/sidebar';
import { AppLogo } from './logo';

const navItems = [
  { href: '/clientes', label: 'Clientes', icon: Users },
  { href: '/rotas', label: 'Rotas', icon: MapPin, className: 'text-sky-400' },
  { href: '/mapa', label: 'Mapa', icon: MapIcon, className: 'text-green-400' },
  { href: '/premios', label: 'Prêmios', icon: Gift, className: 'text-rose-400' },
  { href: '/cobranca', label: 'Cobrança', icon: DollarSign, className: 'text-emerald-400' },
  { href: '/relatorios', label: 'Relatórios', icon: BarChart, className: 'text-orange-400' },
  { href: '/despesas', label: 'Despesas', icon: TrendingDown, className: 'text-purple-400' },
  { href: '/configuracoes', label: 'Configurações', icon: Settings },
];

export default function AppSidebar() {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();

  const handleNavClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
    
    // Request fullscreen on user interaction for a real PWA experience
    const doc = window.document.documentElement as any;
    const requestFullScreen = doc.requestFullscreen || doc.webkitRequestFullScreen || doc.mozRequestFullScreen || doc.msRequestFullscreen;

    if (!window.document.fullscreenElement) {
        requestFullScreen?.call(doc).catch((err: any) => {
            console.warn(`Fullscreen error: ${err.message}`);
        });
    }
  };

  return (
    <Sidebar className="border-r bg-sidebar print:hidden" collapsible="offcanvas">
      <SidebarHeader className="p-4">
        <Link href="/clientes" className="flex items-center gap-2">
          <AppLogo className="text-foreground" />
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu className="p-2 gap-1.5">
          {navItems.map((item) => (
            <SidebarMenuItem key={item.label}>
              <Link href={item.href} passHref legacyBehavior>
                <SidebarMenuButton
                  onClick={handleNavClick}
                  isActive={pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))}
                  className="h-11 px-3"
                >
                  <item.icon className={item.className} />
                  <span className="font-medium">{item.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}