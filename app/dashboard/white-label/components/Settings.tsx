"use client"

import { useWhiteLabel } from '@/app/context/Whitelabel'
import { useAppContext } from '@/app/context/AppContext'
import React, { useState, useRef } from 'react'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Calendar, House, File, Settings as SettingsIcon, UserCheck, Sliders, LogOut, Search, ChevronLeft, PanelLeftClose, PanelLeftOpen, ChevronDown, Upload } from 'lucide-react'
import ResetConfirmationDialog from './ResetConfirmationDialog'
import { toast } from "sonner"
import Image from "next/image"

const Settings = () => {
    const { userType } = useAppContext()
    // State for visual customization
    const { activeTab, setActiveTab, updateSetting, currentSettings, resetDefaults, appliedSettings, settings } = useWhiteLabel()
    const role = (userType as string) || 'admin';
    const roleSettings = appliedSettings[role as keyof typeof appliedSettings] || appliedSettings['admin'];

    const [isCollapsed, setIsCollapsed] = useState(false)
    const [hoveredItem, setHoveredItem] = useState<string | null>(null)
    const [isResetDialogOpen, setIsResetDialogOpen] = useState(false)

    const pageBgRef = useRef<HTMLInputElement>(null)
    const pageTextRef = useRef<HTMLInputElement>(null)
    const sidebarBgRef = useRef<HTMLInputElement>(null)
    const sidebarTextRef = useRef<HTMLInputElement>(null)
    const sidebarHoverBgRef = useRef<HTMLInputElement>(null)
    const sidebarHoverTextRef = useRef<HTMLInputElement>(null)
    const activeColorRef = useRef<HTMLInputElement>(null)
    const pageTabColorRef = useRef<HTMLInputElement>(null)
    const logoRef = useRef<HTMLInputElement>(null)

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                updateSetting('logo', reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleReset = () => {
        resetDefaults()
        toast.success(`${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} settings reset to default!`)
    }



    return (
        <div
            className="flex flex-col lg:flex-row gap-6 p-6 min-h-[calc(100vh-200px)] transition-colors duration-300"
            style={{ backgroundColor: roleSettings.pageBg }}
        >
            {/* Left Column: Settings Configuration */}
            <div className="w-full lg:w-1/3 flex flex-col gap-6 bg-white p-6 rounded-lg border border-[#BBBBBB]">
                <div className="space-y-4">
                    {/* Role Tabs */}
                    <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-lg">
                        {(['admin', 'vendor', 'agent'] as const).map((roleKey) => (
                            <button
                                key={roleKey}
                                onClick={() => setActiveTab(roleKey)}
                                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all capitalize ${activeTab === roleKey
                                    ? 'text-white shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                style={{ backgroundColor: activeTab === roleKey ? settings[roleKey].pageTabColor : 'transparent' }}
                            >
                                {roleKey}
                            </button>
                        ))}
                    </div>

                    <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Appearance Settings</h3>

                    <div className="grid gap-2">
                        <Label htmlFor="page-bg">Page Background</Label>
                        <div className="flex gap-2">
                            <Input
                                id="page-bg"
                                value={currentSettings.pageBg}
                                onChange={(e) => updateSetting('pageBg', e.target.value)}
                                onFocus={() => pageBgRef.current?.click()}
                                className="font-mono"
                            />
                            <input
                                ref={pageBgRef}
                                type="color"
                                value={currentSettings.pageBg}
                                onChange={(e) => updateSetting('pageBg', e.target.value)}
                                className="w-10 h-10 p-1 rounded border cursor-pointer"
                            />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="page-text">Page Text Color</Label>
                        <div className="flex gap-2">
                            <Input
                                id="page-text"
                                value={currentSettings.pageText}
                                onChange={(e) => updateSetting('pageText', e.target.value)}
                                onFocus={() => pageTextRef.current?.click()}
                                className="font-mono"
                            />
                            <input
                                ref={pageTextRef}
                                type="color"
                                value={currentSettings.pageText}
                                onChange={(e) => updateSetting('pageText', e.target.value)}
                                className="w-10 h-10 p-1 rounded border cursor-pointer"
                            />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="page-tab-color">Page Tab Color</Label>
                        <div className="flex gap-2">
                            <Input
                                id="page-tab-color"
                                value={currentSettings.pageTabColor}
                                onChange={(e) => updateSetting('pageTabColor', e.target.value)}
                                onFocus={() => pageTabColorRef.current?.click()}
                                className="font-mono"
                            />
                            <input
                                ref={pageTabColorRef}
                                type="color"
                                value={currentSettings.pageTabColor}
                                onChange={(e) => updateSetting('pageTabColor', e.target.value)}
                                className="w-10 h-10 p-1 rounded border cursor-pointer"
                            />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="sidebar-bg">Menu Background</Label>
                        <div className="flex gap-2">
                            <Input
                                id="sidebar-bg"
                                value={currentSettings.sidebarBg}
                                onChange={(e) => updateSetting('sidebarBg', e.target.value)}
                                onFocus={() => sidebarBgRef.current?.click()}
                                className="font-mono"
                            />
                            <input
                                ref={sidebarBgRef}
                                type="color"
                                value={currentSettings.sidebarBg}
                                onChange={(e) => updateSetting('sidebarBg', e.target.value)}
                                className="w-10 h-10 p-1 rounded border cursor-pointer"
                            />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="sidebar-text">Menu Text Color</Label>
                        <div className="flex gap-2">
                            <Input
                                id="sidebar-text"
                                value={currentSettings.sidebarText}
                                onChange={(e) => updateSetting('sidebarText', e.target.value)}
                                onFocus={() => sidebarTextRef.current?.click()}
                                className="font-mono"
                            />
                            <input
                                ref={sidebarTextRef}
                                type="color"
                                value={currentSettings.sidebarText}
                                onChange={(e) => updateSetting('sidebarText', e.target.value)}
                                className="w-10 h-10 p-1 rounded border cursor-pointer"
                            />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="sidebar-hover-bg">Menu Hover Background</Label>
                        <div className="flex gap-2">
                            <Input
                                id="sidebar-hover-bg"
                                value={currentSettings.sidebarHoverBg}
                                onChange={(e) => updateSetting('sidebarHoverBg', e.target.value)}
                                onFocus={() => sidebarHoverBgRef.current?.click()}
                                className="font-mono"
                            />
                            <input
                                ref={sidebarHoverBgRef}
                                type="color"
                                value={currentSettings.sidebarHoverBg}
                                onChange={(e) => updateSetting('sidebarHoverBg', e.target.value)}
                                className="w-10 h-10 p-1 rounded border cursor-pointer"
                            />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="sidebar-hover-text">Menu Hover Text Color</Label>
                        <div className="flex gap-2">
                            <Input
                                id="sidebar-hover-text"
                                value={currentSettings.sidebarHoverText}
                                onChange={(e) => updateSetting('sidebarHoverText', e.target.value)}
                                onFocus={() => sidebarHoverTextRef.current?.click()}
                                className="font-mono"
                            />
                            <input
                                ref={sidebarHoverTextRef}
                                type="color"
                                value={currentSettings.sidebarHoverText}
                                onChange={(e) => updateSetting('sidebarHoverText', e.target.value)}
                                className="w-10 h-10 p-1 rounded border cursor-pointer"
                            />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="active-color">Active Item Color</Label>
                        <div className="flex gap-2">
                            <Input
                                id="active-color"
                                value={currentSettings.activeColor}
                                onChange={(e) => updateSetting('activeColor', e.target.value)}
                                onFocus={() => activeColorRef.current?.click()}
                                className="font-mono"
                            />
                            <input
                                ref={activeColorRef}
                                type="color"
                                value={currentSettings.activeColor}
                                onChange={(e) => updateSetting('activeColor', e.target.value)}
                                className="w-10 h-10 p-1 rounded border cursor-pointer"
                            />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label>Logo Image</Label>
                        <div className="flex flex-col gap-2">
                            <div className="flex gap-2 items-center">
                                <Button
                                    variant="outline"
                                    onClick={() => logoRef.current?.click()}
                                    className="w-full h-[42px] border-[#BBBBBB] flex gap-2 items-center"
                                >
                                    <Upload className="h-4 w-4" />
                                    {currentSettings.logo ? 'Change Logo' : 'Upload Logo'}
                                </Button>
                                <input
                                    ref={logoRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleLogoUpload}
                                    className="hidden"
                                />
                                {currentSettings.logo && (
                                    <Button
                                        variant="outline"
                                        onClick={() => updateSetting('logo', '')}
                                        className="h-[42px] border-red-200 text-red-600 hover:bg-red-50 px-3"
                                    >
                                        Remove
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="logo-width">Logo Width (px)</Label>
                        <div className="flex gap-2 items-center">
                            <Input
                                id="logo-width"
                                type="number"
                                value={currentSettings.logoWidth}
                                onChange={(e) => updateSetting('logoWidth', e.target.value)}
                                className="h-[42px] border-[#BBBBBB]"
                                min="20"
                                max="200"
                            />
                        </div>
                    </div>
                    <div className="pt-4  border-t border-gray-200">
                        <Button
                            variant="outline"
                            className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                            onClick={() => setIsResetDialogOpen(true)}
                        >
                            Reset to Default
                        </Button>
                        <ResetConfirmationDialog
                            open={isResetDialogOpen}
                            setOpen={setIsResetDialogOpen}
                            onConfirm={handleReset}
                        />
                    </div>
                </div>
            </div>

            {/* Right Column: Live Preview */}
            <div className="w-full lg:w-2/3 bg-gray-100 rounded-lg p-8 flex items-center justify-center border border-[#BBBBBB]">
                {/* Dummy Device/Window Container */}
                <div
                    className="w-full max-w-[1000px] h-[600px] rounded-lg shadow-xl overflow-hidden flex text-sm transition-all duration-300 border border-gray-200"
                    style={{ backgroundColor: currentSettings.pageBg }}
                >
                    {/* Simulator Sidebar */}
                    <div
                        className={`
                            flex-shrink-0 flex flex-col h-full border-r border-[#BBBBBB] transition-all duration-300 font-alexandria relative
                            ${isCollapsed ? 'w-[80px] items-center' : 'w-[260px]'}
                        `}
                        style={{ backgroundColor: currentSettings.sidebarBg }}
                    >
                        {/* Collapse Button */}
                        <button
                            onClick={() => setIsCollapsed(!isCollapsed)}
                            className="absolute top-[55px] -right-3 z-[9] flex items-center justify-center h-5 w-7 rounded-[4px] bg-white border border-[#D1D5DB] shadow-sm text-[#6B7280] hover:bg-gray-50 cursor-pointer"
                        >
                            {isCollapsed ? <PanelLeftOpen className="h-3 w-3" /> : <PanelLeftClose className="h-3 w-3" />}
                        </button>

                        <div
                            className={`h-[80px] p-4 flex flex-col justify-center w-full ${isCollapsed ? 'items-center' : ''}`}
                            style={{ backgroundColor: currentSettings.pageTabColor }}
                        >
                            <div className="flex items-center gap-x-2.5">
                                {currentSettings.logo ? (
                                    <Image
                                        src={currentSettings.logo}
                                        alt="Logo"
                                        width={Number(currentSettings.logoWidth)}
                                        height={50}
                                        style={{ width: `${currentSettings.logoWidth}px`, height: 'auto' }}
                                        className="shrink-0"
                                    />
                                ) : (
                                    <div className="h-8 w-8 rounded-full bg-white/20 shrink-0 flex items-center justify-center text-white text-xs">
                                        {activeTab.charAt(0).toUpperCase()}
                                    </div>
                                )}

                                {!isCollapsed && (
                                    <div className="overflow-hidden text-white">
                                        <p className="text-[14px] font-normal leading-4 truncate">BC Floor Plans</p>
                                        <p className="text-[12px] font-normal leading-4 truncate">Admin User</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Sidebar Content */}
                        <div className={`flex-1 overflow-y-auto pt-[20px] custom-scroll w-full ${isCollapsed ? 'px-2' : 'px-[25px]'}`}>
                            {/* Back Button Mock */}
                            <div
                                className={`min-h-[32px] w-full flex items-center mb-6 cursor-not-allowed rounded-[24px] ${isCollapsed ? 'justify-center w-8 h-8 rounded-full p-0 mx-auto' : ''}`}
                                style={{ backgroundColor: currentSettings.pageTabColor }}
                            >
                                <div className={`flex items-center gap-x-[10px] text-white ${isCollapsed ? 'justify-center p-0' : 'px-[14px] py-[4px]'}`}>
                                    <ChevronLeft size={16} />
                                    {!isCollapsed && <p className="text-[16px] font-semibold">BACK</p>}
                                </div>
                            </div>

                            {/* Helper to render items */}
                            {[
                                {
                                    group: 'DATA', items: [
                                        { name: 'Calendar', icon: Calendar },
                                        { name: 'Listings', icon: House },
                                        { name: 'Orders', icon: File },
                                        { name: 'Services', icon: SettingsIcon },
                                    ]
                                },
                                {
                                    group: 'PEOPLE', items: [
                                        { name: 'Agents', icon: UserCheck }
                                    ]
                                },
                                {
                                    group: 'GENERAL', items: [
                                        { name: 'Global Settings', icon: Sliders, active: true }
                                    ]
                                }
                            ].map((group) => (
                                <div key={group.group} className="mb-6 w-full">
                                    {!isCollapsed && <p className="font-extrabold text-[12px] text-[#BBBBBB] mb-2">{group.group}</p>}
                                    <div className="space-y-4 w-full">
                                        {group.items.map((item) => {
                                            const isHovered = hoveredItem === item.name;
                                            const isActive = (item as { active?: boolean }).active;

                                            const textColor = isActive ? currentSettings.activeColor : (isHovered ? currentSettings.sidebarHoverText : currentSettings.sidebarText);
                                            const bgColor = isHovered ? currentSettings.sidebarHoverBg : 'transparent';

                                            return (
                                                <div
                                                    key={item.name}
                                                    onMouseEnter={() => setHoveredItem(item.name)}
                                                    onMouseLeave={() => setHoveredItem(null)}
                                                    className={`
                                                        flex items-center gap-2 text-[16px] rounded-md transition-colors cursor-default w-full
                                                        ${isCollapsed ? 'justify-center p-2' : 'px-2 py-1'}
                                                        ${isActive ? 'font-bold' : 'font-normal'}
                                                    `}
                                                    style={{
                                                        color: textColor,
                                                        backgroundColor: bgColor
                                                    }}
                                                >
                                                    <item.icon className="h-4 w-4 shrink-0" style={{ color: textColor }} />
                                                    {!isCollapsed && <span>{item.name}</span>}
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            ))}

                            {/* Search Group */}
                            <div className="mb-6 w-full">
                                {!isCollapsed && <p className="font-extrabold text-[12px] text-[#BBBBBB] mb-2">SEARCH</p>}
                                {isCollapsed ? (
                                    <div className="flex justify-center w-full">
                                        <Search className={`h-5 w-5 shrink-0`} style={{ color: currentSettings.activeColor }} />
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-sm border w-full">
                                        <span className="text-sm text-gray-400">This page...</span>
                                        <Search className={`h-5 w-5 shrink-0 ml-auto`} style={{ color: currentSettings.activeColor }} />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer/Logout */}
                        <div className={`pb-[20px] w-full ${isCollapsed ? 'flex justify-center items-center p-0' : 'p-[25px]'}`}>
                            <div className="flex items-center gap-x-2.5 opacity-60">
                                <LogOut className="h-[18px] w-[18px] shrink-0 text-[#7D7D7D]" />
                                {!isCollapsed && <p className="text-[#7D7D7D] text-[16px] font-normal">Log Out</p>}
                            </div>
                        </div>
                    </div>

                    {/* Dummy Main Content */}
                    <div className="flex-1 p-0 overflow-hidden flex flex-col font-alexandria">
                        {/* Header matched to GlobalSettings.tsx */}
                        <div className="w-full h-[80px] border-b border-[#BBBBBB] z-[8] relative flex justify-between px-[20px] items-center" style={{ backgroundColor: currentSettings.pageBg, boxShadow: "0px 4px 4px #0000001F" }}>
                            <p className="text-[16px] md:text-[24px] font-[400]" style={{ color: currentSettings.pageTabColor }}>Company Profile</p>
                            <Button
                                className="w-[110px] md:w-[143px] h-[35px] md:h-[44px] border-[1px] text-[14px] md:text-[16px] font-[400] text-[#EEEEEE] flex gap-[5px] items-center hover:text-[#fff] hover:brightness-110"
                                style={{ backgroundColor: currentSettings.pageTabColor, borderColor: currentSettings.pageTabColor }}
                            >
                                Save Changes
                            </Button>
                        </div>

                        {/* Content Area with Accordion */}
                        <div className="flex-1 overflow-y-auto p-0">
                            {/* Dummy Tabs */}
                            <div className='flex justify-center h-[60px] items-center mb-4' style={{ backgroundColor: currentSettings.pageBg }}>
                                <div className=" w-fit flex border-gray-300 gap-[10px]">
                                    {['SETTINGS', 'TOUR SETTINGS'].map(tab => (
                                        <button
                                            key={tab}
                                            className={`text-center px-4 py-2 text-[13px] w-[180px] h-[32px] transition-colors ${tab === 'SETTINGS'
                                                ? 'text-white rounded-[6px] font-[500]'
                                                : 'text-[#666666] font-[700]'
                                                }`}
                                            style={{ backgroundColor: tab === 'SETTINGS' ? currentSettings.pageTabColor : undefined }}
                                        >
                                            {tab}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Accordion Item 1 (OPEN) */}
                            <div className="w-full">
                                {/* Accordion Trigger */}
                                <div className="px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] flex justify-between items-center cursor-pointer" style={{ backgroundColor: currentSettings.pageBg }}>
                                    <span className="text-[18px] font-[600] uppercase" style={{ color: currentSettings.pageTabColor }}>COMPANY PROFILE</span>
                                    <ChevronDown
                                        className="w-6 h-6 stroke-[2]"
                                        style={{ color: currentSettings.pageTabColor }}
                                    />
                                </div>

                                {/* Accordion Content */}
                                <div className="p-4 grid gap-4 ">
                                    <div className='w-full flex flex-col items-center'>
                                        <div className='w-full md:w-[410px] py-[32px] px-[10px] md:px-0 flex justify-center flex-col gap-[16px] text-[#424242] text-[14px] font-[400]'>
                                            <div className="grid gap-2">
                                                <Label style={{ color: currentSettings.pageText }}>Company Name</Label>
                                                <Input className="h-[42px] bg-[#EEEEEE] border border-[#BBBBBB]" placeholder="Enter company name" />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label style={{ color: currentSettings.pageText }}>Website</Label>
                                                <Input className="h-[42px] bg-[#EEEEEE] border border-[#BBBBBB]" placeholder="www.example.com" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Accordion Item 2 (CLOSED) */}
                            <div className="w-full">
                                {/* Accordion Trigger */}
                                {/* Accordion Trigger */}
                                <div className="px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] flex justify-between items-center cursor-pointer" style={{ backgroundColor: currentSettings.pageBg }}>
                                    <span className="text-[18px] font-[600] uppercase" style={{ color: currentSettings.pageTabColor }}>BRANDING ASSETS</span>
                                    <div className="transform -rotate-90">
                                        <ChevronDown
                                            className="w-6 h-6 stroke-[2]"
                                            style={{ color: currentSettings.pageTabColor }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Settings
