'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Settings, Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from '@/components/theme-provider';
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from '@/components/ui/skeleton';

export default function ConfiguracoesPage() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const ThemeSelector = () => {
        if (!mounted) {
            return (
                 <div className="grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
                    <Skeleton className="h-[108px] w-full" />
                    <Skeleton className="h-[108px] w-full" />
                    <Skeleton className="h-[108px] w-full" />
                 </div>
            )
        }

        return (
            <RadioGroup
                value={theme}
                onValueChange={(value) => setTheme(value as 'light' | 'dark' | 'system')}
                className="grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3"
            >
                <div>
                    <RadioGroupItem value="light" id="light" className="peer sr-only" />
                    <Label
                        htmlFor="light"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                    >
                        <Sun className="mb-3 h-6 w-6" />
                        Claro
                    </Label>
                </div>
                <div>
                    <RadioGroupItem value="dark" id="dark" className="peer sr-only" />
                    <Label
                        htmlFor="dark"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                    >
                        <Moon className="mb-3 h-6 w-6" />
                        Escuro
                    </Label>
                </div>
                <div>
                    <RadioGroupItem value="system" id="system" className="peer sr-only" />
                    <Label
                        htmlFor="system"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                    >
                        <Monitor className="mb-3 h-6 w-6" />
                        Sistema
                    </Label>
                </div>
            </RadioGroup>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <Settings className="h-8 w-8 text-muted-foreground" />
                <h1 className="text-3xl font-bold font-headline">
                    Configurações
                </h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Aparência</CardTitle>
                    <CardDescription>
                        Personalize a aparência do aplicativo.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                         <h3 className="text-lg font-medium">Tema</h3>
                         <ThemeSelector />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
