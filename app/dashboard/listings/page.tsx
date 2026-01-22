"use client";
import React, { useEffect, useState } from "react";
import QuickViewCard, { AgentData } from "@/components/QuickViewCard";
import ListingsTable from "@/components/ListingsTable";
import Link from "next/link";
import { DeleteListing, GetListing } from "./listing";
import { toast } from "sonner";
import { useAppContext } from "@/app/context/AppContext";
import { useWhiteLabel } from "@/app/context/Whitelabel";
import { List } from "lucide-react";
import KanbanViewCard from "./components/KanbanViewCard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSearchParams } from "next/navigation";
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
};
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
  paid_amount: string | number
  distance: string;
  km_price: string;
  est_time: string;
  order_status:
  | "Processing"
  | "In Progress"
  | "Pending"
  | "Completed"
  | "Cancelled"
  | "On Hold";
  payment_status: "PAID" | "UNPAID" | "PARTIALLY_PAID";
  property_address: string;
  property_location: string;
  vendor_address: string;
  vendor_location: string;
  created_at: string;
  updated_at: string;
  services: OrderService[];
  lock_materials: boolean;
  tours?: {
    files?: {
      is_featured?: boolean;
      file_path?: string;
    }[]
  }[];
}
export interface Listings {
  uuid: string;
  id?: number;
  payment_status: string
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
  agent: {
    uuid: string;
    first_name: string;
    last_name: string;
    email: string;
    created_at: string;
    company_name: string;
    payment_status: string;
    notes: string;
    status?: boolean;
    permissions?: { id: number; name: string }[];
    roles?: { id: number; name: string }[];
    headquarter_address?: string;
    primary_phone?: string;
    secondary_phone?: string;
    avatar_url?: string;
    activity?: string;
  };
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
  tour_activated?: boolean
}

