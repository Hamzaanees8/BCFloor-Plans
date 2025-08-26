"use client";
import React, { useEffect, useState } from "react";
import QuickViewCard, { AgentData } from "@/components/QuickViewCard";
import ListingsTable from "@/components/ListingsTable";
import Link from "next/link";
import { DeleteListing, GetListing } from "./listing";
import { toast } from "sonner";
import { useAppContext } from "@/app/context/AppContext";
type Service = {
  id: number;
  uuid: string;
  name: string;
  category_id: number;
  thumbnail: string;
  // Add more fields if there are others
};
type Option = {
  quantity: number;
}
type OrderService = {
  id: number;
  uuid: string;
  amount: string;
  created_at: string;
  updated_at: string;
  custom: string; // Can be replaced with a better type if known
  option_id: number;
  order_id: number;
  service_id: number;
  service: Service;
  option: Option;
};
interface Order {
  id: number;
  uuid: string;
  amount: string;
  distance: string;
  km_price: string;
  est_time: string;
  order_status: 'Processing' | 'In Progress' | 'Pending' | 'Completed' | 'Cancelled' | 'On Hold';
  payment_status: 'PAID' | 'UNPAID';
  property_address: string;
  property_location: string;
  vendor_address: string;
  vendor_location: string;
  created_at: string;
  updated_at: string;
  services: OrderService[];
}
export interface Listings {
  uuid: string;
  full_name?: string;
  company?: string;
  address: string;
  listing_price: number;
  bedrooms: number;
  bathrooms: number;
  square_footage: number;
  year_constructed: number;
  parking_spots: string;
  property_type: string;
  lot_size: string;
  agent: { uuid: string, first_name: string, last_name: string, email: string, created_at: string, company_name: string, payment_status: string, notes: string, status?: boolean, permissions?: { id: number, name: string }[], roles?: { id: number, name: string }[], headquarter_address?: string, primary_phone?: string, secondary_phone?: string, avatar_url?: string, activity?: string },
  property_status: string;
  stats: {
    photos: number;
    tours: number;
    visitors: number;
    imageViews: number;
  };
  activity?: string;
  postal_code?: string;
  province?: string;
  city?: string;
  country?: string;
  created_at?: Date;
  status?: boolean;
  orders?: Order[];
}

const Page = () => {
  const { userType } = useAppContext();
  const [showCard, setShowCard] = React.useState(false);
  const [countListing, setCountListing] = useState();
  const [type, setType] = React.useState("");
  console.log(type);
  const [listingsData, setListingsData] = useState<Listings[]>([]);
  const [selectedData, setSelectedData] = useState<Listings | null>(null);
  const [selectedData1, setSelectedData1] = useState<AgentData>();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  console.log("listingsData", listingsData);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      console.log("Token not found.");
      setLoading(false);
      setError(true);
      return;
    }
    setLoading(true);
    setError(false);
    GetListing(token)
      .then((data) => {
        setListingsData(Array.isArray(data.data) ? data.data : []);
        setCountListing(data.data.length);
      })
      .catch(err => {
        console.log(err.message);
        setError(true);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);
  const handleDelete = async (userId: string) => {
    try {
      const token = localStorage.getItem('token') || '';
      await DeleteListing(userId, token);
      toast.success('Sub-Account deleted successfully');
      setListingsData(prev => prev.filter(listingsData => listingsData.uuid !== userId));
    } catch (error) {
      if (error instanceof Error) {
        console.error('Delete failed:', error.message);
        toast.error(error.message || 'Failed to delete Listing');
      } else {
        console.error('Delete failed:', error);
        toast.error('Failed to delete Listing');
      }
    }
  };
  return (
    <div>
      <div
        className="w-full  h-[80px] bg-[#E4E4E4] font-alexandria  z-10 relative  flex justify-between px-[20px] items-center"
        style={{ boxShadow: "0px 4px 4px #0000001F" }}
      >
        <p 
        className={`text-[16px] md:text-[24px] font-[400] ${userType}-text`}
        >
          Listings ({countListing})
        </p>
        <Link
          href={"/dashboard/listings/create"}
          className={`w-[110px] rounded-[6px] md:w-[143px] h-[35px] md:h-[44px] border-[1px] ${userType}-border bg-[#EEEEEE] text-[14px] md:text-[16px] font-[400] ${userType}-text flex gap-[5px] justify-center items-center ${userType}-button hover-${userType}-bg`}
        >
          + New Listing
        </Link>
      </div>

      <>
        <div className="w-full">
          <ListingsTable
            data={listingsData}
            setListingsData={setListingsData}
            onQuickView={(selectedType, data) => {
              setShowCard(true);
              setType(selectedType);
              setSelectedData(data);
            }}
            onQuickView1={(selectedType, data) => {
              setShowCard(true);
              setType(selectedType);
              setSelectedData1(data);
            }}
            onDelete={handleDelete}
            loading={loading}
            error={error}
          />
          {(type === "agent") && showCard && selectedData1 && (
            <QuickViewCard
              type="agent"
              data={selectedData1}
              onClose={() => setShowCard(false)}
            />
          )}
          {(type === "listing") && showCard && selectedData && (
            <QuickViewCard
              type="listing"
              data={selectedData}
              onClose={() => setShowCard(false)}
            />
          )}
        </div>
      </>
    </div>
  );
};

export default Page;
