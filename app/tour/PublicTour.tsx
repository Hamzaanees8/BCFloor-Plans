"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    CircleArrowLeft,
    CircleArrowRight,
    Mail,
    Phone,
} from "lucide-react";
import {
    BathIcon,
    BedIcon,
    HelpIcon,
    HomeIcon,
    LotIcon,
    PriceTag,
    TypoeIcon,
} from "@/components/Icons";
import DynamicMap from "@/components/DYnamicMap";
import { fetchPublicTourData, OrderData } from "./tour";
import CustomSlideshow from "../dashboard/file-manager/components/CustomPreview";
import PublicTourFloorPlans from "./components/PublicTourFloorPlans";

export interface Snapshoots {
    x_axis: number;
    y_axis: number;
    file_name: string;
    file_path?: string;
    floorImageUrl: string;
    name?: string;
    description?: string;
    isApi?: boolean;
}
const PublicTour = () => {
    const params = useParams();
    const orderuuid = params.orderuuid as string;
    const [orderData, setOrderData] = useState<OrderData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [activeTab, setActiveTab] = useState("Home");
    const [mainVideo, setMainVideo] = useState<string | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | undefined>();

    const API_URL = process.env.NEXT_PUBLIC_FILES_API_URL;

    console.log('orderData', orderData);

    useEffect(() => {
        const fetchOrderData = async () => {
            try {
                const data = await fetchPublicTourData(orderuuid);
                setOrderData(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An error occurred');
            } finally {
                setLoading(false);
            }
        };

        if (orderuuid) {
            fetchOrderData();
        }
    }, [orderuuid]);

    // Extract files from orderData.tours[0].files
    const tourPhotos = orderData?.tours?.[0]?.files?.filter(file =>
        file.service.category.name === "photo" || file.service.category.name === "HDR Photos" || file.service.category.name === "Standard Photos" || file.service.category.name === "Twilight Photos"
    ) || [];

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const videoFiles = orderData?.tours?.[0]?.files?.filter(file => file.service.category.name === "video") || [];
    const floorPlanFiles = orderData?.tours?.[0]?.files?.filter(file => file.service.category.name === "Floor Plan") || [];;

    useEffect(() => {
        if (!mainVideo && videoFiles.length > 0) {
            setMainVideo(`${API_URL}/${videoFiles[0].file_path}`);
        }
    }, [videoFiles, mainVideo, API_URL]);


    const handlePrev = () => {
        setCurrentImageIndex((prev) =>
            prev === 0 ? tourPhotos.length - 1 : prev - 1
        );
    };

    const handleNext = () => {
        setCurrentImageIndex((prev) =>
            prev === tourPhotos.length - 1 ? 0 : prev + 1
        );
    };




    useEffect(() => {
        if (!mainVideo && videoFiles.length > 0) {
            setMainVideo(`${API_URL}/${videoFiles[0].file_path}`);
        }
    }, [videoFiles, mainVideo, API_URL]);

    const audioFileName = orderData?.tours?.[0]?.slide_show?.background_audio;
    useEffect(() => {
        const fetchAudio = async () => {
            if (!audioFileName || audioFileName === "none") {
                setAudioUrl(undefined);
                return;
            }

            try {
                // Fetch the audio file from your API endpoint
                const response = await fetch(`/audio/${audioFileName}.mp3`);

                if (!response.ok) {
                    throw new Error(`Failed to fetch audio: ${response.status}`);
                }

                const blob = await response.blob();
                const blobUrl = URL.createObjectURL(blob);
                setAudioUrl(blobUrl);
            } catch (error) {
                console.error("Error loading audio track:", error);
                setAudioUrl(undefined);
            }
        };

        fetchAudio();

        return () => {
            if (audioUrl) {
                URL.revokeObjectURL(audioUrl);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [audioFileName]);


    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-lg">Loading...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-red-500 text-lg">Error: {error}</div>
            </div>
        );
    }


    return (
        <div className="w-full font-alexandria">
            <div className="w-full flex flex-col gap-6 px-0 pb-6 relative ">
                <div className="flex justify-center space-x-4 py-2 absolute top-3 z-50 w-full">
                    <p className="w-full px-6 text-[#fff] text-[24px] 
                         [text-shadow:_2px_2px_4px_rgba(0,0,0,0.5)]">
                        {orderData?.property_address}{orderData?.property_location}
                    </p>
                </div>

                <div className="flex justify-center space-x-4 py-2 absolute top-16 z-50 place-self-center">
                    {["Home", "Photos", "Videos", "Floorplan", "Matterport"].map(
                        (tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`text-[13px] w-[179px] font-bold  px-4 py-2 rounded-md uppercase ${activeTab === tab
                                    ? "bg-[#4290E9] text-white"
                                    : "bg-gray-200 text-[#666666]"
                                    }`}
                            >
                                {tab}
                            </button>
                        )
                    )}
                </div>

                {activeTab === "Home" && (
                    <div >
                        {tourPhotos.length > 0 && (
                            <div className="relative w-full h-[100vh]  overflow-hidden">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={`${API_URL}/${tourPhotos[currentImageIndex].file_path}`}
                                    alt={`Slide ${currentImageIndex + 1}`}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute bottom-4 right-4 flex space-x-2">
                                    <button
                                        onClick={handlePrev}
                                        className="  shadow flex items-center justify-center"
                                    >
                                        <CircleArrowLeft className="w-10 h-10 text-white" />
                                    </button>
                                    <button
                                        onClick={handleNext}
                                        className=" shadow flex items-center justify-center"
                                    >
                                        <CircleArrowRight className="w-10 h-10 text-white" />
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="px-6 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-4 py-12 mt-10 text-center text-sm">
                            {[
                                {
                                    label: "PRICE",
                                    value: `$${orderData?.property?.listing_price}`,
                                    icon: <PriceTag />,
                                },
                                {
                                    label: "BEDS",
                                    value: `${orderData?.property?.bedrooms}`,
                                    icon: <BedIcon />,
                                },
                                {
                                    label: "BATHS",
                                    value: `${orderData?.property?.bathrooms}`,
                                    icon: <BathIcon />,
                                },
                                {
                                    label: "SQUARE FOOTAGE",
                                    value: `${orderData?.property?.square_footage}FT²`,
                                    icon: <HomeIcon />,
                                },
                                {
                                    label: "LOT SIZE",
                                    value: `${orderData?.property?.lot_size}FT²`,
                                    icon: <LotIcon />,
                                },
                                {
                                    label: "YEAR BUILT",
                                    value: `${orderData?.property?.year_constructed}`,
                                    icon: <HelpIcon />,
                                },
                                {
                                    label: "TYPE",
                                    value: `${orderData?.property?.property_type}`,
                                    icon: <TypoeIcon />,
                                },
                            ].map((item, index) => (
                                <div
                                    key={index}
                                    className="flex flex-col items-center gap-3"
                                >
                                    {item.icon}
                                    <div className="text-[14px] text-[#424242] font-alexandria font-semibold uppercase">
                                        {item.label}
                                    </div>
                                    <div className="text-[14px] text-[#424242] font-alexandria font-normal uppercase">
                                        {item.value}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-10 px-6">
                            <div className="flex flex-col gap-5 items-center w-[350px]">
                                <div className="bg-[#ccc]">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={
                                            orderData?.agent?.avatar_url || "/default-avatar.png"
                                        }
                                        alt="Agent"
                                        className="w-full object-cover mb-2"
                                    />
                                </div>
                                <div className="text-left w-full flex flex-col gap-[12px]">
                                    <div className="text-[#424242] text-[16px] font-alexandria font-semibold">
                                        Contact
                                    </div>
                                    <div className="text-[#424242] text-[20px] font-alexandria font-light">
                                        {orderData?.agent?.first_name}{" "}
                                        {orderData?.agent?.last_name}
                                    </div>
                                    <div className="text-[#424242] text-[20px] font-alexandria font-light">
                                        {orderData?.agent?.company_name || "Company Name"}
                                    </div>
                                    {orderData?.agent?.primary_phone && (
                                        <a
                                            href={`tel:${orderData.agent.primary_phone}`}
                                            className="text-[#4290E9] text-[20px] font-alexandria font-light"
                                        >
                                            {orderData.agent.primary_phone}
                                        </a>
                                    )}
                                    {orderData?.agent?.website && (
                                        <a
                                            href={orderData.agent.website}
                                            className="text-[#4290E9] text-[20px] font-alexandria font-light"
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            {orderData.agent.website}
                                        </a>
                                    )}
                                    <div className="flex gap-3">
                                        {orderData?.agent?.primary_phone && (
                                            <a
                                                href={`tel:${orderData.agent.primary_phone}`}
                                                className=""
                                            >
                                                <Phone className="text-[#7D7D7D]" />
                                            </a>
                                        )}
                                        {orderData?.agent?.email && (
                                            <a
                                                href={`mailto:${orderData.agent.email}`}
                                                className=" "
                                            >
                                                <Mail className="text-[#7D7D7D]" />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-1 flex-col justify-between gap-7 h-fit">
                                <div className="flex flex-col gap-4">
                                    <h2 className="text-md font-semibold text-[#424242] font-alexandria">
                                        ABOUT THE PROPERTY
                                    </h2>
                                    <p className="text-sm text-gray-600">
                                        {orderData?.property?.description}
                                    </p>
                                    <Button className="w-max bg-[#4290E9]">
                                        View Feature Sheet
                                    </Button>
                                </div>

                                <div className="w-[800px] h-[300px]">
                                    <DynamicMap
                                        address={orderData?.property?.address}
                                        city={orderData?.property?.city}
                                        province={orderData?.property?.province}
                                        country={orderData?.property?.country}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {activeTab === "Photos" && (
                    <div className="">
                        {tourPhotos.length > 0 ? (
                            <> <CustomSlideshow
                                delay={Number(orderData?.tours?.[0]?.slide_show?.slide_delay) || 3000}
                                transition={orderData?.tours?.[0]?.slide_show?.transitions || 'fade'}
                                audioUrl={audioUrl || ''}
                                api_images={tourPhotos}
                            />


                                <div className="grid grid-cols-6 gap-2 mt-4 px-6">
                                    {tourPhotos.map((image, index) => (
                                        <div key={`photo-${index}`} className="w-full aspect-square overflow-hidden cursor-pointer">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={`${API_URL}/${image.file_path}`}
                                                alt={`Photo ${index + 1}`}
                                                className="w-full h-full object-cover"
                                                onClick={() => setCurrentImageIndex(index)}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className="font-alexandria w-full h-[50vh] text-gray-500 flex justify-center items-center">
                                <p>No photos found.</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "Videos" && (
                    <div className="w-full ">
                        <div className="p-4 pt-0">
                            {/* Main video preview */}
                            {mainVideo &&
                                <div className="mb-6 h-[95vh] w-full bg-black overflow-hidden">
                                    <video
                                        src={mainVideo || undefined}
                                        className="w-full h-full object-contain"
                                        controls
                                    />
                                </div>
                            }

                            {/* API videos */}
                            {videoFiles.length > 0 ? (
                                <div className="mt-4 w-full grid grid-cols-3 gap-5 p-3">
                                    {videoFiles.map((file, idx) => {
                                        const apiSrc = `${API_URL}/${file.file_path}`;
                                        return (
                                            <div
                                                key={idx}
                                                onClick={() => setMainVideo(apiSrc)}
                                                className="h-auto relative cursor-pointer"
                                            >
                                                <div className="relative w-full h-[240px]">
                                                    <video
                                                        src={apiSrc}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) :
                                <div className="font-alexandria w-full h-[50vh] text-gray-500 flex justify-center items-center">
                                    <p>No Video Available.</p>
                                </div>}

                        </div>
                    </div>
                )}

                {activeTab === "Floorplan" && (
                    <div className="w-full">
                        <PublicTourFloorPlans
                            floorPlanFiles={floorPlanFiles}
                            snapshots={orderData?.tours?.[0]?.snapshots}
                        />
                    </div>
                )
                }
                {activeTab === "Matterport" && (
                    <div className="w-full flex flex-col items-center gap-10">
                        <div className="font-alexandria w-full h-[50vh] text-gray-500 flex justify-center items-center">
                            <p>No Matterport Available.</p>
                        </div>
                    </div>
                )}

            </div>

        </div>
    );
};

export default PublicTour;
