"use client"

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import { Role, WhiteLabelSettings, brandingDefaults, bcfDefaults, tojucoDefaults } from './whiteLabelConfig'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { Organization, GetOrganizations, UpdateOrganization, GetOrganizationBranding } from '@/app/dashboard/global-settings/global-settings'
import { useOrganization } from './OrganizationContext'

interface WhiteLabelContextType {
    activeTab: Role
    setActiveTab: (role: Role) => void
    settings: Record<Role, WhiteLabelSettings> // Editing state
    appliedSettings: Record<Role, WhiteLabelSettings> // Saved/Applied state
    updateSetting: (key: keyof WhiteLabelSettings, value: string) => void
    currentSettings: WhiteLabelSettings // Current editing settings for active role
    currentAppliedSettings: WhiteLabelSettings // Current applied settings for active role
    resetDefaults: () => void
    saveSettings: (role?: Role) => void
    selectedOrgUuid: string | null
    setSelectedOrgUuid: (uuid: string | null) => void
    organizations: Organization[]
}

const WhiteLabelContext = createContext<WhiteLabelContextType | undefined>(undefined)

export class WhiteLabelStyles {
    static apply(settings: Record<Role, WhiteLabelSettings>) {
        if (typeof document === 'undefined') return;
        const root = document.documentElement;

        Object.entries(settings).forEach(([role, s]) => {
            root.style.setProperty(`--${role}-bg-color`, s.pageTabColor);
            root.style.setProperty(`--${role}-text-color`, s.activeColor);
            root.style.setProperty(`--${role}-sidebar-bg`, s.sidebarBg);
            root.style.setProperty(`--${role}-sidebar-text`, s.sidebarText);
            root.style.setProperty(`--${role}-sidebar-hover-bg`, s.sidebarHoverBg);
            root.style.setProperty(`--${role}-sidebar-hover-text`, s.sidebarHoverText);
            root.style.setProperty(`--${role}-page-bg`, s.pageBg);
            root.style.setProperty(`--${role}-page-text`, s.pageText);
        });
    }
}

// Helper: extract color string from either a plain string or a { value: "..." } object
function extractColorValue(color: any, fallback: string): string {
    if (!color) return fallback;
    if (typeof color === 'object') return color.value || fallback;
    return color || fallback;
}

// Helper to determine if BCF organization is active or selected
const isBcf = (org?: any) => {
    if (!org) return false;
    const slug = org.slug || '';
    const name = org.name || '';
    return slug === 'bcf' || slug === 'bcfloorplans' || slug.includes('bcf') || name.toLowerCase().includes('bcf') || name.toLowerCase().includes('floor plan') || name.toLowerCase().includes('floorplans');
};

// Helper to get defaults dynamically based on organization context
const getOrgDefaults = (org?: any) => {
    return isBcf(org) ? bcfDefaults : tojucoDefaults;
};

// Helper to fallback to the organization's existing profile logo if no whitelabel logo is configured yet
const applyLogoFallback = (styles: Record<Role, WhiteLabelSettings>, org?: any) => {
    const logo = org?.logo;
    if (!logo) return styles;
    const next = { ...styles };
    (Object.keys(next) as Role[]).forEach(role => {
        if (!next[role].logo) {
            next[role] = { ...next[role], logo };
        }
    });
    return next;
};

