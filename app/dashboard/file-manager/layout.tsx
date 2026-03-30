import { ReactNode } from 'react';
import { FileManagerProvider } from './FileManagerContext';
import { TooltipProvider } from '@/components/ui/tooltip';

export default function FileManagerLayout({ children }: { children: ReactNode }) {
    return (
        <TooltipProvider>
            <FileManagerProvider>{children}</FileManagerProvider>
        </TooltipProvider>
    )
}
