"use client"

import React from 'react';
import { useWhiteLabel } from '@/app/context/Whitelabel';
import { useAppContext } from '@/app/context/AppContext';

const TourSettings = () => {
    const { userType } = useAppContext();
    const { appliedSettings } = useWhiteLabel();
    const role = (userType as string) || 'admin';
    const roleSettings = appliedSettings[role as keyof typeof appliedSettings] || appliedSettings['admin'];

    return (
        <div
            className="p-6 min-h-[calc(100vh-200px)] transition-colors duration-300"
            style={{ backgroundColor: roleSettings.pageBg }}
        >
            <h2 className="text-lg font-bold mb-4" style={{ color: roleSettings.pageText }}>Tour Settings</h2>
            <p style={{ color: roleSettings.pageText }}>Tour configuration content goes here.</p>
        </div>
    );
};

export default TourSettings;
