"use client";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import React, { useEffect, useState } from 'react'
import { BackArrow } from '@/components/Icons';
import { useParams, useRouter } from 'next/navigation';
import { GetOneOrder } from '../../orders/orders';
import Service from './2DFloor';
import { Order } from '../../orders/page';
import { GetServices } from '../../services/services';
import { Services } from '../../services/page';
import FileTab1 from './HDRStill';
import FileTab2 from './3DFloor';
import TourTabs from './TourTabs';
import Video from './Video';
import CreateFeatureSheet from './CreateFeatureSheet';

type Service = {
    uuid: string;
    name: string;
}
type OrerServices = {
    service: Service

}
const FileManager = () => {
    const router = useRouter();
    const [services, setServices] = React.useState([]);
    const [servicesData, setServicesData] = React.useState<Services[]>([]);
    const [activeTab, setActiveTab] = useState<string>("");
    const [orderData, setOrderData] = React.useState<Order | null>(null);
    const params = useParams();
    const orderId = params?.id as string;
    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            console.log("Token not found.");
            return;
        }

        GetOneOrder(token, orderId || "")
            .then((data) => {
                setOrderData(data.data);
                setServices(data.data.services);
                setActiveTab(data.data.services?.[0]?.service?.uuid || "");
            })
            .catch((err) => console.log(err.message));
    }, [orderId]);
    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            console.log("Token not found.");
            return;
        }

        GetServices(token)
            .then((data) => {
                setServicesData(data.data)
            })
            .catch((err) => console.log(err.message));
    }, [orderId]);
    console.log('services', services);

    const renderContent = () => {
        if (activeTab === "tour") {
            return <TourTabs orderData={orderData} />;
        }

        if (activeTab === "CreateFeatureSheet") {
            return <CreateFeatureSheet orderData={orderData} />;
        }
        const currentService = servicesData?.find(
            (srv) => srv.uuid === activeTab
        );

        console.log('currentService', currentService);

        const category = currentService?.category?.name;

        console.log('category', category);

        switch (category) {
            case 'Video':
                return <div><Video currentService={currentService} /></div>;
            case 'Floor Plan':
                return <Service orderData={orderData} currentService={currentService} />;
            case 'HDR Photos':
                return <FileTab1 currentService={currentService} />;
            case '3d rendering':
                return <FileTab2 currentService={currentService} />;
            case 'drone':
                return <div>Drone Component</div>;
            case 'Staging':
                return <div>Staging Component</div>;
            case 'Standard Photos':
                return <div>Standard Photos Component</div>;
            case 'Twilight Photos':
                return <div>Twilight Photos Component</div>;
            case '3D Tour':
                return <FileTab2 currentService={currentService} />;
            default:
                return <div className='flex justify-center font-alexandria mt-20'><p>Default Component</p></div>;
        }
    };


    console.log('serivices', services)
    return (
        <div>
            <div className='w-full h-[80px] bg-[#E4E4E4] font-alexandria pr-5 z-10 relative  flex justify-between items-center' >
                <div className='flex items-center gap-x-4'>
                    <div className="flex items-center p-4 gap-x-2.5 bg-[#4290E9] h-full w-[240px]">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src="https://github.com/shadcn.png" />
                            <AvatarFallback>CN</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="text-[14px] font-normal text-white font-alexandria leading-4">BC Floor Plans</p>
                            <p className="text-[14px] font-normal text-white font-alexandria leading-4">Media Company Owner</p>
                            <p className="text-[12px] font-normal text-white font-alexandria leading-4">Taylor Tayburn</p>
                        </div>
                    </div>
                    <p className='text-[16px] md:text-[24px] font-[400]  text-[#4290E9]'>File Manager › Order #{orderData?.id || ""}</p>
                </div>
                <div className='flex items-center gap-x-2.5'>
                    {/* <Link
                        href={""}
                        className="w-[110px] rounded-[6px] md:w-[143px] h-[35px] md:h-[44px]  border-[1px] border-[#4290E9] bg-[#EEEEEE] text-[14px] md:text-[16px] font-[400] text-[#4290E9] flex gap-[5px] justify-center items-center hover:text-[#fff] hover:bg-[#4290E9]"
                    >
                        Invoice
                    </Link>
                    <Link
                        href={""}
                        className="w-[110px] rounded-[6px] md:w-[143px] h-[35px] md:h-[44px]  border-[1px] border-[#4290E9] bg-[#EEEEEE] text-[14px] md:text-[16px] font-[400] text-[#4290E9] flex gap-[5px] justify-center items-center hover:text-[#fff] hover:bg-[#4290E9]"
                    >
                        Save Changes
                    </Link>
                    <Link href={''} className='w-[110px] md:w-[143px] h-[35px] md:h-[44px]  justify-center rounded-[6px] border-[1px] border-[#4290E9] bg-[#4290E9] text-[14px] md:text-[16px] font-[400] text-[#EEEEEE] flex gap-[5px] items-center hover:text-[#fff] hover:bg-[#4290E9]'>Submit</Link>
                    */}
                </div>
            </div>
            <div className='w-full h-[90px] bg-[#E4E4E4] font-alexandria pr-5 z-10 flex items-center border-b border-[#BBBBBB]' >
                <div className='px-[26px]'>
                    <div
                        className="min-h-[32px] w-[115px] flex items-center cursor-pointer rounded-[24px] bg-[#4290E9]"
                        onClick={() => router.push(`/dashboard/orders/${orderData?.uuid}`)}
                    >
                        <div className="flex items-center px-[14px] py-[4px] gap-x-[10px]">
                            <BackArrow />
                            <p className="text-[16px] font-semibold text-white font-alexandria">BACK</p>
                        </div>
                    </div>
                </div>
                <div className='flex items-center justify-center w-full'>
                    <div className='flex items-center gap-x-6'>
                        {services?.map((service: OrerServices) => {
                            const isActive = service.service.uuid === activeTab;
                            return (
                                <div
                                    key={service.service.uuid}
                                    onClick={() => setActiveTab(service.service.uuid)}
                                    className={`h-[60px] cursor-pointer flex items-center justify-center font-medium text-[9px] w-[95px] border px-1 text-center rounded-[4px] transition-all duration-200 ${isActive
                                        ? 'bg-[#4290E9] text-white border-[#4290E9]'
                                        : 'bg-[#F2F2F2] text-[#4290E9] border-[#4290E9]'
                                        }`}
                                >
                                    {service.service.name}
                                </div>
                            );
                        })}

                        <div
                            key="tour"
                            onClick={() => setActiveTab("tour")}
                            className={`h-[60px] cursor-pointer flex items-center justify-center font-medium text-[9px] w-[95px] border px-1 text-center rounded-[4px] transition-all duration-200 ${activeTab === "tour"
                                ? 'bg-[#4290E9] text-white border-[#4290E9]'
                                : 'bg-[#F2F2F2] text-[#4290E9] border-[#4290E9]'
                                }`}
                        >
                            Tour
                        </div>

                        <div
                            key="CreateFeatureSheet"
                            onClick={() => setActiveTab("CreateFeatureSheet")}
                            className={`h-[60px] cursor-pointer flex items-center justify-center font-medium text-[9px] w-[95px] border px-1 text-center rounded-[4px] transition-all duration-200 ${activeTab === "CreateFeatureSheet"
                                ? 'bg-[#4290E9] text-white border-[#4290E9]'
                                : 'bg-[#F2F2F2] text-[#4290E9] border-[#4290E9]'
                                }`}
                        >
                            Create Feature Sheet
                        </div>

                    </div>
                </div>
            </div>
            <div>{renderContent()}</div>
        </div>
    )
}

export default FileManager;