const Page = () => {
  const { userType } = useAppContext();
  const { appliedSettings } = useWhiteLabel();
  const role = (userType as string) || 'admin';
  const roleSettings = appliedSettings[role as keyof typeof appliedSettings] || appliedSettings['admin'];

  const [showCard, setShowCard] = React.useState(false);
  const [type, setType] = React.useState("");
  const [listingsData, setListingsData] = useState<Listings[]>([]);
  const [selectedData, setSelectedData] = useState<Listings | null>(null);
  const [selectedData1, setSelectedData1] = useState<AgentData>();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);
  const [activeView, setActiveView] = useState('kanban');
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterTour, setFilterTour] = useState("all");

  const searchParams = useSearchParams();
  const agentFilter = searchParams.get("agent") || "";


  const handleViewChange = (view: string) => {
    setActiveView(view);
  };
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
      })
      .catch((err) => {
        console.log(err.message);
        setError(true);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);
  const handleDelete = async (userId: string) => {
    try {
      await DeleteListing(userId);
      toast.success("Sub-Account deleted successfully");
      setListingsData((prev) =>
        prev.filter((listingsData) => listingsData.uuid !== userId)
      );
    } catch (error) {
      if (error instanceof Error) {
        console.error("Delete failed:", error.message);
        toast.error(error.message || "Failed to delete Listing");
      } else {
        console.error("Delete failed:", error);
        toast.error("Failed to delete Listing");
      }
    }
  };


  const filteredListings = listingsData.filter((listing) => {
    const search = searchQuery.toLowerCase();

    const matchesSearch =
      listing.address?.toLowerCase().includes(search) ||
      listing.city?.toLowerCase().includes(search) ||
      listing.agent?.first_name?.toLowerCase().includes(search) ||
      listing.agent?.last_name?.toLowerCase().includes(search) ||
      (listing.tour_activated ? "active" : "inactive").includes(search);

    const matchesStatus =
      filterStatus === "all" ||
      filterStatus === "" ||
      listing.property_status === filterStatus;

    const matchesTour =
      filterTour === "all" ||
      (filterTour === "true" && listing.tour_activated === true) ||
      (filterTour === "false" && listing.tour_activated === false);

    const matchesAgent =
      agentFilter === "" || listing.agent?.uuid === agentFilter;

    return matchesSearch && matchesStatus && matchesTour && matchesAgent;
  });




  return (
    <div>
      <div
        className="w-full h-[80px] font-alexandria z-10 relative flex justify-between px-[20px] items-center"
        style={{ backgroundColor: roleSettings.pageBg, boxShadow: "0px 4px 4px #0000001F" }}
      >
        <p className='text-[16px] md:text-[24px] font-[400]' style={{ color: roleSettings.pageTabColor }}>
          Listings ({filteredListings?.length})
        </p>
        <div className="flex justify-end items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="flex bg-white rounded-lg p-1 gap-2 border border-gray-300">
              <button
                onClick={() => handleViewChange('listings')}
                className={`p-2 rounded-md transition-all ${activeView === 'listings' ? 'text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                style={{ backgroundColor: activeView === 'listings' ? roleSettings.pageTabColor : 'transparent' }}
                title="Listings View"
              >
                <List className="w-5 h-5" />
              </button>

              <button
                onClick={() => handleViewChange('kanban')}
                className={`p-2 rounded-md transition-all ${activeView === 'kanban' ? 'text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                style={{ backgroundColor: activeView === 'kanban' ? roleSettings.pageTabColor : 'transparent' }}
                title="Kanban View"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
            </div>
          </div>
          {userType !== "vendor" && (
            <Link
              href={"/dashboard/listings/create"}
              className='w-[110px] rounded-[6px] md:w-[143px] h-[35px] md:h-[44px] border-[1px] text-[14px] md:text-[16px] font-[400] text-[#EEEEEE] flex gap-[5px] justify-center items-center hover:brightness-110'
              style={{ backgroundColor: roleSettings.pageTabColor, borderColor: roleSettings.pageTabColor }}
            >
              + New Listing
            </Link>
          )}
        </div>
      </div>

      <div
        className="w-full px-4 py-3 border-b border-gray-200 border border-b-gray-300 grid grid-cols-3 gap-4 h-[60px] font-alexandria"
        style={{ backgroundColor: `var(--${userType}-page-bg, #E4E4E4)` }}>

        <Input
          placeholder="Search listings..."
          className="h-[38px] w-full bg-white"
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <Select onValueChange={(value) => setFilterStatus(value)}>
          <SelectTrigger className="w-full h-[38px] bg-white">
            <SelectValue placeholder="Property Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="Just listed">Just listed</SelectItem>
            <SelectItem value="Sold">Sold</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Under contract">Under contract</SelectItem>
            <SelectItem value="Withdrawn">Withdrawn</SelectItem>
          </SelectContent>
        </Select>


        <Select onValueChange={(value) => setFilterTour(value)}>
          <SelectTrigger className="h-[38px] w-full bg-white">
            <SelectValue placeholder="Tour Status" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="true">Tour Active</SelectItem>
            <SelectItem value="false">Tour InActive</SelectItem>
          </SelectContent>
        </Select>


      </div>

      <>
        {activeView === 'listings' && (
          <div className="w-full">
            <ListingsTable
              data={filteredListings}
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
            {type === "agent" && showCard && selectedData1 && (
              <QuickViewCard
                type="agent"
                data={selectedData1}
                onClose={() => setShowCard(false)}
              />
            )}
            {type === "listing" && showCard && selectedData && (
              <QuickViewCard
                type="listing"
                data={selectedData}
                onClose={() => setShowCard(false)}
              />
            )}
          </div>
        )}
        {activeView === 'kanban' && (
          <>
            {loading ? (
              <div className="w-full grid grid-cols-4 gap-8 p-4 mt-20">
                {[...Array(8)].map((_, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-md shadow-md p-4 animate-pulse h-[230px]"
                  >
                    <div className="h-[130px] bg-gray-200 rounded-md mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="w-full flex justify-center items-center p-8 mt-20">
                <p className="text-red-500 text-lg">Failed to load listings. Please try again.</p>
              </div>
            ) : filteredListings.length === 0 ? (
              <div className="w-full flex justify-center items-center p-8 mt-20">
                <p className="text-gray-500 text-lg">No listings found.</p>
              </div>
            ) : (
              <div className="w-full grid grid-cols-4 gap-8 p-4 mt-20">
                {filteredListings.map((listing) => (
                  <KanbanViewCard
                    key={listing.uuid}
                    listing={listing}
                    onQuickView={() => {
                      setShowCard(true);
                      setType("listing");
                      setSelectedData(listing);
                    }}
                  />
                ))}
              </div>
            )}
            {type === "listing" && showCard && selectedData && (
              <QuickViewCard
                type="listing"
                data={selectedData}
                onClose={() => setShowCard(false)}
              />
            )}
          </>
        )}
      </>
    </div>
  );
};

export default Page;
