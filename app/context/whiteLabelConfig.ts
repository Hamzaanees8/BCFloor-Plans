export type Role = 'admin' | 'vendor' | 'agent';

export interface WhiteLabelSettings {
    pageBg: string;
    pageText: string;
    sidebarBg: string;
    sidebarText: string;
    sidebarHoverBg: string;
    sidebarHoverText: string;
    activeColor: string;
    pageTabColor: string;
    logo: string;
    logoWidth: string;
}

export const brandingDefaults: Record<Role, WhiteLabelSettings> = {
    admin: {
        pageBg: '#EFEFEF',
        pageText: '#6D6D6D',
        sidebarBg: '#E4E4E4',
        sidebarText: '#6D6D6D',
        sidebarHoverBg: '#f4f4f5',
        sidebarHoverText: '#6D6D6D',
        activeColor: '#4290E9',
        pageTabColor: '#4290E9',
        logo: '',
        logoWidth: '32',
    },
    vendor: {
        pageBg: '#EFEFEF',
        pageText: '#6D6D6D',
        sidebarBg: '#E4E4E4',
        sidebarText: '#6D6D6D',
        sidebarHoverBg: '#f4f4f5',
        sidebarHoverText: '#6D6D6D',
        activeColor: '#DC9600',
        pageTabColor: '#DC9600',
        logo: '',
        logoWidth: '32',
    },
    agent: {
        pageBg: '#EFEFEF',
        pageText: '#6D6D6D',
        sidebarBg: '#E4E4E4',
        sidebarText: '#6D6D6D',
        sidebarHoverBg: '#f4f4f5',
        sidebarHoverText: '#6D6D6D',
        activeColor: '#6bae41',
        pageTabColor: '#6bae41',
        logo: '',
        logoWidth: '32',
    },
};
