"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
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
import { fetchPublicTourData, OrderData, recordTourStat } from "./tour";
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
    variant_urls?: {
        thumb?: string;
        popup?: string;
        slider?: string;
        landing?: string;
    };
}

const getVisitorId = () => {
    if (typeof window === 'undefined') return '';
    let storedId = localStorage.getItem('tour_visitor_id');
    if (!storedId) {
        storedId = crypto.randomUUID();
        localStorage.setItem('tour_visitor_id', storedId);
    }
    return storedId;
};

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
    const [visitorId, setVisitorId] = useState<string>('');
    const viewedMediaRef = useRef<Set<string>>(new Set());

    const API_URL = process.env.NEXT_PUBLIC_FILES_API_URL;

    useEffect(() => {
        setVisitorId(getVisitorId());
    }, []);

    useEffect(() => {
        const fetchOrderData = async () => {
            try {
                const data = await fetchPublicTourData(orderuuid);
                setOrderData(data);

                // Track Page View
                if (data && data.tours && data.tours.length > 0) {
                    const vId = getVisitorId();
                    recordTourStat(data.tours[0].uuid, {
                        type: 'view',
                        visitor_id: vId,
                        referrer: document.referrer
                    });
                }
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
    const tourPhotos = useMemo(() => orderData?.tours?.[0]?.files?.filter(file => {
        const isPhoto = file.type === "photo" &&
            file.service.name !== '2D Floor Plans' &&
            file.service.name !== '3D Floor Plans' &&
            file.service.category.name !== '2D Floor Plans' &&
            file.service.category.name !== '3D Floor Plans' &&
            file.is_show !== false;
        return isPhoto;
    }) || [], [orderData]);

    const videoFiles = useMemo(() => orderData?.tours?.[0]?.files?.filter(file => {
        const isVideo = file.service.category.name === "video" && file.is_show !== false;
        if (!isVideo) return false;

        // Date check
        const createdDate = new Date(file.created_at);
        const cutoffDate = new Date('2026-02-11');
        if (createdDate < cutoffDate) return false;

        return true;
    }) || [], [orderData]);

    const floorPlanFiles = useMemo(() => orderData?.tours?.[0]?.files?.filter(file => {
        const isFloorPlan = file.service.category.name === "Floor Plan" && file.is_show !== false;
        if (!isFloorPlan) return false;

        // Date check
        const createdDate = new Date(file.created_at);
        const cutoffDate = new Date('2026-02-11');
        if (createdDate < cutoffDate) return false;

        return true;
    }) || [], [orderData]);
    const matterportLinks = useMemo(() => orderData?.tours?.[0]?.links || [], [orderData]);

    const visibleTabs = useMemo(() => {
        const tabs = ["Home"];
        if (tourPhotos.length > 0) tabs.push("Photos");
        if (videoFiles.length > 0) tabs.push("Videos");
        if (floorPlanFiles.length > 0) tabs.push("Floorplan");
        if (matterportLinks.length > 0) tabs.push("Matterport");
        return tabs;
    }, [tourPhotos, videoFiles, floorPlanFiles, matterportLinks]);

    useEffect(() => {
        if (!visibleTabs.includes(activeTab)) {
            setActiveTab("Home");
        }
    }, [visibleTabs, activeTab]);

    useEffect(() => {
        if (!mainVideo && videoFiles.length > 0) {
            // Use file.url if available (post-cutoff), else fallback to API_URL construction
            const videoUrl = videoFiles[0].url || `${API_URL}/${videoFiles[0].file_path}`;
            setMainVideo(videoUrl);
        }
    }, [videoFiles, mainVideo, API_URL]);




    // Track audio
    const audioFileName = orderData?.tours?.[0]?.slide_show?.background_audio;
    useEffect(() => {
        let active = true;
        let createdUrl: string | undefined;

        const fetchAudio = async () => {
            if (!audioFileName || audioFileName === "none") {
                if (active) setAudioUrl(undefined);
                return;
            }

            // Check if the background_audio is a full URL (agent-scoped audio)
            if (audioFileName.startsWith("http")) {
                if (active) setAudioUrl(audioFileName);
                return;
            }

            // Legacy logic for public audio tracks
            try {
                const response = await fetch(`/audio/${audioFileName}.mp3`);
                if (!response.ok) {
                    throw new Error(`Failed to fetch audio: ${response.status}`);
                }
                const blob = await response.blob();
                if (!active) return;

                createdUrl = URL.createObjectURL(blob);
                setAudioUrl(createdUrl);
            } catch (error) {
                console.error("Error loading audio track:", error);
                if (active) setAudioUrl(undefined);
            }
        };

        fetchAudio();

        return () => {
            active = false;
            if (createdUrl) {
                URL.revokeObjectURL(createdUrl);
            }
        };
    }, [audioFileName]);

    const trackMediaView = (mediaUuid?: string) => {
        if (!mediaUuid || !orderData?.tours?.[0]?.uuid || !visitorId) return;

        // Only track if this media hasn't been viewed in this session
        if (viewedMediaRef.current.has(mediaUuid)) return;

        viewedMediaRef.current.add(mediaUuid);
        recordTourStat(orderData.tours[0].uuid, {
            type: 'media_view',
            visitor_id: visitorId,
            media_uuid: mediaUuid
        });
    };

    // Track Home Tab Slider (manual)
    useEffect(() => {
        if (activeTab === 'Home' && tourPhotos[currentImageIndex]) {
            trackMediaView(tourPhotos[currentImageIndex].uuid);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentImageIndex, activeTab]);

    // Track Video View
    useEffect(() => {
        if (activeTab === 'Videos' && mainVideo && videoFiles.length > 0) {
            // Find video UUID based on URL
            const normalizeUrl = (url: string) => url.split('?')[0]; // Simple normalization
            const matchedVideo = videoFiles.find(v =>
                normalizeUrl(`${API_URL}/${v.file_path}`) === normalizeUrl(mainVideo)
            );

            if (matchedVideo) {
                trackMediaView(matchedVideo.uuid);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mainVideo, activeTab]);


    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-white">
                <div className="text-lg font-alexandria">Loading...</div>
            </div>
        );
    }

    const isPublished = orderData?.tours?.[0]?.is_publish ?? false;

    if (error || !isPublished) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-white">
                <div className="text-[#444] text-2xl font-alexandria font-medium text-center border p-10 rounded-lg shadow-sm">
                    This tour is not published yet.
                </div>
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
                    {visibleTabs.map(
                        (tab: string) => (
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
                            <div className="relative w-full h-[100vh] overflow-hidden group">
                                <CustomSlideshow
                                    delay={Number(orderData?.tours?.[0]?.slide_show?.slide_delay) || 3000}
                                    transition={orderData?.tours?.[0]?.slide_show?.transitions || 'kenburns'}
                                    audioUrl={audioUrl || ''}
                                    api_images={tourPhotos}
                                    currentIndex={currentImageIndex}
                                    onSlideChange={(index) => {
                                        setCurrentImageIndex(index);
                                        if (tourPhotos[index]) {
                                            trackMediaView(tourPhotos[index].uuid);
                                        }
                                    }}
                                />
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
                                currentIndex={currentImageIndex}
                                onSlideChange={(index) => {
                                    if (tourPhotos[index]) {
                                        trackMediaView(tourPhotos[index].uuid);
                                    }
                                }}
                            />


                                <div className="grid grid-cols-6 gap-2 mt-4 px-6">
                                    {tourPhotos.map((image, index) => (
                                        <div key={`photo-${index}`} className="w-full aspect-square overflow-hidden cursor-pointer">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={image.variant_urls?.thumb || image.thumbnail_url || image.url || `${API_URL}/${image.file_path}`}
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
                                        controlsList="nodownload"
                                    />
                                </div>
                            }

                            {/* API videos */}
                            {videoFiles.length > 0 ? (
                                <div className="mt-4 w-full grid grid-cols-3 gap-5 p-3">
                                    {videoFiles.map((file, idx) => {
                                        const apiSrc = file.url || `${API_URL}/${file.file_path}`;
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
                                                        controlsList="nodownload"
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
                            tourPhotos={tourPhotos as any}
                        />
                    </div>
                )
                }
                {activeTab === "Matterport" && (
                    <div className="w-full flex flex-col items-center gap-10 px-6">
                        {matterportLinks.map((link, idx) => (
                            <div key={idx} className="w-full max-w-[1200px] h-[70vh] bg-black rounded-lg overflow-hidden shadow-lg">
                                <iframe
                                    src={link.link}
                                    className="w-full h-full border-0"
                                    allowFullScreen
                                    allow="xr-spatial-tracking"
                                />
                            </div>
                        ))}
                    </div>
                )}

            </div>

        </div>
    );
};

export default PublicTour;
