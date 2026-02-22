'use client';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { PageTitle } from './page-title';
import { useUser } from '@/firebase';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuGroup } from '../ui/dropdown-menu';
import { LogOut } from 'lucide-react';
import { getAuth, signOut } from 'firebase/auth';

export default function Header() {
  const { user } = useUser();
  const auth = getAuth();

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
      {user && (
         <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="overflow-hidden rounded-full"
              >
                <Avatar>
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
    </header>
  );
}
