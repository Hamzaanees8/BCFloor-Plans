'use client';
import React, { useEffect, useState, useRef } from 'react';
import QuickViewCard, { AgentData } from '@/components/QuickViewCard';
import Link from 'next/link';
import { DeleteListing, GetListing, UpdateListingStatus } from './listing';
import { toast } from 'sonner';
import { useAppContext } from '@/app/context/AppContext';
import { useWhiteLabel } from '@/app/context/Whitelabel';
import { List } from 'lucide-react';
import KanbanViewCard from './components/KanbanViewCard';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSearchParams, useRouter } from 'next/navigation';
import { DataTable } from '@/components/DataTable';
import { ColumnDef, Row } from '@tanstack/react-table';
import { Switch } from '@/components/ui/switch';
import DropdownActions from '@/components/DropdownActions';
import { Listings, Agent } from '@/lib/types';
import { Get as GetAgents } from '@/app/dashboard/agents/agents';
const getLatestOrder = (orders?: any[]) => {
  if (!orders || orders.length === 0) return null;
  return [...orders].sort(
    (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
  )[0];
};

const getProjectStatus = (orders?: any[]) => {
  const latestOrder = getLatestOrder(orders);
  if (!latestOrder) {
    return { label: "No Bookings", color: "bg-gray-100 text-gray-800 border-gray-200" };
  }

  const orderStatus = latestOrder.order_status;
  const paymentStatus = latestOrder.payment_status;

  if (orderStatus === "Completed") {
    if (paymentStatus === "PAID") {
      return { label: "Complete", color: "bg-green-100 text-green-800 border-green-200" };
    } else {
      return { label: "Ready for Payment", color: "bg-amber-100 text-amber-800 border-amber-200" };
    }
  }

  if (orderStatus === "Processing" || orderStatus === "In Progress" || orderStatus === "Pending") {
    return { label: "Scheduled", color: "bg-blue-100 text-blue-800 border-blue-200" };
  }

  if (orderStatus === "Cancelled") {
    return { label: "Cancelled", color: "bg-red-100 text-red-800 border-red-200" };
  }

  if (orderStatus === "On Hold") {
    return { label: "On Hold", color: "bg-orange-100 text-orange-800 border-orange-200" };
  }

  return { label: orderStatus || "N/A", color: "bg-gray-100 text-gray-800 border-gray-200" };
};

const getPaymentStatus = (orders?: any[]) => {
  const latestOrder = getLatestOrder(orders);
  if (!latestOrder) {
    return { label: "N/A", color: "bg-gray-100 text-gray-800 border-gray-200" };
  }

  const status = latestOrder.payment_status;
  if (status === "PAID") {
    return { label: "Paid", color: "bg-emerald-100 text-emerald-800 border-emerald-200" };
  } else if (status === "PARTIALLY_PAID") {
    return { label: "Partially Paid", color: "bg-amber-100 text-amber-800 border-amber-200" };
  } else {
    return { label: "Unpaid", color: "bg-rose-100 text-rose-800 border-rose-200" };
  }
};


const slugify = (text: string) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
};

