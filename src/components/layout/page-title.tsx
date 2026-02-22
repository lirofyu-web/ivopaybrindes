'use client';

import { usePathname } from "next/navigation";
import { useMemo } from "react";

const navItems = [
    { href: '/', label: 'Dashboard' },
    { href: '/clientes', label: 'Clientes' },
    { href: '/clientes/novo', label: 'Novo Cliente' },
    { href: '/rotas', label: 'Rotas' },
    { href: '/premios', label: 'Prêmios' },
    { href: '/cobranca', label: 'Cobrança' },
    { href: '/relatorios', label: 'Relatórios' },
    { href: '/despesas', label: 'Despesas' },
    { href: '/configuracoes', label: 'Configurações' },
];

export function PageTitle() {
    const pathname = usePathname();

    const title = useMemo(() => {
        if (pathname.startsWith('/clientes/editar')) {
            return 'Editar Cliente';
        }
        const currentPath = navItems.find(item => item.href === pathname);
        if (currentPath) {
            return currentPath.label;
        }
        // Handle nested routes like /clientes/edit/1
        const parentPath = navItems.find(item => item.href !== '/' && pathname.startsWith(item.href));
        if (parentPath) {
            return parentPath.label;
        }
        return "Dashboard";
    }, [pathname]);
    
    return <h1 className="text-xl font-semibold font-headline">{title}</h1>
}
