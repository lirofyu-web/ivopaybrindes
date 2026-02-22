import { SidebarTrigger } from '@/components/ui/sidebar';
import { PageTitle } from './page-title';

export default function Header() {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      <SidebarTrigger className="sm:hidden" />
      <div className="flex-1">
        <PageTitle />
      </div>
      {/* User menu can be added here */}
    </header>
  );
}