export const WhiteLabelProvider = ({ children }: { children: ReactNode }) => {
    const { organization: activeOrg } = useOrganization()
    const [activeTab, setActiveTab] = useState<Role>('admin')
    const [settings, setSettings] = useState<Record<Role, WhiteLabelSettings>>(brandingDefaults)
    const [appliedSettings, setAppliedSettings] = useState<Record<Role, WhiteLabelSettings>>(brandingDefaults)
    const [selectedOrgUuid, setSelectedOrgUuid] = useState<string | null>(null)
    const [organizations, setOrganizations] = useState<Organization[]>([])


    // Apply styles whenever APPLIED settings change (Global only)
    useEffect(() => {
        if (!selectedOrgUuid) {
            WhiteLabelStyles.apply(appliedSettings);
        }
    }, [appliedSettings, selectedOrgUuid]);

    const syncSettings = async (nextApplied: Record<Role, WhiteLabelSettings>) => {
        // Apply to local state
        setAppliedSettings(nextApplied);

        if (selectedOrgUuid) {
            // Sync to Organization scoped settings in the settings table
            try {
                // 1. Sync custom whitelabel colors (such as sidebarBg, pageBg, etc.) to the settings table
                await api.post(`/settings/white_label_styles?org_uuid=${selectedOrgUuid}`, { value: nextApplied });
                
                // 2. Keep the legacy update call for organization metadata compatibility
                await UpdateOrganization(selectedOrgUuid, { white_label_styles: nextApplied });
                
                // Update local organizations state to keep it in sync
                setOrganizations(prev => prev.map(org => 
                    org.uuid === selectedOrgUuid ? { ...org, white_label_styles: nextApplied } : org
                ));
                console.log('Successfully synced settings to Organization database');
            } catch (error) {
                console.error('Failed to sync settings to Organization:', error);
                toast.error("Failed to save settings to organization. Please try again.");
            }
        } else {
            // Sync to Global API and localStorage
            localStorage.setItem('whiteLabelSettings', JSON.stringify(nextApplied));
            try {
                await api.post('/settings/white_label_styles', { value: nextApplied });
                console.log('Successfully synced settings to Global API');
            } catch (error) {
                console.error('Failed to sync settings to Global API:', error);
                toast.error("Failed to save settings to server. Please try again.");
            }
        }
    }

    const updateSetting = (key: keyof WhiteLabelSettings, value: string) => {
        if (key === 'logo' || key === 'logoWidth') {
            setSettings(prev => {
                const next = { ...prev };
                (Object.keys(next) as Role[]).forEach(role => {
                    next[role] = { ...next[role], [key]: value };
                });
                return next;
            });
        } else {
            setSettings(prev => ({
                ...prev,
                [activeTab]: {
                    ...prev[activeTab],
                    [key]: value
                }
            }))
        }
    }

    const resetDefaults = async () => {
        const activeDefaults = getOrgDefaults(organizations.find(o => o.uuid === selectedOrgUuid) || activeOrg);
        
        // 1. Calculate the new state
        const nextSettings = { ...settings };
        nextSettings[activeTab] = activeDefaults[activeTab];

        // Ensure global fields stays in sync in editing state
        const defaultLogo = activeDefaults[activeTab].logo;
        const defaultWidth = activeDefaults[activeTab].logoWidth;

        (Object.keys(nextSettings) as Role[]).forEach(role => {
            nextSettings[role] = {
                ...nextSettings[role],
                logo: defaultLogo,
                logoWidth: defaultWidth
            };
        });

        // 2. Update editing state
        setSettings(nextSettings);

        // 3. Calculate and sync applied state
        const nextApplied = { ...appliedSettings };
        nextApplied[activeTab] = activeDefaults[activeTab];
        (Object.keys(nextApplied) as Role[]).forEach(role => {
            nextApplied[role] = {
                ...nextApplied[role],
                logo: defaultLogo,
                logoWidth: defaultWidth
            };
        });

        await syncSettings(nextApplied);
    }

    const saveSettings = async (roleToSave?: Role) => {
        let nextApplied: Record<Role, WhiteLabelSettings>;

        if (!roleToSave) {
            console.log('Applying and Saving ALL White Label Settings');
            nextApplied = { ...settings };
        } else {
            const targetRole = roleToSave;
            console.log(`Applying and Saving White Label Settings for ${targetRole}`);

            // Build the next applied state locally to send to API
            nextApplied = {
                ...appliedSettings,
                [targetRole]: settings[targetRole]
            };

            // Sync global logo if applicable
            if (settings[targetRole].logo !== undefined) {
                const newLogo = settings[targetRole].logo;
                const newWidth = settings[targetRole].logoWidth;
                (Object.keys(nextApplied) as Role[]).forEach(role => {
                    nextApplied[role] = {
                        ...nextApplied[role],
                        logo: newLogo,
                        logoWidth: newWidth
                    };
                });
            }
        }

        await syncSettings(nextApplied);
    }

    // Load organizations and global settings on mount
    useEffect(() => {
        const init = async () => {
            try {
                const orgsRes = await GetOrganizations();
                setOrganizations(Array.isArray(orgsRes.data) ? orgsRes.data : []);
            } catch (error) {
                console.error('Failed to fetch organizations', error);
            }

            try {
                const response = await api.get('/settings/white_label_styles');
                const remoteSettings = response.data?.value;

                if (remoteSettings && typeof remoteSettings === 'object') {
                    setSettings(remoteSettings);
                    setAppliedSettings(remoteSettings);
                    WhiteLabelStyles.apply(remoteSettings);
                } else {
                    const saved = localStorage.getItem('whiteLabelSettings');
                    if (saved) {
                        const parsed = JSON.parse(saved);
                        setSettings(parsed);
                        setAppliedSettings(parsed);
                        WhiteLabelStyles.apply(parsed);
                    } else {
                        // Apply dynamically detected organization defaults if no settings saved yet
                        const activeDefaults = applyLogoFallback(getOrgDefaults(activeOrg), activeOrg);
                        setSettings(activeDefaults);
                        setAppliedSettings(activeDefaults);
                        WhiteLabelStyles.apply(activeDefaults);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch settings from API', error);
                const saved = localStorage.getItem('whiteLabelSettings');
                if (saved) {
                    const parsed = JSON.parse(saved);
                    setSettings(parsed);
                    setAppliedSettings(parsed);
                    WhiteLabelStyles.apply(parsed);
                } else {
                    const activeDefaults = applyLogoFallback(getOrgDefaults(activeOrg), activeOrg);
                    setSettings(activeDefaults);
                    setAppliedSettings(activeDefaults);
                    WhiteLabelStyles.apply(activeDefaults);
                }
            }
        };

        init();
    }, [activeOrg])

    // Switch between Global and Organization settings
    useEffect(() => {
        if (!selectedOrgUuid) {
            // Load Global from API/localStorage
            const loadGlobal = async () => {
                try {
                    const response = await api.get('/settings/white_label_styles');
                    const remoteSettings = response.data?.value;
                    if (remoteSettings) {
                        setSettings(remoteSettings);
                        setAppliedSettings(remoteSettings);
                    } else {
                        const activeDefaults = getOrgDefaults(activeOrg);
                        setSettings(activeDefaults);
                        setAppliedSettings(activeDefaults);
                    }
                } catch {
                    const saved = localStorage.getItem('whiteLabelSettings');
                    if (saved) {
                        const parsed = JSON.parse(saved);
                        setSettings(parsed);
                        setAppliedSettings(parsed);
                    } else {
                        const activeDefaults = getOrgDefaults(activeOrg);
                        setSettings(activeDefaults);
                        setAppliedSettings(activeDefaults);
                    }
                }
            };
            loadGlobal();
        } else {
            // Load Organization settings
            const org = organizations.find(o => o.uuid === selectedOrgUuid);
            
            const loadOrgBranding = async () => {
                let stylesToUse = getOrgDefaults(org);
                
                try {
                    const response = await api.get(`/settings/white_label_styles?org_uuid=${selectedOrgUuid}`);
                    const remoteSettings = response.data?.value;
                    if (remoteSettings && typeof remoteSettings === 'object') {
                        stylesToUse = remoteSettings;
                    } else {
                        // Pre-fill from org object if JSON styles are missing
                        if (org) {
                            const primary = extractColorValue(org.primary_color, '');
                            const secondary = extractColorValue(org.secondary_color, '');
                            if (primary || secondary) {
                                const next = { ...stylesToUse };
                                (Object.keys(next) as Role[]).forEach(role => {
                                    if (primary) next[role] = { ...next[role], pageTabColor: primary };
                                    if (secondary) next[role] = { ...next[role], activeColor: secondary };
                                });
                                stylesToUse = next;
                            }
                        }
                    }
                } catch (err) {
                    console.error("Failed to load white label styles from database", err);
                }

                try {
                    const res = await GetOrganizationBranding(selectedOrgUuid);
                    if (res?.data) {
                        const logo = res.data.logo_url || res.data.logo;
                        const primary = extractColorValue(res.data.primary_color, '');
                        const secondary = extractColorValue(res.data.secondary_color, '');
                        
                        if (logo || primary || secondary) {
                            const newStyles = { ...stylesToUse };
                            (Object.keys(newStyles) as Role[]).forEach(role => {
                                if (logo) newStyles[role] = { ...newStyles[role], logo };
                                if (primary) newStyles[role] = { ...newStyles[role], pageTabColor: primary };
                                if (secondary) newStyles[role] = { ...newStyles[role], activeColor: secondary };
                            });
                            stylesToUse = newStyles;
                        }
                    }
                } catch (err) {
                    console.error("Failed to load branding logo in context", err);
                }
                
                // Fallback to the organization's existing profile logo if no custom whitelabel logo is set
                stylesToUse = applyLogoFallback(stylesToUse, org);
                
                setSettings(stylesToUse);
                setAppliedSettings(stylesToUse);
            };
            
            loadOrgBranding();
        }
    }, [selectedOrgUuid, organizations, activeOrg]);

    const currentSettings = settings[activeTab]
    const currentAppliedSettings = appliedSettings[activeTab]

    return (
        <WhiteLabelContext.Provider value={{
            activeTab,
            setActiveTab,
            settings,
            appliedSettings,
            updateSetting,
            currentSettings,
            currentAppliedSettings,
            resetDefaults,
            saveSettings,
            selectedOrgUuid,
            setSelectedOrgUuid,
            organizations
        }}>
            {children}
        </WhiteLabelContext.Provider>
    )
}

export const useWhiteLabel = () => {
    const context = useContext(WhiteLabelContext)
    if (context === undefined) {
        throw new Error('useWhiteLabel must be used within a WhiteLabelProvider')
    }
    return context
}

export const useOptionalWhiteLabel = () => {
    return useContext(WhiteLabelContext)
}
