"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import { useParams } from "next/navigation";
import { fetchPublicTourData, OrderData, recordTourStat } from "./tour";
import TourConfirm from "../dashboard/file-manager/components/TourConfirm";

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
    const [currentImageIndex] = useState(0);
    const [activeTab, setActiveTab] = useState("Home");
    const [mainVideo, setMainVideo] = useState<string | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | undefined>();
    const [isAudioPlaying, setIsAudioPlaying] = useState(true);
    const [isAudioMuted, setIsAudioMuted] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
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
    // Legacy logic for public audio tracks
    useEffect(() => {
        let active = true;
        let createdUrl: string | undefined;

        const fetchAudio = async () => {
            if (!audioFileName || audioFileName === "none") {
                if (active) setAudioUrl(undefined);
                return;
            }

            if (audioFileName.startsWith("http")) {
                if (active) setAudioUrl(audioFileName);
                return;
            }

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

    // Handle audio side-effects and autoplay unlocking
    useEffect(() => {
        const audioEl = audioRef.current;
        if (!audioEl || !audioUrl) return;

        const handleUnlock = () => {
            if (!audioEl) return;
            if (audioEl.paused && isAudioPlaying) {
                audioEl.play().catch(() => { });
            }
            window.removeEventListener('click', handleUnlock);
            window.removeEventListener('touchstart', handleUnlock);
            window.removeEventListener('keydown', handleUnlock);
        };

        window.addEventListener('click', handleUnlock);
        window.addEventListener('touchstart', handleUnlock);
        window.addEventListener('keydown', handleUnlock);

        if (isAudioPlaying) {
            audioEl.play().catch(() => {
                console.log("Autoplay blocked, waiting for interaction");
            });
        } else {
            audioEl.pause();
        }

        return () => {
            window.removeEventListener('click', handleUnlock);
            window.removeEventListener('touchstart', handleUnlock);
            window.removeEventListener('keydown', handleUnlock);
        };
    }, [audioUrl, isAudioPlaying]);

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
        <div className="w-full font-alexandria relative">
            {/* <div className="flex justify-center space-x-4 py-2 absolute top-3 z-50 w-full pointer-events-none">
                <p className="w-full px-6 text-[#fff] text-[24px] [text-shadow:_2px_2px_4px_rgba(0,0,0,0.5)] pointer-events-auto">
                    {orderData?.property_address} {orderData?.property_location}
                </p>
            </div> */}

            <TourConfirm
                orderData={orderData as any}
                isPublicView={true}
                hideAccordion={true}
                publicAudioUrl={audioUrl}
                onMediaView={trackMediaView}
                publicTourPhotos={tourPhotos as any}
                publicVideoFiles={videoFiles as any}
                publicFloorPlanFiles={floorPlanFiles as any}
                publicMatterportLinks={matterportLinks as any}
                isAudioPlaying={isAudioPlaying}
                isAudioMuted={isAudioMuted}
                setIsAudioPlaying={setIsAudioPlaying}
                setIsAudioMuted={setIsAudioMuted}
            />

            {audioUrl && (
                <audio
                    ref={audioRef}
                    key={audioUrl}
                    src={audioUrl}
                    loop
                    muted={isAudioMuted}
                />
            )}
        </div>
    );
};

export default PublicTour;
