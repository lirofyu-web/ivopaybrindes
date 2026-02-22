'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart,
  DollarSign,
  Gift,
  Home,
  Map,
  Settings,
  ShoppingCart,
  TrendingDown,
  Users,
} from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';

const navItems = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/clientes', label: 'Clientes', icon: Users },
  { href: '/rotas', label: 'Rotas', icon: Map },
  { href: '/premios', label: 'Prêmios', icon: Gift },
  { href: '/cobranca', label: 'Cobrança', icon: DollarSign },
  { href: '/relatorios', label: 'Relatórios', icon: BarChart },
  { href: '/despesas', label: 'Despesas', icon: TrendingDown },
  { href: '/configuracoes', label: 'Configurações', icon: Settings },
];

export default function AppSidebar() {
  const pathname = usePathname();
  const { isMobile } = useSidebar();

  return (
    <Sidebar
      className="border-r bg-card"
      collapsible={isMobile ? 'offcanvas' : 'icon'}
    >
      <SidebarHeader className="p-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-primary text-primary-foreground p-2 rounded-lg">
              <ShoppingCart className="h-6 w-6" />
            </div>
            <h1 className="text-xl font-bold font-headline text-foreground group-data-[collapsible=icon]:hidden">
              MRD Gestão
            </h1>
          </Link>
          <div className="group-data-[collapsible=icon]:hidden">
            {!isMobile && <SidebarTrigger />}
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu className="p-2">
          {navItems.map((item) => (
            <SidebarMenuItem key={item.label}>
              <Link href={item.href} passHref legacyBehavior>
                <SidebarMenuButton
                  as="a"
                  isActive={
                    pathname === item.href ||
                    (item.href !== '/' && pathname.startsWith(item.href))
                  }
                  tooltip={{ children: item.label, side: 'right' }}
                >
                  <item.icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
