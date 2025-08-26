import { ReactNode } from 'react';
import { FileManagerProvider } from './FileManagerContext ';

export default function FileManagerLayout({ children }: { children: ReactNode }) {
    return <FileManagerProvider>{children}</FileManagerProvider>
}
