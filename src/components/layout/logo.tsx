import { cn } from "@/lib/utils";

export function AppLogo({ className, logoBoxCn, logoTextCn }: { className?: string; logoBoxCn?: string; logoTextCn?: string }) {
    return (
        <div className={cn("flex items-baseline gap-1.5 text-xl font-bold font-headline", className)}>
            <span className={cn("bg-primary text-primary-foreground px-2 py-0.5 rounded-sm", logoBoxCn)}>MRD</span>
            <span className={cn("text-lg font-medium tracking-wider", logoTextCn)}>BRINDES</span>
        </div>
    );
}
