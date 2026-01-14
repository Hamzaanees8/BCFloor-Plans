"use client"
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import Profile from './components/Profile'
import TourSettings from './components/TourSettings'
import { toast } from "sonner";
import Settings from './components/Settings'
import { useWhiteLabel } from '@/app/context/Whitelabel';
import { useAppContext } from '@/app/context/AppContext';


const WhiteLabelPage = () => {
  const { userType } = useAppContext();
  const { saveSettings, appliedSettings } = useWhiteLabel();
  const role = (userType as string) || 'admin';
  const roleSettings = appliedSettings[role as keyof typeof appliedSettings] || appliedSettings['admin'];

  const [activeTab] = useState('Settings');

  const handleSave = () => {
    saveSettings();
    toast.success("Settings saved successfully!");
  }

  return (
    <div className='font-alexandria'>
      {/* Title Bar */}
      <div className='w-full h-[80px] font-alexandria z-[10] sticky top-0 flex justify-between px-[20px] items-center' style={{ position: 'sticky', top: 0, backgroundColor: roleSettings.pageBg, boxShadow: "0px 4px 4px #0000001F" }}>
        <p className='text-[16px] md:text-[24px] font-[400]' style={{ color: roleSettings.pageTabColor }}>White Label</p>
        <Button
          onClick={handleSave}
          className='w-[110px] md:w-[143px] h-[35px] md:h-[44px] border-[1px] text-[14px] md:text-[16px] font-[400] text-[#EEEEEE] flex gap-[5px] items-center hover:brightness-110'
          style={{ backgroundColor: roleSettings.pageTabColor, borderColor: roleSettings.pageTabColor }}
        >
          Save Changes
        </Button>
      </div>

      {/* Tabs Header */}
      {/* <div className='flex justify-center h-[60px] items-center bg-[#E4E4E4]'>
        <div className="w-fit flex border-gray-300 gap-[10px]">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-center px-4 py-2 text-[13px] w-[180px] h-[32px] transition-colors ${activeTab === tab
                ? 'text-white rounded-[6px] font-[500]'
                : 'text-[#666666] hover:text-[#666666] font-[700]'
                }`}
              style={{ backgroundColor: activeTab === tab ? roleSettings.pageTabColor : 'transparent' }}
            >
              {formatTabName(tab)}
            </button>
          ))}
        </div>
      </div> */}

      {/* Tab Content */}
      <div className="p-0">
        {activeTab === 'Profile' && <Profile />}
        {activeTab === 'Settings' && <Settings />}
        {activeTab === 'TourSettings' && <TourSettings />}
      </div>
    </div>
  )
}

export default WhiteLabelPage
