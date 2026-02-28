'use client';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { PageTitle } from './page-title';
import { useUser } from '@/firebase';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuGroup } from '../ui/dropdown-menu';
import { LogOut, ChevronLeft } from 'lucide-react';
import { getAuth, signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';

export default function Header() {
  const { user } = useUser();
  const auth = getAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // The useUser hook will trigger a redirect to /login
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 print:hidden">
      <SidebarTrigger />
      <div className="flex-1">
        <PageTitle />
      </div>
      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="icon"
          className="rounded-full h-9 w-9 border-border/40 hover:bg-accent"
          onClick={() => router.back()}
          title="Voltar"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>

        {user && (
           <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="overflow-hidden rounded-full h-9 w-9"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'User'} />
                    <AvatarFallback>{user.displayName?.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{user.displayName}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                      <DropdownMenuLabel className="px-2 pb-2 text-xs font-normal text-muted-foreground">
                          Clique abaixo para encerrar a sessão com segurança.
                      </DropdownMenuLabel>
                      <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                          <LogOut className="mr-2 h-4 w-4"/>
                          Sair
                      </DropdownMenuItem>
                  </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
        )}
      </div>
    </header>
  );
}