const Page = () => {
  const { userType } = useAppContext();
  const router = useRouter();
  const { appliedSettings } = useWhiteLabel();
  const role = (userType as string) || 'admin';
  const roleSettings = appliedSettings[role as keyof typeof appliedSettings] || appliedSettings['admin'];

  const [showCard, setShowCard] = React.useState(false);
  const [type, setType] = React.useState("");
  const [listingsData, setListingsData] = useState<Listings[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedData, setSelectedData] = useState<Listings | null>(null);
  const [selectedData1, setSelectedData1] = useState<AgentData>();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);
  const [activeView, setActiveView] = useState('kanban'); // Default to listings (table) view
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterTour, setFilterTour] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const searchParams = useSearchParams();
  const agentFilter = searchParams.get("agent") || "";
  const headerRef = useRef<HTMLDivElement>(null);

  const handleAgentChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") {
      params.set("agent", value);
    } else {
      params.delete("agent");
    }
    router.push(`?${params.toString()}`);
  };

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    let ancestor = header.parentElement;
    while (ancestor) {
      const style = window.getComputedStyle(ancestor);
      if (style.overflowX === 'hidden' || ancestor.classList.contains('overflow-x-hidden')) {
        ancestor.style.setProperty('overflow-x', 'visible', 'important');
        ancestor.style.setProperty('overflow-y', 'visible', 'important');

        const target = ancestor;
        return () => {
          target.style.removeProperty('overflow-x');
          target.style.removeProperty('overflow-y');
        };
      }
      ancestor = ancestor.parentElement;
    }
  }, []);


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

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    if (userType === 'admin' || userType === 'vendor') {
      GetAgents()
        .then((data) => {
          setAgents(Array.isArray(data.data) ? data.data : []);
        })
        .catch((err) => {
          console.error("Failed to fetch agents for filter:", err);
        });
    }
  }, [userType]);

  const handleDelete = async (userId: string) => {
    try {
      await DeleteListing(userId);
      toast.success("Listing deleted successfully");
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

  const handleUpdateStatus = async (listingId: string, status: boolean) => {
    try {

      const payload = {
        status: status,
        _method: "POST",
      };

      const result = await UpdateListingStatus(listingId, payload);
      toast.success("Listing status updated successfully");

      return result;
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error(error.message);
        toast.error(error.message || "Failed to submit user data");
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
  }).sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      case "oldest":
        return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
      case "price_high":
        return (b.listing_price || 0) - (a.listing_price || 0);
      case "price_low":
        return (a.listing_price || 0) - (b.listing_price || 0);
      case "address_asc":
        return (a.address || "").localeCompare(b.address || "");
      case "address_desc":
        return (b.address || "").localeCompare(a.address || "");
      default:
        return 0;
    }
  });

  const columns: ColumnDef<Listings>[] = [
    {
      accessorKey: "address",
      header: "Location",
      cell: ({ row }: { row: Row<Listings> }) => {
        const listing = row.original;
        return (
          <div
            onClick={() => {
              setShowCard(true);
              setType("listing");
              setSelectedData(listing);
            }}
            className={`text-[15px] font-[400] ${userType}-text cursor-pointer hover:underline`}
          >
            {[
              listing?.address && listing?.suite
                ? `${listing.suite} - ${listing.address}`
                : listing?.address || listing?.suite,
              listing?.city,
              listing?.province,
              listing?.postal_code,
              listing?.country,
            ]
              .filter(Boolean)
              .join(", ")}
          </div>
        );
      },
    },
    {
      accessorKey: "bookings",
      header: "Order #",
      cell: ({ row }: { row: Row<Listings> }) => {
        const orders = row.original.orders;
        return (
          <div className="text-[15px] font-[400] text-[#7D7D7D] flex items-center gap-1">
            {orders?.length
              ? orders.map((order, index) => (
                <div key={order.id}>
                  <Link
                    href={`/dashboard/orders/${order.uuid}`}
                    className={`font-[500] hover:underline ${userType}-text`}
                  >
                    {order.id}
                  </Link>
                  {orders.length && index < orders.length - 1 && ", "}
                </div>
              ))
              : "N/A"}
          </div>
        );
      },
    },
    ...(userType === "admin" || userType === "vendor"
      ? [
        {
          accessorKey: "agent",
          header: "Agent",
          cell: ({ row }: { row: Row<Listings> }) => {
            const agent = row.original.agent;
            return (
              <div
                onClick={() => {
                  setShowCard(true);
                  setType("agent");
                  setSelectedData1(agent as unknown as AgentData);
                }}
                className={`text-[15px] font-[400] ${userType}-text cursor-pointer`}
              >
                {agent?.first_name + " " + agent?.last_name || "N/A"}
              </div>
            );
          },
        } as ColumnDef<Listings>,
      ]
      : []),
    {
      id: "project_status",
      header: "Order Status",
      cell: ({ row }: { row: Row<Listings> }) => {
        const listing = row.original;
        const status = getProjectStatus(listing.orders);
        return (
          <div className="text-[13px] font-[500]">
            <span className={`px-2.5 py-1 rounded-full border text-[12px] font-[500] ${status.color}`}>
              {status.label}
            </span>
          </div>
        );
      }
    },
    {
      id: "payment_status",
      header: "Payment Status",
      cell: ({ row }: { row: Row<Listings> }) => {
        const listing = row.original;
        const status = getPaymentStatus(listing.orders);
        return (
          <div className="text-[13px] font-[500]">
            <span className={`px-2.5 py-1 rounded-full border text-[12px] font-[500] ${status.color}`}>
              {status.label}
            </span>
          </div>
        );
      }
    },
    {
      id: "public_tour",
      header: "Public Tour",
      cell: ({ row }: { row: Row<Listings> }) => {
        const listing = row.original;
        const latestOrder = getLatestOrder(listing.orders);
        const tour = latestOrder?.tours?.[0];
        const isPublished = tour?.is_publish;
        if (isPublished && latestOrder) {
          const addressSlug = listing.suite ? `${listing.suite} - ${listing.address}` : listing.address;
          const publicTourUrl = `/tour/${slugify(addressSlug)}/${latestOrder.uuid}`;
          return (
            <a
              href={publicTourUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[12px] font-[600] px-2.5 py-1 rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 transition-all shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
              <span>View Tour</span>
            </a>
          );
        }
        return <span className="text-[12px] text-gray-400 font-medium pl-2">Not Published</span>;
      }
    },
    {
      accessorKey: "created_at",
      header: "Added",
      cell: ({ row }: { row: Row<Listings> }) => {
        const date = row.getValue("created_at");
        return (
          <div className="text-[15px] font-[400] text-[#7D7D7D]">
            {date
              ? new Date(date as string).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "2-digit",
              })
              : "N/A"}
          </div>
        );
      },
    },
    ...(userType !== "vendor"
      ? [
        {
          accessorKey: "status",
          header: "Status",
          cell: ({ row }: { row: Row<Listings> }) => {
            const listing = row.original;
            const options = [
              {
                label: "Edit",
                onClick: () => {
                  router.push(`/dashboard/listings/create/${listing.uuid}`);
                },
              },
              {
                label: "Quick View",
                onClick: () => {
                  setShowCard(true);
                  setType("listing");
                  setSelectedData(listing);
                },
              },
              {
                label: "Delete",
                onClick: () => handleDelete(listing.uuid || ""),
                confirm1: true,
              },
            ];

            return (
              <div className="text-[15px] font-[400] text-[#7D7D7D] flex justify-between items-center gap-2">
                <Switch
                  checked={!!listing.status}
                  onCheckedChange={async (checked) => {
                    const data = await handleUpdateStatus(
                      listing.uuid || "",
                      checked
                    );
                    if (setListingsData && data?.data?.uuid) {
                      setListingsData((prev: Listings[]) =>
                        prev.map((list: Listings) =>
                          list.uuid === data.data.uuid
                            ? { ...list, status: checked }
                            : list
                        )
                      );
                    }
                  }}
                  className={`${listing.status ? "!bg-[#6BAE41]" : "!bg-[#E06D5E]"
                    } data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-500`}
                />

                <DropdownActions options={options} />
              </div>
            );
          },
        } as ColumnDef<Listings>,
      ]
      : []),
    {
      id: "actions-mobile", // To ensure actions are available or consistent if needed, but DropdownActions covers it.
      // keeping it simple as per original
      enableHiding: true,
      header: "",
      cell: () => null
    }
  ].filter(c => c.id !== "actions-mobile"); // Clean up helper


  return (
    <div>
      <div
        ref={headerRef}
        className="w-full h-[80px] font-alexandria z-50 sticky top-0 flex justify-between px-[20px] items-center"
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
              href={"/dashboard/orders/create"}
              className='w-[110px] rounded-[6px] md:w-[143px] h-[35px] md:h-[44px] border-[1px] text-[14px] md:text-[16px] font-[400] text-[#EEEEEE] flex gap-[5px] justify-center items-center hover:brightness-110'
              style={{ backgroundColor: roleSettings.pageTabColor, borderColor: roleSettings.pageTabColor }}
            >
              + New Booking
            </Link>
          )}
          {/* {(userType !== "vendor" && userType !== "agent") && (
            <Link
              href={"/dashboard/listings/create"}
              className='w-[110px] rounded-[6px] md:w-[143px] h-[35px] md:h-[44px] border-[1px] text-[14px] md:text-[16px] font-[400] text-[#EEEEEE] flex gap-[5px] justify-center items-center hover:brightness-110'
              style={{ backgroundColor: roleSettings.pageTabColor, borderColor: roleSettings.pageTabColor }}
            >
              + New Listing
            </Link>
          )} */}
        </div>
      </div>

      <div
        className={`w-full px-4 py-3 border-b border-gray-200 border border-b-gray-300 grid ${userType === "admin" || userType === "vendor" ? "grid-cols-5" : "grid-cols-4"
          } gap-4 h-[60px] font-alexandria`}
        style={{ backgroundColor: `var(--${userType}-page-bg, #E4E4E4)` }}>

        <Input
          placeholder="Search listings..."
          className="h-[38px] w-full bg-white"
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        {(userType === "admin" || userType === "vendor") && (
          <Select value={agentFilter || "all"} onValueChange={handleAgentChange}>
            <SelectTrigger className="h-[38px] w-full bg-white">
              <SelectValue placeholder="All Agents" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              <SelectItem value="all">All Agents</SelectItem>
              {agents.map((agent) => (
                <SelectItem key={agent.uuid} value={agent.uuid || ""}>
                  {agent.first_name} {agent.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

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
            <SelectItem value="false">Tour Inactive</SelectItem>
          </SelectContent>
        </Select>

        <Select onValueChange={(value) => setSortBy(value)}>
          <SelectTrigger className="h-[38px] w-full bg-white">
            <SelectValue placeholder="Sort By" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
            <SelectItem value="price_high">Price: High to Low</SelectItem>
            <SelectItem value="price_low">Price: Low to High</SelectItem>
            <SelectItem value="address_asc">Address: A-Z</SelectItem>
            <SelectItem value="address_desc">Address: Z-A</SelectItem>
          </SelectContent>
        </Select>


      </div>

      <>
        {activeView === 'listings' && (
          <div className="w-full">
            <DataTable
              data={filteredListings}
              columns={columns}
              loading={loading}
              error={error}
              userType={userType}
              headerBgOverride={`var(--${userType}-page-bg, #E4E4E4)`}
              dataName="Listings"
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
                    data={listing}
                    onQuickView={() => {
                      setShowCard(true);
                      setType("listing");
                      setSelectedData(listing);
                    }}
                  />
                ))}
              </div>
            )}
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
                onClose={() => setShowCard(false)} // Fix logic here, was checking selectedData again
              />
            )}
          </>
        )}
      </>
    </div>
  );
};

export default Page;
