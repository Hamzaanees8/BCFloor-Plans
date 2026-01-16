'use client';

import { useEffect, useMemo, useState } from 'react';
import TourSettings from './TourSettings';
import TourPicture from './TourPicture';
import TourMatterport from './TourMatterport';
import { Order } from '../../orders/page';
import TourVideos from './TourVideos';
import TourFloorPlans from './TourFloorPlans';
import TourConfirm from './TourConfirm';
import { useAppContext } from '@/app/context/AppContext';
import TourActivityDialog from './TourActivityDialog';

// const tabs = ['Settings', 'Photos', 'Floorplan', 'Matterport', 'Confirm'];
interface TourProps {
  orderData: Order | null
}

export default function TourTabs({ orderData }: TourProps) {
  const [activeTab, setActiveTab] = useState('Settings');
  const [open, setOpen] = useState(false);
  const { userType } = useAppContext()

  const hasPhotos = orderData?.services.some(s => s.service.name.toLowerCase().includes('photo'));
  const hasVideos = orderData?.services.some(s => s.service.name.toLowerCase().includes('video') || s.service.name.toLowerCase().includes('reel'));
  const hasMatterport = orderData?.services.some(s => s.service.name.toLowerCase().includes('matterport') || s.service.name.toLowerCase().includes('3d tour'));
  const hasFloorPlans = orderData?.services.some(s => s.service.name.toLowerCase().includes('floor plan'));

  const visibleTabs = useMemo(() => {
    const tabs = ['Settings'];
    if (hasPhotos) tabs.push('Photos');
    if (hasMatterport) tabs.push('Matterport');
    if (hasVideos) tabs.push('Videos');
    if (hasFloorPlans) tabs.push('Floor plans');
    tabs.push('Confirm');
    return tabs;
  }, [hasPhotos, hasMatterport, hasVideos, hasFloorPlans]);

  useEffect(() => {
    if (!visibleTabs.includes(activeTab)) {
      setActiveTab('Settings');
    }
  }, [visibleTabs, activeTab]);

  const renderContent = () => {
    switch (activeTab) {
      case 'Settings':
        return <div className="p-4"><TourSettings orderData={orderData} /></div>;
      case 'Photos':
        return <div className="p-4"><TourPicture orderData={orderData} /></div>;
      case 'Floor plans':
        return <div className=""><TourFloorPlans /></div>;
      case 'Videos':
        return <div className="p-4"><TourVideos /></div>;
      case 'Matterport':
        return <div className="p-4"><TourMatterport /></div>;
      case 'Confirm':
        return <div className="p-4"><TourConfirm orderData={orderData} /></div>;
      default:
        return null;
    }
  };

  return (
    <div className="w-full">
      <div className='flex justify-center h-[60px] items-center bg-[#E4E4E4]'>
        <div className=" w-fit flex border-gray-300 gap-[10px]">
          {visibleTabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-center px-4 py-2 text-[13px] w-[180px] h-[32px] transition-colors ${activeTab === tab
                ? `${userType}-bg text-white  rounded-[6px]  font-[500] `
                : 'text-[#666666] hover:text-[#666666] font-[700] '
                }`}
            >
              {tab.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
      <div className="bg-white shadow-md border rounded-b-md mt-0">
        {renderContent()}
      </div>
      <TourActivityDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
