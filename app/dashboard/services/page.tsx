"use client";

import React, { useEffect, useState } from 'react';
import ServicesTable from '@/components/ServicesTable';
import Link from 'next/link';
import { CleanedProductOption, GetServices } from './services';
import ProtectedAdminRoute from '@/components/ProtectedAdminRoute';
import { useAppContext } from '@/app/context/AppContext';


export interface Services {
  uuid: string;
  id: number;
  name?: string;
  category?: { name: string };
  background_color?: string;
  border_color?: string;
  thumbnail?: string
  thumbnail_url?: string
  status?: boolean;
  type?: string;
  duration?: boolean;
  service_add_ons: {
    title?: string;
    amount?: number;
    uuid?: string;
  }[];
  product_options: CleanedProductOption[];
  vendor_services: {
    uuid: string;
    name: string;
    status: boolean;
    time_needed: number;
    hourly_rate: string;
    vendor: {
      first_name: string;
      last_name: string;
      uuid: string;
      email: string;
      primary_phone: string;
      homebase_address: {
        city: string;
        state: string;
        country: string;
        address_line_1: string;
      }
    }
  }[]
}

const Page = () => {
  const { userType } = useAppContext();
  const [servicesData, setServicesData] = useState<Services[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    const token = localStorage.getItem("token")

    if (!token) {
      console.log("Token not found.");
      setLoading(false);
      setError(true);
      return;
    }

    setLoading(true);
    setError(false);

    GetServices(token)
      .then((data) => {
        setServicesData(Array.isArray(data.data) ? data.data : []);
      })
      .catch(err => {
        console.log(err.message);
        setError(true);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  console.log('servicesData', servicesData);

  return (
    <ProtectedAdminRoute>
    <div>
      <div
        className='w-full h-[80px] bg-[#E4E4E4] font-alexandria z-10 relative flex justify-between px-[20px] items-center'
        style={{ boxShadow: "0px 4px 4px #0000001F" }}
      >
        <p className={`text-[16px] md:text-[24px] font-[400] ${userType}-text`}>
          Services ({servicesData.length})
        </p>
        <div className='flex space-x-3'>
          {/* <Link href={'/dashboard/services/create'} className='w-[110px] rounded-[6px] md:w-[143px] h-[35px] md:h-[44px]  border-[1px] border-[#4290E9] bg-[#EEEEEE] text-[14px] md:text-[16px] font-[400] text-[#4290E9] flex gap-[5px] justify-center items-center hover:text-[#fff] hover:bg-[#4290E9]'>+ Package</Link> */}
         {userType !== 'vendor' &&  <Link
            href={'/dashboard/services/create'}
            className={`w-[110px] rounded-[6px] md:w-[143px] h-[35px] md:h-[44px] border-[1px] ${userType}-border bg-[#EEEEEE] text-[14px] md:text-[16px] font-[400] ${userType}-text flex gap-[5px] justify-center items-center hover:text-[#fff] hover-${userType}-bg ${userType}-button`}
          >
            + New Service
          </Link>}
        </div>
      </div>

      <div className="w-full">
        <ServicesTable
          data={servicesData}
          setServicesData={setServicesData}
          loading={loading}
          error={error}
        />
      </div>
    </div>
    </ProtectedAdminRoute>
  );
};

export default Page;
