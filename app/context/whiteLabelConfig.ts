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

// BCF Original Branding Defaults (original fallback)
export const bcfDefaults: Record<Role, WhiteLabelSettings> = {
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

// Tojuco Premium Branding Defaults (new system default)
export const tojucoDefaults: Record<Role, WhiteLabelSettings> = {
    admin: {
        pageBg: '#121214',
        pageText: '#EEEEEE',
        sidebarBg: '#1A1D20',
        sidebarText: '#B0B3B8',
        sidebarHoverBg: '#2A2D31',
        sidebarHoverText: '#FFFFFF',
        activeColor: '#2E79FF',
        pageTabColor: '#2E79FF',
        logo: '',
        logoWidth: '32',
    },
    vendor: {
        pageBg: '#121214',
        pageText: '#EEEEEE',
        sidebarBg: '#1A1D20',
        sidebarText: '#B0B3B8',
        sidebarHoverBg: '#2A2D31',
        sidebarHoverText: '#FFFFFF',
        activeColor: '#8A94A6',
        pageTabColor: '#8A94A6',
        logo: '',
        logoWidth: '32',
    },
    agent: {
        pageBg: '#121214',
        pageText: '#EEEEEE',
        sidebarBg: '#1A1D20',
        sidebarText: '#B0B3B8',
        sidebarHoverBg: '#2A2D31',
        sidebarHoverText: '#FFFFFF',
        activeColor: '#5C94FF',
        pageTabColor: '#5C94FF',
        logo: '',
        logoWidth: '32',
    },
};

// Global Fallback
export const brandingDefaults = tojucoDefaults;

