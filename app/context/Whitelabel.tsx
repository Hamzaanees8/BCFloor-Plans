"use client"

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import { Role, WhiteLabelSettings, brandingDefaults } from './whiteLabelConfig'
import { api } from '@/lib/api'
import { toast } from 'sonner'

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

export const WhiteLabelProvider = ({ children }: { children: ReactNode }) => {
    const [activeTab, setActiveTab] = useState<Role>('admin')
    const [settings, setSettings] = useState<Record<Role, WhiteLabelSettings>>(brandingDefaults)
    const [appliedSettings, setAppliedSettings] = useState<Record<Role, WhiteLabelSettings>>(brandingDefaults)

    // Apply styles whenever APPLIED settings change
    useEffect(() => {
        WhiteLabelStyles.apply(appliedSettings);
    }, [appliedSettings]);

    const syncSettings = async (nextApplied: Record<Role, WhiteLabelSettings>) => {
        // Apply to local state and localStorage
        setAppliedSettings(nextApplied);
        localStorage.setItem('whiteLabelSettings', JSON.stringify(nextApplied));

        // Sync to API
        try {
            await api.post('/settings/white_label_styles', { value: nextApplied });
            console.log('Successfully synced settings to API');
        } catch (error) {
            console.error('Failed to sync settings to API:', error);
            toast.error("Failed to save settings to server. Please try again.");
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
        // 1. Calculate the new state
        const nextSettings = { ...settings };
        nextSettings[activeTab] = brandingDefaults[activeTab];

        // Ensure global fields stays in sync in editing state
        const defaultLogo = brandingDefaults[activeTab].logo;
        const defaultWidth = brandingDefaults[activeTab].logoWidth;

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
        nextApplied[activeTab] = brandingDefaults[activeTab];
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

    // Load from API on mount
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await api.get('/settings/white_label_styles');
                // The API structure is expected to be { value: { admin: ..., vendor: ..., agent: ... } }
                const remoteSettings = response.data?.value;

                if (remoteSettings && typeof remoteSettings === 'object') {
                    setSettings(remoteSettings);
                    setAppliedSettings(remoteSettings);
                    WhiteLabelStyles.apply(remoteSettings);
                } else {
                    // Fallback to localStorage if API is empty or malformed
                    const saved = localStorage.getItem('whiteLabelSettings');
                    if (saved) {
                        const parsed = JSON.parse(saved);
                        setSettings(parsed);
                        setAppliedSettings(parsed);
                        WhiteLabelStyles.apply(parsed);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch settings from API', error);
                // Fallback to localStorage on error
                const saved = localStorage.getItem('whiteLabelSettings');
                if (saved) {
                    const parsed = JSON.parse(saved);
                    setSettings(parsed);
                    setAppliedSettings(parsed);
                    WhiteLabelStyles.apply(parsed);
                }
            }
        };

        fetchSettings();
    }, [])

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
            saveSettings
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
