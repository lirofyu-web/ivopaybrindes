'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart,
  CircleDot,
  DollarSign,
  Gift,
  Receipt,
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
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';

const navItems = [
  { href: '/clientes', label: 'Clientes', icon: Users },
  { href: '/rotas', label: 'Rotas', icon: CircleDot, className: 'text-sky-400' },
  { href: '/premios', label: 'Prêmios', icon: Gift, className: 'text-rose-400' },
  { href: '/cobranca', label: 'Cobrança', icon: DollarSign, className: 'text-emerald-400' },
  { href: '/relatorios', label: 'Relatórios', icon: BarChart, className: 'text-orange-400' },
  { href: '/despesas', label: 'Despesas', icon: Receipt, className: 'text-purple-400' },
  { href: '/configuracoes', label: 'Configurações', icon: Settings },
];

export default function AppSidebar() {
  const pathname = usePathname();
  const { isMobile } = useSidebar();

  return (
    <Sidebar
      className="border-r bg-sidebar print:hidden"
      collapsible={isMobile ? 'offcanvas' : 'icon'}
    >
      <SidebarHeader className="p-4">
        <div className="flex items-center justify-between">
          <Link href="/clientes" className="flex items-center gap-2">
            <div className="flex items-baseline gap-1.5 text-xl font-bold font-headline text-foreground group-data-[collapsible=icon]:hidden">
                <span className="bg-primary text-primary-foreground px-2 py-0.5 rounded-sm">MRD</span>
                <span className="text-lg font-medium tracking-wider">BRINDES</span>
            </div>
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
                  isActive={
                    pathname === item.href ||
                    (item.href !== '/' && pathname.startsWith(item.href))
                  }
                  tooltip={{ children: item.label, side: 'right' }}
                >
                  <item.icon className={item.className} />
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
