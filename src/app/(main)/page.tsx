import Link from 'next/link';
import {
  ArrowUpRight,
  BarChart,
  DollarSign,
  Gift,
  Map,
  Settings,
  TrendingDown,
  Users,
  PlusCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const dashboardItems = [
  {
    href: '/clientes',
    title: 'Clientes',
    icon: Users,
    description: 'Gerenciar clientes',
    value: '1,254',
    change: '+12.5%',
  },
  {
    href: '/rotas',
    title: 'Rotas',
    icon: Map,
    description: 'Otimizar entregas',
    value: '32',
    change: '+2',
  },
  {
    href: '/premios',
    title: 'Prêmios',
    icon: Gift,
    description: 'Controlar prêmios',
    value: '120',
    change: '-5',
  },
  {
    href: '/cobranca',
    title: 'Cobrança',
    icon: DollarSign,
    description: 'Acompanhar pagamentos',
    value: 'R$ 15.230',
    change: '+R$ 2.1k',
  },
  {
    href: '/relatorios',
    title: 'Relatórios',
    icon: BarChart,
    description: 'Analisar performance',
    value: 'Ver relatórios',
  },
  {
    href: '/despesas',
    title: 'Despesas',
    icon: TrendingDown,
    description: 'Registrar gastos',
    value: 'R$ 3.450',
  },
  {
    href: '/configuracoes',
    title: 'Configurações',
    icon: Settings,
    description: 'Ajustes do app',
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight font-headline">
            Dashboard
          </h2>
          <p className="text-muted-foreground">Visão geral do seu negócio.</p>
        </div>
        <div className="flex items-center space-x-2">
          <Link href="/clientes/novo">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Cliente
            </Button>
          </Link>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {dashboardItems.map((item) => (
          <Card
            key={item.title}
            className="hover:shadow-lg transition-shadow duration-300"
          >
            <Link href={item.href} className="block h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {item.title}
                </CardTitle>
                <item.icon className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {item.value && <div className="text-2xl font-bold">{item.value}</div>}
                <p className="text-xs text-muted-foreground">
                  {item.description}
                </p>
                {item.change && (
                  <div className="mt-2 flex items-center text-xs">
                    <span
                      className={`flex items-center gap-1 ${
                        item.change.startsWith('+')
                          ? 'text-success'
                          : 'text-destructive'
                      }`}
                    >
                      <ArrowUpRight
                        className={`h-4 w-4 ${
                          item.change.startsWith('+') ? '' : 'rotate-180'
                        }`}
                      />
                      {item.change}
                    </span>
                    <span className="ml-2 text-muted-foreground">desde o último mês</span>
                  </div>
                )}
              </CardContent>
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}
