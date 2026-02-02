'use client';
import React, { useEffect, useState, useRef } from 'react';
import { GetPublicTours } from '@/app/agent/agent';
import { Tour } from '@/lib/types';
import { useAppContext } from '@/app/context/AppContext';
import { List } from 'lucide-react';
import KanbanViewCard from '@/app/dashboard/listings/components/KanbanViewCard';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/DataTable';
import { ColumnDef, Row } from '@tanstack/react-table';
import Header from '@/components/Header';

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
    const pageBg = '#EFEFEF';

    const [toursData, setToursData] = useState<Tour[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<boolean>(false);
    const [activeView, setActiveView] = useState('kanban');
    const [searchQuery, setSearchQuery] = useState("");

    const headerRef = useRef<HTMLDivElement>(null);

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
        setLoading(true);
        setError(false);
        GetPublicTours()
            .then((data) => {
                setToursData(Array.isArray(data.data) ? data.data : []);
            })
            .catch((err) => {
                console.error(err.message);
                setError(true);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    const filteredTours = toursData.filter((tour) => {
        const search = searchQuery.toLowerCase();
        const address = tour.orders?.property_address || tour.orders?.property?.address || "";
        const city = tour.orders?.property?.city || "";
        const mls = tour.orders?.property?.mls_number || "";
        const orderId = tour.orders?.id?.toString() || "";
        const tourId = tour.id?.toString() || "";

        return (
            address.toLowerCase().includes(search) ||
            city.toLowerCase().includes(search) ||
            mls.toLowerCase().includes(search) ||
            orderId.includes(search) ||
            tourId.includes(search)
        );
    });

    const columns: ColumnDef<Tour>[] = [
        {
            accessorKey: "address",
            header: "Location",
            cell: ({ row }: { row: Row<Tour> }) => {
                const tour = row.original;
                const address = tour.orders?.property_address || tour.orders?.property?.address || "N/A";
                const city = tour.orders?.property?.city || "";
                const province = tour.orders?.property?.province || "";
                const file_path = tour.files?.find((file) => file.is_featured)?.file_path || tour.files?.[0]?.file_path;
                const imgUrl = file_path ? `${process.env.NEXT_PUBLIC_FILES_API_URL}/${file_path}` : null;

                return (
                    <div className="flex items-center gap-4">
                        {imgUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={imgUrl}
                                alt="Tour Thumbnail"
                                className="w-[120px] h-[80px] object-cover rounded-md flex-shrink-0 bg-gray-200"
                            />
                        ) : (
                            <div className="w-[120px] h-[80px] bg-gray-200 rounded-md flex-shrink-0 flex items-center justify-center text-xs text-gray-500">
                                No Image
                            </div>
                        )}
                        <div
                            onClick={() => {
                                window.open(`/tour/${slugify(address)}/${tour.orders?.uuid}`, '_blank');
                            }}
                            className={`text-[#4290E9] text-[15px] font-[400] cursor-pointer hover:underline`}
                        >
                            {[address, city, province].filter(Boolean).join(", ")}
                        </div>
                    </div>
                );
            },
        },
        {
            accessorKey: "created_at",
            header: "Added",
            cell: ({ row }: { row: Row<Tour> }) => {
                const date = row.original.created_at;
                return (
                    <div className="text-[15px] font-[400] text-[#7D7D7D]">
                        {date
                            ? new Date(date).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "2-digit",
                            })
                            : "N/A"}
                    </div>
                );
            },
        },
        {
            accessorKey: "property_status",
            header: "Status",
            cell: ({ row }: { row: Row<Tour> }) => {
                return (
                    <div className="text-[15px] font-[400] text-[#7D7D7D]">
                        {row.original.orders?.property?.property_status || "N/A"}
                    </div>
                );
            },
        },
    ];

    return (
        <div className='min-h-screen relative font-alexandria' style={{ backgroundColor: pageBg }}>
            <Header />

            <div className="pt-[104px]">
                <div
                    ref={headerRef}
                    className="w-full h-[60px] z-10 sticky top-[104px] flex justify-between px-[20px] items-center bg-white shadow-sm border-b"
                >
                    <h1 className="text-[#4290E9] text-[24px] font-[600]">
                        Tours ({filteredTours?.length})
                    </h1>

                    <div className='flex gap-[20px] items-center'>
                        <div className="relative w-[300px]">
                            <Input
                                placeholder="Search properties..."
                                className="h-[38px] w-full bg-gray-50 pr-10"
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>

                        <div className="flex bg-gray-100 rounded-lg p-1 gap-1 border border-gray-200">
                            <button
                                onClick={() => handleViewChange('listings')}
                                className={`p-1.5 rounded-md transition-all ${activeView === 'listings' ? 'bg-white shadow-sm text-[#4290E9]' : 'text-gray-500 hover:bg-gray-200'}`}
                                title="List View"
                            >
                                <List className="w-5 h-5" />
                            </button>

                            <button
                                onClick={() => handleViewChange('kanban')}
                                className={`p-1.5 rounded-md transition-all ${activeView === 'kanban' ? 'bg-white shadow-sm text-[#4290E9]' : 'text-gray-500 hover:bg-gray-200'}`}
                                title="Kanban View"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="w-full p-4 md:p-8">
                    {activeView === 'listings' && (
                        <div className="w-full bg-white rounded-lg shadow-sm border overflow-hidden">
                            <DataTable
                                data={filteredTours}
                                columns={columns}
                                loading={loading}
                                error={error}
                                userType={userType}
                                headerBgOverride="#F5F5F5"
                                dataName="Properties"
                            />
                        </div>
                    )}

                    {activeView === 'kanban' && (
                        <>
                            {loading ? (
                                <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                    {[...Array(8)].map((_, index) => (
                                        <div
                                            key={index}
                                            className="bg-white rounded-lg shadow-sm p-4 animate-pulse h-[230px] border"
                                        >
                                            <div className="h-[130px] bg-gray-100 rounded-md mb-4"></div>
                                            <div className="h-4 bg-gray-100 rounded w-3/4 mb-2"></div>
                                            <div className="h-4 bg-gray-100 rounded w-1/2 mb-2"></div>
                                        </div>
                                    ))}
                                </div>
                            ) : error ? (
                                <div className="w-full flex justify-center items-center p-20 bg-white rounded-lg border">
                                    <p className="text-red-500 text-lg">Failed to load properties. Please try again.</p>
                                </div>
                            ) : filteredTours.length === 0 ? (
                                <div className="w-full flex justify-center items-center p-20 bg-white rounded-lg border">
                                    <p className="text-gray-500 text-lg font-medium">No properties found.</p>
                                </div>
                            ) : (
                                <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                    {filteredTours.map((tour) => (
                                        <KanbanViewCard
                                            key={tour.uuid}
                                            data={tour}
                                            type="tour"
                                        />
                                    ))}
                                </div>
                            )}
                        </>
                    )}

                </div>
            </div>
        </div>
    );
};

export default Page;
