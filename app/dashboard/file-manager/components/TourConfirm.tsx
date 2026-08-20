"use client";

import React, { useEffect, useState } from "react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Mail,
  Phone,
  Video,
  FileText,
  Box,
  ImageIcon,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Maximize,
  X,
  Volume2,
  VolumeX,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Compass,
} from "lucide-react";
import ThreeSixtyViewer from "./ThreeSixtyViewer";
import { useOptionalFileManagerContext } from "../FileManagerContext";
import PublicTourFloorPlans from "@/app/tour/components/PublicTourFloorPlans";
import {
  BathIcon,
  BedIcon,
  HelpIcon,
  HomeIcon,
  LotIcon,
  PriceTag,
  TypoeIcon,
  UploadRightIcon,
} from "@/components/Icons";
import { Order } from "../../orders/page";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import DynamicMap from "@/components/DYnamicMap";
import CustomSlideshow from "./CustomPreview";
import TourFloorPlans from "./TourFloorPlans";
import TourActivityDialog from "./TourActivityDialog";

interface TourConfimation {
  orderData: Order | null;
  isPublicView?: boolean;
  hideAccordion?: boolean;
  publicAudioUrl?: string;
  onMediaView?: (uuid: string) => void;
  publicTourPhotos?: any[];
  publicVideoFiles?: any[];
  publicFloorPlanFiles?: any[];
  publicMatterportLinks?: any[];
  isAudioPlaying?: boolean;
  isAudioMuted?: boolean;
  setIsAudioPlaying?: (val: boolean) => void;
  setIsAudioMuted?: (val: boolean) => void;
  watermarkLogo?: string;
  publicTourType?: string | null;
}

import { useOptionalAppContext } from "@/app/context/AppContext";
import { useOptionalWhiteLabel } from "@/app/context/Whitelabel";
import { PublishTour, featureSheetService } from "../file-manager";
import {
  FeatureSheetResponse,
  templateImages,
} from "../types/featureSheetTypes";
import { toast } from "sonner";
import { getGlobalPhotoOrder } from "../utils/sortOrderUtils";
import { Loader2 } from "lucide-react";
import { useOptionalOrganization } from "@/app/context/OrganizationContext";

const DEFAULT_ROLE_SETTINGS = {
  pageTabColor: "#4290E9",
  activeColor: "#4290E9",
};

const TourConfirm = ({
  orderData,
  isPublicView,
  hideAccordion,
  publicAudioUrl,
  onMediaView,
  publicTourPhotos,
  publicVideoFiles,
  publicFloorPlanFiles,
  publicMatterportLinks,
  isAudioMuted,
  setIsAudioPlaying,
  setIsAudioMuted,
  watermarkLogo,
  publicTourType,
}: TourConfimation) => {
  const appContext = useOptionalAppContext();
  const userType = appContext?.userType;

  const whiteLabelContext = useOptionalWhiteLabel();
  const appliedSettings = whiteLabelContext?.appliedSettings;
  const orgContext = useOptionalOrganization();
  const organization = orgContext?.organization;

  const role = (userType as string)?.toLowerCase() || "admin";
  const roleSettings = React.useMemo(() => {
    return (
      appliedSettings?.[role as keyof typeof appliedSettings] ||
      appliedSettings?.["admin"] ||
      DEFAULT_ROLE_SETTINGS
    );
  }, [appliedSettings, role]);

  const activeTabColor = React.useMemo(() => {
    // 1. Check organization branding primary color
    if (organization?.branding?.primary_color) {
      const pColor = organization.branding.primary_color;
      const colorVal = typeof pColor === "object" ? pColor.value : pColor;
      if (colorVal) return colorVal;
    }
    // 2. Check white label roleSettings or pageTabColor / activeColor
    if (roleSettings?.pageTabColor) {
      return roleSettings.pageTabColor;
    }
    if (roleSettings?.activeColor) {
      return roleSettings.activeColor;
    }
    // 3. Fallback to default tab background color (#4290E9)
    return "#4290E9";
  }, [organization, roleSettings]);

  const fileManagerContext = useOptionalFileManagerContext();
  const selectedFiles = fileManagerContext?.selectedFiles || [];
  const rawDelay =
    fileManagerContext?.delay ||
    Number(orderData?.tours?.[0]?.slide_show?.slide_delay) ||
    4000;
  const delay = rawDelay < 50 ? rawDelay * 1000 : rawDelay;
  const transition =
    fileManagerContext?.transition ||
    orderData?.tours?.[0]?.slide_show?.transitions ||
    "fade-in";
  const audioUrl = isPublicView ? publicAudioUrl : fileManagerContext?.audioUrl;
  const links = fileManagerContext?.links || [];
  const filesData = fileManagerContext?.filesData || null;
  const selectedVideoFiles = React.useMemo(
    () => fileManagerContext?.selectedVideoFiles || [],
    [fileManagerContext?.selectedVideoFiles],
  );

  const uploadedImages = selectedFiles?.filter((f) => f.upload) || [];
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState("Home");
  const [mainVideo, setMainVideo] = useState<string | null>(null);
  // const [confirmFloor, setConfirmFloor] = useState(false);
  const [open, setOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [isSideContactOpen, setIsSideContactOpen] = useState(true);
  const [hasUserClosedSideContact, setHasUserClosedSideContact] = useState(false);
  const [isHomeSlideshowPlaying, setIsHomeSlideshowPlaying] = useState(true);
  const [photoGridSize, setPhotoGridSize] = useState<
    "small" | "medium" | "large"
  >("medium");
  const [isFullscreenSlideshowOpen, setIsFullscreenSlideshowOpen] =
    useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [lightboxZoom, setLightboxZoom] = useState<number>(1);
  const [lightboxPan, setLightboxPan] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [isLightboxDragging, setIsLightboxDragging] = useState<boolean>(false);
  const [lightboxDragStart, setLightboxDragStart] = useState<{
    x: number;
    y: number;
  }>({ x: 0, y: 0 });

  const heroVideoRef = React.useRef<HTMLVideoElement | null>(null);
  const [isHeroVideoPlaying, setIsHeroVideoPlaying] = useState(true);
  const [localHeroMuted, setLocalHeroMuted] = useState(true);

  const effectiveHeroMuted = isPublicView
    ? (isAudioMuted ?? true)
    : localHeroMuted;

  const toggleHeroVideoPlay = React.useCallback(() => {
    if (!heroVideoRef.current) return;
    if (heroVideoRef.current.paused) {
      heroVideoRef.current
        .play()
        .then(() => setIsHeroVideoPlaying(true))
        .catch(() => {});
    } else {
      heroVideoRef.current.pause();
      setIsHeroVideoPlaying(false);
    }
  }, []);

  const toggleHeroVideoMute = React.useCallback(() => {
    if (isPublicView && setIsAudioMuted) {
      setIsAudioMuted(!isAudioMuted);
    } else {
      setLocalHeroMuted((prev) => !prev);
      if (heroVideoRef.current) {
        heroVideoRef.current.muted = !heroVideoRef.current.muted;
      }
    }
  }, [isPublicView, isAudioMuted, setIsAudioMuted]);

  const resetLightboxZoom = React.useCallback(() => {
    setLightboxZoom(1);
    setLightboxPan({ x: 0, y: 0 });
  }, []);

  const handleLightboxZoomIn = React.useCallback(() => {
    setLightboxZoom((prev) => Math.min(prev + 0.5, 3));
  }, []);

  const handleLightboxZoomOut = React.useCallback(() => {
    setLightboxZoom((prev) => {
      const next = Math.max(prev - 0.5, 1);
      if (next === 1) setLightboxPan({ x: 0, y: 0 });
      return next;
    });
  }, []);

  const isMediaApprovedByAgent = React.useCallback((file: any) => {
    return (
      file?.is_agent_approved === true ||
      file?.is_agent_approved === 1 ||
      file?.is_agent_approved === "1" ||
      file?.is_agent_approved === "true" ||
      file?.is_complimentary === true ||
      file?.is_complimentary === 1 ||
      file?.is_complimentary === "1" ||
      file?.is_complimentary === "true"
    );
  }, []);

  const currentTourPhotos = React.useMemo(() => {
    let photos = isPublicView
      ? publicTourPhotos
      : filesData?.files?.filter(
          (file) =>
            file?.service?.name !== "2D Floor Plans" &&
            file?.service?.name !== "3D Floor Plans" &&
            file.type === "photo",
        );

    if (photos) {
      photos = getGlobalPhotoOrder(photos as any);
      photos = photos?.filter(isMediaApprovedByAgent);
    }
    return photos;
  }, [isPublicView, publicTourPhotos, filesData?.files, isMediaApprovedByAgent]);

  const handleHomeSlideshowPlayChange = React.useCallback(
    (playing: boolean) => {
      setIsHomeSlideshowPlaying(playing);
      if (isPublicView && setIsAudioPlaying) {
        setIsAudioPlaying(playing);
      }
    },
    [isPublicView, setIsAudioPlaying],
  );

  useEffect(() => {
    if (activeTab === "Home") {
      setCurrentImageIndex(0);
      setIsHomeSlideshowPlaying(true);
      if (setIsAudioPlaying) {
        setIsAudioPlaying(true);
      }
      if (hasUserClosedSideContact) {
        setIsSideContactOpen(false);
      } else {
        setIsSideContactOpen(true);
      }
      if (heroVideoRef.current && isHeroVideoPlaying) {
        heroVideoRef.current.play().catch(() => {});
      }
    } else {
      setIsHomeSlideshowPlaying(false);
      if (setIsAudioPlaying) {
        setIsAudioPlaying(false);
      }
      setIsSideContactOpen(false);
      if (heroVideoRef.current) {
        heroVideoRef.current.pause();
      }
    }
    if (activeTab !== "Photos") {
      setIsFullscreenSlideshowOpen(false);
      resetLightboxZoom();
    }
  }, [
    activeTab,
    setIsAudioPlaying,
    hasUserClosedSideContact,
    resetLightboxZoom,
    isHeroVideoPlaying,
  ]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isFullscreenSlideshowOpen) return;
      if (e.key === "Escape") {
        setIsFullscreenSlideshowOpen(false);
        resetLightboxZoom();
        setSelectedPhotoIndex(0);
      } else if (e.key === "ArrowRight") {
        const total =
          (uploadedImages?.length || 0) + (currentTourPhotos?.length || 0);
        if (total > 0) {
          resetLightboxZoom();
          setSelectedPhotoIndex((prev) => (prev + 1) % total);
        }
      } else if (e.key === "ArrowLeft") {
        const total =
          (uploadedImages?.length || 0) + (currentTourPhotos?.length || 0);
        if (total > 0) {
          resetLightboxZoom();
          setSelectedPhotoIndex((prev) => (prev === 0 ? total - 1 : prev - 1));
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isFullscreenSlideshowOpen,
    uploadedImages?.length,
    currentTourPhotos?.length,
    resetLightboxZoom,
  ]);

  const [featureSheets, setFeatureSheets] = useState<FeatureSheetResponse[]>(
    [],
  );
  const [isLoadingSheets, setIsLoadingSheets] = useState(false);

  const [previewTourType, setPreviewTourType] = useState<
    "branded" | "unbranded"
  >("branded");
  const activeTourType = isPublicView ? publicTourType : previewTourType;

  const getAgentLogo = () => {
    if (!orderData?.agent) return undefined;
    const API_URL =
      process.env.NEXT_PUBLIC_FILES_API_URL ||
      "https://bcf-media.s3.amazonaws.com";
    const agent: any = orderData.agent;
    const primaryLogo =
      agent.company_logos_urls?.find((l: any) => l.type === "primary_logo") ||
      agent.company_logos?.find((l: any) => l.type === "primary_logo");

    if (primaryLogo && (primaryLogo.url || primaryLogo.path)) {
      const logoPath = primaryLogo.url || primaryLogo.path;
      if (logoPath.startsWith("http")) {
        return logoPath;
      } else {
        return `${API_URL}/${logoPath}`;
      }
    }

    return agent.logo_url || agent.company_logo_url || agent.avatar_url;
  };

  const actualWatermarkLogo = isPublicView
    ? watermarkLogo
    : activeTourType === "branded"
      ? getAgentLogo()
      : undefined;

  useEffect(() => {
    if (filesData) {
      // @ts-expect-error: is_publish might not be in the type definition but is present in the API response
      setIsPublished(!!filesData.is_publish);
    }
  }, [filesData]);

  useEffect(() => {
    const fetchFeatureSheets = async () => {
      if (!orderData?.uuid) return;
      const token =
        localStorage.getItem("token") || localStorage.getItem("agentToken");
      if (!token) return;
      try {
        setIsLoadingSheets(true);
        const response = await featureSheetService.getFeatureSheetsByOrder(
          orderData.uuid,
        );
        const dataArray = Array.isArray(response)
          ? response
          : (response as unknown as { data: FeatureSheetResponse[] }).data ||
            [];
        setFeatureSheets(dataArray);
      } catch (error) {
        console.error("Error fetching feature sheets:", error);
      } finally {
        setIsLoadingSheets(false);
      }
    };
    fetchFeatureSheets();
  }, [orderData?.uuid]);

  const API_URL = process.env.NEXT_PUBLIC_FILES_API_URL;

  const currentVideoFiles = React.useMemo(() => {
    let files = isPublicView
      ? publicVideoFiles
      : filesData?.files?.filter((file) => file.type === "video");

    if (!isPublicView) {
      files = files?.filter(isMediaApprovedByAgent);
    }
    return files;
  }, [isPublicView, publicVideoFiles, filesData?.files, isMediaApprovedByAgent]);

  const heroType =
    fileManagerContext?.heroType ||
    (orderData?.tours?.[0]?.slide_show as any)?.hero_type ||
    (filesData as any)?.slide_show?.hero_type ||
    "slideshow";

  const heroVideoUuid =
    fileManagerContext?.heroVideoUuid ||
    (orderData?.tours?.[0]?.slide_show as any)?.hero_video_uuid ||
    (filesData as any)?.slide_show?.hero_video_uuid;

  const activeHeroVideoUrl = React.useMemo(() => {
    if (selectedVideoFiles.length > 0) {
      return URL.createObjectURL(selectedVideoFiles[0].file);
    }
    if (currentVideoFiles && currentVideoFiles.length > 0) {
      const matched = heroVideoUuid
        ? currentVideoFiles.find((v: any) => v.uuid === heroVideoUuid || v.url === heroVideoUuid)
        : currentVideoFiles[0];
      const target = matched || currentVideoFiles[0];
      return target.url || `${API_URL}/${target.file_path}`;
    }
    return null;
  }, [selectedVideoFiles, currentVideoFiles, heroVideoUuid, API_URL]);
  const currentPath = window.location.href;

  function getMainURL(url: string) {
    try {
      const urlObj = new URL(url);
      return `${urlObj.protocol}//${urlObj.host}`;
    } catch (error) {
      console.error("Invalid URL:", error);
      return null;
    }
  }
  const mainUrl = getMainURL(currentPath);

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    if (!mainVideo) {
      if (selectedVideoFiles.length > 0) {
        setMainVideo(URL.createObjectURL(selectedVideoFiles[0].file));
      } else if (currentVideoFiles && currentVideoFiles.length > 0) {
        const videoUrl =
          currentVideoFiles[0].url ||
          `${API_URL}/${currentVideoFiles[0].file_path}`;
        setMainVideo(videoUrl);
      }
    }
  }, [selectedVideoFiles, currentVideoFiles, mainVideo, API_URL]);

  useEffect(() => {
    if (
      isPublicView &&
      activeTab === "Videos" &&
      mainVideo &&
      currentVideoFiles &&
      currentVideoFiles.length > 0
    ) {
      const normalizeUrl = (url: string) => url.split("?")[0];
      const matchedVideo = currentVideoFiles.find(
        (v: any) =>
          normalizeUrl(v.url || `${API_URL}/${v.file_path}`) ===
          normalizeUrl(mainVideo),
      );
      if (matchedVideo && onMediaView) {
        onMediaView(matchedVideo.uuid);
      }
    }
  }, [
    mainVideo,
    activeTab,
    isPublicView,
    currentVideoFiles,
    onMediaView,
    API_URL,
  ]);

  const hasPhotos = isPublicView
    ? publicTourPhotos && publicTourPhotos.length > 0
    : orderData?.services?.some((s) =>
        s.service?.name?.toLowerCase().includes("photo"),
      );
  const hasVideos = isPublicView
    ? publicVideoFiles && publicVideoFiles.length > 0
    : orderData?.services?.some(
        (s) =>
          s.service?.name?.toLowerCase().includes("video") ||
          s.service?.name?.toLowerCase().includes("reel"),
      );
  const hasFloorPlans = isPublicView
    ? publicFloorPlanFiles && publicFloorPlanFiles.length > 0
    : orderData?.services?.some((s) =>
        s.service?.name?.toLowerCase().includes("floor plan"),
      );

  const rawApiLinks = (filesData?.links || [])
    .filter((l) => !l.is_hidden && l.link)
    .map((l) => ({
      ...l,
      type: l.type as "branded" | "unbranded",
    }));

  const activeLinks = isPublicView
    ? publicMatterportLinks || []
    : links.length > 0
      ? links
      : rawApiLinks;

  const uniqueLinks: any[] = [];
  const seen = new Set();
  for (const l of activeLinks) {
    if (!l.link) continue;
    const key = `${l.type}-${l.link}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueLinks.push(l);
    }
  }

  const brandedLinks = uniqueLinks.filter((l) => l.type === "branded");
  const unbrandedLinks = uniqueLinks.filter((l) => l.type === "unbranded");

  const displayMatterportLinks =
    activeTourType === "branded" ? brandedLinks : unbrandedLinks;

  const hasMatterport = isPublicView
    ? displayMatterportLinks && displayMatterportLinks.length > 0
    : orderData?.services?.some(
        (s) =>
          s.service?.name?.toLowerCase().includes("matterport") ||
          s.service?.name?.toLowerCase().includes("3d tour"),
      ) && displayMatterportLinks.length > 0;

  const isPanoFile = React.useCallback((f: any) => {
    if (!f) return false;
    if (
      f.isPanorama === true ||
      f.is_panorama === true ||
      f.image_type === "panorama" ||
      f.image_type === "360" ||
      f.type === "panorama" ||
      f.type === "360"
    ) return true;
    const sName = (f.service?.name || "").toLowerCase();
    const catName = (f.service?.category?.name || "").toLowerCase();
    const fileName = (f.name || f.file_name || "").toLowerCase();
    if (
      sName.includes("360") ||
      sName.includes("panorama") ||
      sName.includes("pano") ||
      catName.includes("360") ||
      catName.includes("panorama") ||
      catName.includes("pano") ||
      fileName.includes("360") ||
      fileName.includes("pano")
    ) return true;
    return false;
  }, []);

  const panoramicFiles = React.useMemo(() => {
    const rawList = isPublicView
      ? (publicTourPhotos || orderData?.tours?.[0]?.files || (orderData as any)?.files || [])
      : (filesData?.files || currentTourPhotos || []);
    return (rawList || []).filter(isPanoFile);
  }, [isPublicView, publicTourPhotos, orderData, filesData?.files, currentTourPhotos, isPanoFile]);

  const hasPanoramas = panoramicFiles.length > 0;

  const regularPhotosList = React.useMemo(() => {
    const source = isPublicView ? (publicTourPhotos || []) : (currentTourPhotos || []);
    if (!source || source.length === 0) return [];
    if (!hasPanoramas) return source;
    return source.filter((f: any) => !isPanoFile(f));
  }, [isPublicView, publicTourPhotos, currentTourPhotos, hasPanoramas, isPanoFile]);

  const previewTabs = React.useMemo(() => {
    const tabs = ["Home", "Overview", "Contact"];
    if (hasPhotos) tabs.push("Photos");
    if (hasVideos) tabs.push("Videos");
    if (hasFloorPlans) tabs.push("Floorplan");
    if (hasPanoramas) tabs.push("360° Panos");
    if (hasMatterport) tabs.push("Matterport");
    return tabs;
  }, [hasPhotos, hasVideos, hasFloorPlans, hasPanoramas, hasMatterport]);

  useEffect(() => {
    if (!previewTabs.includes(activeTab)) {
      setActiveTab("Home");
    }
  }, [previewTabs, activeTab]);

  const tourUuid = filesData?.uuid;

  const handlePostTour = async () => {
    const token = localStorage.getItem("token");

    if (!tourUuid || !token) {
      toast.error("Missing tour UUID or authorization token.");
      return;
    }

    setIsPublishing(true);
    try {
      const nextStatus = !isPublished;

      // Prevent publishing if order is not paid (only for non-admin users)
      if (
        nextStatus &&
        userType !== "admin" &&
        orderData?.payment_status !== "PAID"
      ) {
        toast.error(
          "This order must be paid in full before the tour can be published.",
        );
        setIsPublishing(false);
        return;
      }

      await PublishTour(token, tourUuid, nextStatus);
      setIsPublished(nextStatus);
      toast.success(
        nextStatus
          ? "Tour published successfully!"
          : "Tour unpublished successfully!",
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "An error occurred while updating the tour status.",
      );
    } finally {
      setIsPublishing(false);
    }
  };

  const slugify = (text: string) => {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-") // Replace spaces with -
      .replace(/[^\w-]+/g, "") // Remove all non-word chars
      .replace(/--+/g, "-") // Replace multiple - with single -
      .replace(/^-+/, "") // Trim - from start of text
      .replace(/-+$/, ""); // Trim - from end of text
  };

  const getAgentDomainUrl = () => {
    if (userType === "admin") return mainUrl;
    if (organization && (organization as any).domains) {
      const agentDomain = (organization as any).domains.find(
        (d: any) => d.portal_type === "agent",
      );
      if (agentDomain) return `https://${agentDomain.domain}`;
    }
    return mainUrl;
  };

  const tourUrl = `${getAgentDomainUrl()}/tour/${slugify(orderData?.property_address || "")}-${slugify(orderData?.property_location || "")}/${orderData?.uuid}`;

  return (
    <div className="w-full font-alexandria">
      {/* Tour Link Input */}
      {tourUuid && !isPublicView && (
        <div className="flex items-center justify-center py-4 px-4 w-full">
          <div className="flex flex-col gap-4 w-full max-w-[550px]">
            {/* Branded Link */}
            <div className="flex flex-col gap-2">
              <div className="text-[14px] font-medium text-[#424242]">
                Branded Tour Link
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-stretch sm:items-center w-full">
                <Input
                  type="text"
                  value={`${tourUrl}?type=branded`}
                  className="flex-1 w-full border border-[#8E8E8E] text-[#666666]"
                  readOnly
                />
                <a
                  target="_blank"
                  href={`${tourUrl}?type=branded&preview=true`}
                  className="w-full sm:w-auto px-3 bg-[#6BAE41] h-[35px] text-[14px] rounded-[8px] flex items-center justify-center gap-2 text-white whitespace-nowrap"
                >
                  <span>View Tour</span> <UploadRightIcon size={18} />
                </a>
              </div>
            </div>

            {/* Unbranded Link */}
            <div className="flex flex-col gap-2">
              <div className="text-[14px] font-medium text-[#424242]">
                Unbranded Tour Link
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-stretch sm:items-center w-full">
                <Input
                  type="text"
                  value={`${tourUrl}?type=unbranded`}
                  className="flex-1 w-full border border-[#8E8E8E] text-[#666666]"
                  readOnly
                />
                <a
                  target="_blank"
                  href={`${tourUrl}?type=unbranded&preview=true`}
                  className="w-full sm:w-auto px-3 bg-[#6BAE41] h-[35px] text-[14px] rounded-[8px] flex items-center justify-center gap-2 text-white whitespace-nowrap"
                >
                  <span>View Tour</span> <UploadRightIcon size={18} />
                </a>
              </div>
            </div>

            <div className="relative inline-flex flex-wrap items-center gap-3 mt-2">
              {userType === "vendor" && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className="absolute inset-0 z-10 cursor-default"
                      onPointerDown={(e) => e.preventDefault()}
                      onClick={(e) => e.preventDefault()}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    You don&apos;t have permission to perform this action
                  </TooltipContent>
                </Tooltip>
              )}
              <div
                className={
                  userType === "vendor"
                    ? "pointer-events-none select-none flex flex-wrap gap-3"
                    : "flex flex-wrap gap-3"
                }
              >
                <Button
                  onClick={handlePostTour}
                  disabled={isPublishing}
                  className={`w-[185px] transition-all duration-300 ${isPublished ? `${userType}-bg hover:bg-blue-500` : "bg-[#6BAE41]"}`}
                >
                  {isPublishing
                    ? "Updating..."
                    : isPublished
                      ? "Unpublish Tour"
                      : "Publish Tour"}
                </Button>
                <Button
                  onClick={() => setOpen(true)}
                  className={`w-[100px] ${userType === "vendor" ? "vendor-bg" : `${userType}-bg`} hover:bg-blue-600`}
                >
                  Stats
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      <Accordion type="single" defaultValue="Preview" className="w-full">
        <AccordionItem
          value="Preview"
          className={hideAccordion ? "border-none" : ""}
        >
          {!hideAccordion && (
            <AccordionTrigger
              className="px-[14px] py-[19px] border-t border-b border-[#BBBBBB] h-[60px] bg-[#E4E4E4] text-[18px] font-semibold uppercase [&>svg]:text-current [&>svg]:w-6 [&>svg]:h-6 [&>svg]:stroke-2"
              style={{
                color: roleSettings.pageTabColor,
                backgroundColor: `var(--${role}-page-bg, #E4E4E4)`,
              }}
            >
              <div className="flex items-center gap-4">
                <span>Preview</span>
                <select
                  className="bg-white border border-[#BBBBBB] text-[#333] text-sm rounded-md px-2 py-1 outline-none font-normal"
                  value={previewTourType}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) =>
                    setPreviewTourType(
                      e.target.value as "branded" | "unbranded",
                    )
                  }
                >
                  <option value="branded">Branded Tour</option>
                  <option value="unbranded">Unbranded Tour</option>
                </select>
              </div>
            </AccordionTrigger>
          )}
          <AccordionContent
            className={`${hideAccordion ? "border-none" : ""} ${activeTab === "Home" ? "!pb-0 !pt-0" : ""}`}
          >
            <div
              className={`w-full flex flex-col ${activeTab === "Home" ? "gap-0 !pb-0 !mb-0 overflow-hidden" : "gap-6 pb-6"} px-0 relative ${hideAccordion ? "pt-0" : ""}`}
            >
              {/* Top Header: Address & Tabs */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-2.5 max-w-[95%] md:max-w-none w-full md:w-auto pointer-events-auto">
                {/* Top Center Address (rendered in both preview and public tour) */}
                <div className="flex flex-col items-center text-center bg-transparent px-2 py-1">
                  <span
                    className={`font-bold text-[20px] md:text-[28px] leading-tight tracking-wide ${
                      activeTab === "Home"
                        ? "text-white"
                        : "text-[#1b365d]"
                    }`}
                    style={
                      activeTab === "Home"
                        ? {
                            textShadow:
                              "0px 3px 10px rgba(0, 0, 0, 0.4), 0px 1px 4px rgba(0, 0, 0, 0.4)",
                          }
                        : undefined
                    }
                  >
                    {orderData?.property_address ||
                      orderData?.property?.address}
                  </span>
                  <span
                    className={`font-semibold text-xs md:text-[15px] leading-tight mt-1 ${
                      activeTab === "Home"
                        ? "text-white/95"
                        : "text-gray-600"
                    }`}
                    style={
                      activeTab === "Home"
                        ? {
                            textShadow:
                              "0px 2px 6px rgba(0, 0, 0, 0.35), 0px 1px 3px rgba(0, 0, 0, 0.35)",
                          }
                        : undefined
                    }
                  >
                    {orderData?.property_location ||
                      `${orderData?.property?.city || ""}, ${orderData?.property?.province || ""}`}
                  </span>
                </div>

                {/* Tabs directly under address */}
                <div className="flex overflow-x-auto whitespace-nowrap scrollbar-none max-w-full px-4 gap-2 py-1 justify-start md:justify-center w-full md:w-auto">
                  {previewTabs.map((tab) => {
                    const getTabIcon = (name: string) => {
                      switch (name) {
                        case "Home":
                          return (
                            <span
                              className={`inline-block w-3.5 h-3.5 mr-1.5 [&>svg]:w-full [&>svg]:h-full [&>svg_path]:stroke-current [&>svg_path]:stroke-[4]`}
                            >
                              <HomeIcon />
                            </span>
                          );
                        case "Overview":
                          return (
                            <svg
                              className="w-3.5 h-3.5 inline mr-1.5 fill-current"
                              viewBox="0 0 24 24"
                            >
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                            </svg>
                          );
                        case "Contact":
                          return <Mail size={14} className="inline mr-1.5" />;
                        case "Photos":
                          return (
                            <ImageIcon size={14} className="inline mr-1.5" />
                          );
                        case "Videos":
                          return <Video size={14} className="inline mr-1.5" />;
                        case "Floorplan":
                        case "Floor Plan":
                          return (
                            <FileText size={14} className="inline mr-1.5" />
                          );
                        case "360° Panos":
                        case "360° Tour":
                        case "Panos":
                          return <Compass size={14} className="inline mr-1.5" />;
                        case "Matterport":
                        case "3D Tour":
                          return <Box size={14} className="inline mr-1.5" />;
                        default:
                          return null;
                      }
                    };

                    return (
                      <button
                        key={tab}
                        onClick={() => {
                          if (activeTab !== tab) {
                            if (setIsAudioPlaying) {
                              setIsAudioPlaying(false);
                            }
                            if (tab === "Home") {
                              setCurrentImageIndex(0);
                            }
                            setActiveTab(tab);
                          }
                        }}
                        className={`text-xs md:text-[13px] w-auto min-w-[80px] md:w-[160px] font-bold px-3 py-1.5 md:px-4 md:py-2 rounded-md uppercase shrink-0 transition-all flex items-center justify-center ${
                          activeTab === tab
                            ? `${userType ? `${userType}-bg` : "bg-[#4290E9]"} text-white shadow-md`
                            : "bg-gray-200 text-[#666666] hover:bg-gray-300"
                        }`}
                        style={
                          activeTab === tab
                            ? {
                                backgroundColor: userType
                                  ? undefined
                                  : activeTabColor,
                              }
                            : undefined
                        }
                      >
                        {getTabIcon(tab)}
                        <span>{tab}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {activeTab === "Home" && (
                <div className="pt-[0px]">
                  {heroType === "video" && activeHeroVideoUrl ? (
                    <div
                      className={`relative w-full overflow-hidden ${isPublicView ? "h-screen" : "h-[45vh] sm:h-[636px]"} bg-black flex items-center justify-center`}
                    >
                      <video
                        ref={heroVideoRef}
                        src={activeHeroVideoUrl}
                        className="w-full h-full object-cover cursor-pointer"
                        autoPlay
                        loop
                        muted={effectiveHeroMuted}
                        playsInline
                        onClick={toggleHeroVideoPlay}
                      />
                      {/* Video Controls: Play/Pause and Mute/Unmute */}
                      <div className="absolute bottom-6 right-6 z-30 flex items-center gap-2.5">
                        {/* Play/Pause Button */}
                        <button
                          onClick={toggleHeroVideoPlay}
                          className="p-3 bg-black/60 hover:bg-black/85 text-white rounded-full backdrop-blur-md border border-white/20 transition-all cursor-pointer shadow-lg hover:scale-105"
                          title={isHeroVideoPlaying ? "Pause Video" : "Play Video"}
                        >
                          {isHeroVideoPlaying ? (
                            <Pause size={20} />
                          ) : (
                            <Play size={20} className="translate-x-0.5" />
                          )}
                        </button>
                        {/* Sound Toggle Button */}
                        <button
                          onClick={toggleHeroVideoMute}
                          className="p-3 bg-black/60 hover:bg-black/85 text-white rounded-full backdrop-blur-md border border-white/20 transition-all cursor-pointer shadow-lg hover:scale-105"
                          title={effectiveHeroMuted ? "Unmute Video" : "Mute Video"}
                        >
                          {effectiveHeroMuted ? (
                            <VolumeX size={20} />
                          ) : (
                            <Volume2 size={20} />
                          )}
                        </button>
                      </div>
                    </div>
                  ) : heroType === "single_photo" &&
                    (uploadedImages.length > 0 ||
                      (currentTourPhotos?.length ?? 0) > 0) ? (
                    (() => {
                      const coverSrc =
                        uploadedImages.length > 0
                          ? URL.createObjectURL(uploadedImages[0].file)
                          : currentTourPhotos?.[0]?.variant_urls?.landing ||
                            currentTourPhotos?.[0]?.variant_urls?.slider ||
                            currentTourPhotos?.[0]?.url ||
                            `${API_URL}/${currentTourPhotos?.[0]?.file_path}`;

                      return (
                        <div
                          className={`relative w-full overflow-hidden ${isPublicView ? "h-screen" : "h-[45vh] sm:h-[636px]"} bg-black flex items-center justify-center`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={coverSrc}
                            alt={orderData?.property_address || "Cover Photo"}
                            className="w-full h-full object-cover select-none"
                          />
                        </div>
                      );
                    })()
                  ) : (
                    (uploadedImages.length > 0 ||
                      (currentTourPhotos?.length ?? 0) > 0) && (
                      <div
                        className={`relative w-full overflow-hidden ${isPublicView ? "h-screen" : "h-[45vh] sm:h-[636px]"}`}
                      >
                        <CustomSlideshow
                          images={uploadedImages}
                          delay={delay}
                          transition={transition}
                          audioUrl={audioUrl}
                          api_images={currentTourPhotos}
                          className="h-full"
                          currentIndex={currentImageIndex}
                          onSlideChange={(index) => {
                            setCurrentImageIndex(index);
                            if (
                              isPublicView &&
                              onMediaView &&
                              currentTourPhotos?.[index]
                            ) {
                              onMediaView(currentTourPhotos[index].uuid);
                            }
                          }}
                          externalAudioControl={isPublicView ? true : undefined}
                          propIsPlaying={isHomeSlideshowPlaying}
                          propIsMuted={isAudioMuted}
                          propSetIsPlaying={handleHomeSlideshowPlayChange}
                          propSetIsMuted={setIsAudioMuted}
                          watermarkUrl={actualWatermarkLogo}
                        />
                      </div>
                    )
                  )}
                </div>
              )}

              {activeTab === "Overview" && (
                <div className="pt-[140px] md:pt-[165px] px-4 md:px-12 flex flex-col gap-10 max-w-5xl mx-auto w-full pb-12">
                  {/* Property Stats Icons */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 sm:gap-4 text-center text-sm">
                    {[
                      {
                        label: "PRICE",
                        value: orderData?.property.listing_price
                          ? `$${orderData?.property.listing_price}`
                          : null,
                        icon: <PriceTag />,
                      },
                      {
                        label: "BEDS",
                        value:
                          orderData?.property.bedrooms !== undefined &&
                          orderData?.property.bedrooms !== null
                            ? `${orderData?.property.bedrooms}`
                            : null,
                        icon: <BedIcon />,
                      },
                      {
                        label: "BATHS",
                        value:
                          orderData?.property.bathrooms !== undefined &&
                          orderData?.property.bathrooms !== null
                            ? `${orderData?.property.bathrooms}`
                            : null,
                        icon: <BathIcon />,
                      },
                      {
                        label: "SQ FT",
                        value: orderData?.property.square_footage
                          ? `${orderData?.property.square_footage} FT²`
                          : null,
                        icon: <HomeIcon />,
                      },
                      {
                        label: "LOT SIZE",
                        value: orderData?.property.lot_size
                          ? `${orderData?.property.lot_size} FT²`
                          : null,
                        icon: <LotIcon />,
                      },
                      {
                        label: "BUILT",
                        value:
                          orderData?.property.year_constructed !== undefined &&
                          orderData?.property.year_constructed !== null
                            ? `${orderData?.property.year_constructed}`
                            : null,
                        icon: <HelpIcon />,
                      },
                      {
                        label: "TYPE",
                        value: orderData?.property.property_type,
                        icon: <TypoeIcon />,
                      },
                    ]
                      .filter(
                        (item) =>
                          item.value !== null &&
                          item.value !== undefined &&
                          String(item.value).trim() !== "" &&
                          String(item.value).toLowerCase() !== "null" &&
                          String(item.value).toLowerCase() !== "undefined",
                      )
                      .map((item, index) => (
                        <div
                          key={index}
                          className="bg-white/90 backdrop-blur-md rounded-2xl p-4 border border-gray-200/80 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col items-center justify-center gap-2"
                        >
                          <div className="w-10 h-10 rounded-full bg-[#1b365d]/5 flex items-center justify-center text-[#1b365d] shrink-0">
                            {item.icon}
                          </div>
                          <span className="text-[11px] font-bold text-gray-400 font-alexandria uppercase tracking-wider">
                            {item.label}
                          </span>
                          <span className="text-[15px] font-bold text-[#1b365d] font-alexandria uppercase">
                            {item.value}
                          </span>
                        </div>
                      ))}
                  </div>

                  {/* Agent Contact + About Property Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {activeTourType !== "unbranded" && orderData?.agent && (
                      <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-gray-200/80 shadow-sm flex flex-col items-center md:items-start text-center md:text-left gap-5 h-fit">
                        {orderData?.agent?.logo_url || getAgentLogo() ? (
                          <div className="w-[200px] sm:w-[220px] aspect-square rounded-xl overflow-hidden border border-gray-200 shadow-sm shrink-0 mx-auto md:mx-0 bg-gray-50 flex items-center justify-center">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={getAgentLogo() || orderData?.agent?.logo_url}
                              alt="Agent Photo"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                                const parent = e.currentTarget.parentElement;
                                if (parent) parent.style.display = "none";
                              }}
                            />
                          </div>
                        ) : null}

                        <div className="text-left w-full flex flex-col gap-2 items-center md:items-start">
                          <span className="text-xs font-bold text-gray-400 font-alexandria uppercase tracking-widest">
                            Listing Agent
                          </span>
                          <h3 className="text-xl sm:text-2xl font-bold text-[#1b365d] font-alexandria">
                            {orderData?.agent?.first_name}{" "}
                            {orderData?.agent?.last_name}
                          </h3>
                          {orderData?.agent?.company_name && (
                            <p className="text-sm font-medium italic text-gray-600 font-alexandria">
                              {orderData.agent.company_name}
                            </p>
                          )}

                          {orderData?.agent?.primary_phone && (
                            <a
                              href={`tel:${orderData.agent.primary_phone}`}
                              className="text-base font-semibold text-[#2b6cb0] hover:underline font-alexandria mt-1 flex items-center gap-2"
                            >
                              <Phone size={16} />
                              <span>{orderData.agent.primary_phone}</span>
                            </a>
                          )}

                          {orderData?.agent?.website && (
                            <a
                              href={orderData.agent.website}
                              className="text-xs text-gray-500 hover:text-[#2b6cb0] break-all font-alexandria hover:underline mt-0.5"
                              target="_blank"
                              rel="noreferrer"
                            >
                              {orderData.agent.website}
                            </a>
                          )}

                          {orderData?.agent?.email && (
                            <a
                              href={`mailto:${orderData.agent.email}?subject=${encodeURIComponent(orderData?.property_address || "Inquiry regarding property")}`}
                              className="mt-3 flex items-center justify-center gap-2 bg-[#1b365d] hover:bg-[#2b6cb0] text-white text-xs font-semibold px-4 py-2.5 rounded-xl w-full transition-colors shadow-sm"
                            >
                              <Mail size={15} />
                              <span>Email Agent</span>
                            </a>
                          )}
                        </div>
                      </div>
                    )}

                    <div
                      className={`flex flex-col justify-between gap-6 bg-white rounded-2xl p-6 sm:p-8 border border-gray-200/80 shadow-sm ${activeTourType !== "unbranded" ? "lg:col-span-7" : "lg:col-span-12"}`}
                    >
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                          <FileText className="text-[#1b365d] w-5 h-5" />
                          <h2 className="text-lg font-bold text-[#1b365d] font-alexandria uppercase tracking-wide">
                            About The Property
                          </h2>
                        </div>
                        <p className="text-sm sm:text-base text-gray-700 font-alexandria leading-relaxed whitespace-pre-line">
                          {orderData?.property.description ||
                            "No description available."}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-100 justify-start">
                        {(() => {
                          const listingSheets = featureSheets.filter(
                            (sheet) => {
                              const template = templateImages.find(
                                (t) => t.id === sheet.template_key,
                              );
                              return (
                                template?.type === "listing" ||
                                (!template &&
                                  sheet.type === "pdf" &&
                                  sheet.template_key
                                    .toLowerCase()
                                    .includes("flyer"))
                              );
                            },
                          );
                          const tabloidSheets = featureSheets.filter(
                            (sheet) => {
                              const template = templateImages.find(
                                (t) => t.id === sheet.template_key,
                              );
                              return (
                                template?.type === "tabloid" ||
                                (!template &&
                                  sheet.type === "pdf" &&
                                  sheet.template_key
                                    .toLowerCase()
                                    .includes("tabloid"))
                              );
                            },
                          );
                          return (
                            <>
                              {listingSheets.length > 0 && (
                                <Button
                                  className="w-max hover:opacity-90 text-white rounded-xl shadow-sm"
                                  style={{
                                    backgroundColor: roleSettings.pageTabColor,
                                  }}
                                  onClick={() => {
                                    const sheet =
                                      listingSheets[listingSheets.length - 1];
                                    if (sheet.type === "pdf" && sheet.pdf_url) {
                                      window.open(
                                        featureSheetService.buildStorageUrl(
                                          sheet.pdf_url,
                                        ) || "",
                                        "_blank",
                                      );
                                    } else {
                                      window.open(
                                        `/tour/feature-sheet/${sheet.uuid}`,
                                        "_blank",
                                      );
                                    }
                                  }}
                                  disabled={isLoadingSheets}
                                >
                                  {isLoadingSheets ? (
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                  ) : null}
                                  Listing Flyer
                                </Button>
                              )}
                              {tabloidSheets.length > 0 && (
                                <Button
                                  className="w-max hover:opacity-90 text-white rounded-xl shadow-sm"
                                  style={{
                                    backgroundColor: roleSettings.pageTabColor,
                                  }}
                                  onClick={() => {
                                    const sheet =
                                      tabloidSheets[tabloidSheets.length - 1];
                                    if (sheet.type === "pdf" && sheet.pdf_url) {
                                      window.open(
                                        featureSheetService.buildStorageUrl(
                                          sheet.pdf_url,
                                        ) || "",
                                        "_blank",
                                      );
                                    } else {
                                      window.open(
                                        `/tour/feature-sheet/${sheet.uuid}`,
                                        "_blank",
                                      );
                                    }
                                  }}
                                  disabled={isLoadingSheets}
                                >
                                  {isLoadingSheets ? (
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                  ) : null}
                                  Tabloid Sheet
                                </Button>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Share icons */}
                  <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-sm flex flex-col items-center gap-3">
                    <span className="text-xs font-bold text-gray-400 font-alexandria uppercase tracking-widest">
                      Share Property
                    </span>
                    <div className="flex items-center gap-4">
                      <a
                        href={`mailto:?subject=${encodeURIComponent(orderData?.property_address || "")}&body=${encodeURIComponent(currentPath)}`}
                        className="w-11 h-11 rounded-full bg-[#1b365d] hover:bg-[#2b6cb0] flex items-center justify-center text-white hover:scale-105 transition-all shadow-sm"
                        title="Share via Email"
                      >
                        <Mail size={18} />
                      </a>
                      <a
                        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentPath)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-11 h-11 rounded-full bg-[#1b365d] hover:bg-[#2b6cb0] flex items-center justify-center text-white hover:scale-105 transition-all shadow-sm"
                        title="Share on Facebook"
                      >
                        <svg
                          className="w-4 h-4 fill-current"
                          viewBox="0 0 24 24"
                        >
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                        </svg>
                      </a>
                      <a
                        href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(currentPath)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-11 h-11 rounded-full bg-[#1b365d] hover:bg-[#2b6cb0] flex items-center justify-center text-white hover:scale-105 transition-all shadow-sm"
                        title="Share on Twitter"
                      >
                        <svg
                          className="w-4 h-4 fill-current"
                          viewBox="0 0 24 24"
                        >
                          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.936 9.936 0 0024 4.59z" />
                        </svg>
                      </a>
                      <button
                        onClick={() => {
                          if (navigator.share) {
                            navigator
                              .share({
                                title:
                                  orderData?.property_address || "Public Tour",
                                url: currentPath,
                              })
                              .catch(() => {});
                          } else {
                            navigator.clipboard.writeText(currentPath);
                            toast.success("Link copied to clipboard!");
                          }
                        }}
                        className="w-11 h-11 rounded-full bg-[#1b365d] hover:bg-[#2b6cb0] flex items-center justify-center text-white hover:scale-105 transition-all shadow-sm"
                        title="Share"
                      >
                        <span className="text-xl font-bold">+</span>
                      </button>
                    </div>
                  </div>

                  {/* Map */}
                  <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-sm flex flex-col gap-4">
                    <h3 className="text-center text-lg font-bold text-[#1b365d] font-alexandria uppercase tracking-wide">
                      Location Map
                    </h3>
                    <div className="w-full h-[400px] bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
                      <DynamicMap
                        address={orderData?.property.address}
                        city={orderData?.property.city}
                        province={orderData?.property.province}
                        country={orderData?.property.country}
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "Contact" && (
                <div className="pt-[140px] md:pt-[165px] px-4 md:px-12 flex flex-col items-center gap-8 max-w-4xl mx-auto w-full pb-16">
                  <h2 className="text-2xl font-semibold text-[#424242]">
                    Contact
                  </h2>

                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8 bg-white p-6 sm:p-10 rounded-xl shadow-sm border border-gray-100 w-full justify-center">
                    {/* Agent Image / Logo */}
                    <div className="w-[200px] sm:w-[240px] aspect-square rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center shrink-0">
                      {orderData?.agent.logo_url || getAgentLogo() ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={getAgentLogo() || orderData?.agent.logo_url}
                          alt="Agent photo"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-gray-400 font-medium">
                          No Image
                        </div>
                      )}
                    </div>

                    {/* Agent Info */}
                    <div className="flex flex-col items-center sm:items-start text-center sm:text-left gap-3 text-[#424242]">
                      <h3 className="text-xl sm:text-2xl font-semibold">
                        {orderData?.agent.first_name}{" "}
                        {orderData?.agent.last_name}
                      </h3>
                      <p className="text-base italic text-gray-600">
                        {orderData?.agent.company_name || ""}
                      </p>

                      {/* <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          toast.info("Showing all tours for this agent");
                        }}
                        className="text-sm text-gray-600 hover:underline underline"
                      >
                        View All My Tours
                      </a> */}

                      {/* Company name styled */}
                      <div className="mt-1 flex items-center">
                        <span className="text-base font-bold tracking-wider text-[#d92525]">
                          {orderData?.agent.company_name?.toUpperCase() || ""}
                        </span>
                      </div>

                      {/* Email + Phone action buttons */}
                      <div className="flex flex-wrap gap-3 mt-4 items-center justify-center sm:justify-start">
                        {orderData?.agent?.email && (
                          <a
                            href={`mailto:${orderData.agent.email}?subject=Inquiry about ${encodeURIComponent(orderData?.property_address || "Property")}`}
                            className="inline-flex items-center justify-center gap-2 bg-[#1b365d] text-white px-5 py-2.5 rounded-full text-sm font-medium shadow-sm hover:bg-[#132744] transition-colors whitespace-nowrap"
                          >
                            <Mail size={16} className="shrink-0" />
                            <span>{orderData.agent.email}</span>
                          </a>
                        )}
                        {orderData?.agent?.primary_phone && (
                          <a
                            href={`tel:${orderData.agent.primary_phone}`}
                            className="inline-flex items-center justify-center gap-2 bg-[#1b365d] text-white px-5 py-2.5 rounded-full text-sm font-medium shadow-sm hover:bg-[#132744] transition-colors whitespace-nowrap shrink-0"
                          >
                            <Phone size={16} className="shrink-0" />
                            <span>{orderData.agent.primary_phone}</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {activeTab === "Photos" && (
                <div className="pt-[140px] md:pt-[165px] px-4 md:px-12 max-w-7xl mx-auto w-full pb-16">
                  {uploadedImages.length > 0 ||
                  (currentTourPhotos?.length ?? 0) > 0 ? (
                    <>
                      {/* Gallery Toolbar */}
                      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm mb-6">
                        <div className="flex items-center gap-2.5">
                          <ImageIcon className="text-[#1b365d] w-5 h-5" />
                          <span className="font-bold text-[#1b365d] text-base md:text-lg font-alexandria">
                            Photo Gallery
                          </span>
                          <span className="text-xs bg-gray-100 text-gray-600 font-semibold px-2.5 py-0.5 rounded-full font-alexandria">
                            {uploadedImages.length +
                              (currentTourPhotos?.length || 0)}{" "}
                            Photos
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          {/* Grid Size Selector */}
                          <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200 text-xs font-semibold font-alexandria">
                            <button
                              onClick={() => setPhotoGridSize("small")}
                              className={`px-3 py-1.5 rounded-lg transition-all ${photoGridSize === "small" ? "bg-white text-[#1b365d] shadow-sm" : "text-gray-500 hover:text-gray-900"}`}
                            >
                              Small
                            </button>
                            <button
                              onClick={() => setPhotoGridSize("medium")}
                              className={`px-3 py-1.5 rounded-lg transition-all ${photoGridSize === "medium" ? "bg-white text-[#1b365d] shadow-sm" : "text-gray-500 hover:text-gray-900"}`}
                            >
                              Medium
                            </button>
                            <button
                              onClick={() => setPhotoGridSize("large")}
                              className={`px-3 py-1.5 rounded-lg transition-all ${photoGridSize === "large" ? "bg-white text-[#1b365d] shadow-sm" : "text-gray-500 hover:text-gray-900"}`}
                            >
                              Large
                            </button>
                          </div>

                          {/* Fullscreen Gallery Button */}
                          <button
                            onClick={() => {
                              setSelectedPhotoIndex(0);
                              resetLightboxZoom();
                              setIsFullscreenSlideshowOpen(true);
                            }}
                            className="inline-flex items-center gap-2 bg-[#1b365d] hover:bg-[#2b6cb0] text-white text-xs md:text-sm font-semibold px-4 py-2 rounded-xl transition-all shadow-sm shrink-0 cursor-pointer font-alexandria"
                          >
                            <Maximize size={15} />
                            <span>View Fullscreen</span>
                          </button>
                        </div>
                      </div>

                      {/* Photo Grid */}
                      {(() => {
                        const allLightboxPhotos = [
                          ...(uploadedImages || []).map((img, idx) => ({
                            src: URL.createObjectURL(img.file),
                            uuid: `local-${img.file.name}-${idx}`,
                            name: img.file.name,
                          })),
                          ...(regularPhotosList || []).map((img: any) => ({
                            src:
                              img.variant_urls?.popup ||
                              img.variant_urls?.landing ||
                              img.variant_urls?.slider ||
                              img.url ||
                              `${API_URL}/${img.file_path}`,
                            uuid: img.uuid,
                            name: img.name || "Photo",
                          })),
                        ];

                        return (
                          <>
                            <div
                              className={`grid ${
                                photoGridSize === "small"
                                  ? "grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5"
                                  : photoGridSize === "large"
                                    ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5"
                                    : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5"
                              }`}
                            >
                              {uploadedImages.map((image, index) => (
                                <div
                                  key={`uploaded-${index}`}
                                  className="group relative aspect-[4/3] bg-gray-100 rounded-xl overflow-hidden border border-gray-200/80 shadow-sm hover:shadow-md transition-all cursor-pointer hover:scale-[1.02]"
                                  onClick={() => {
                                    setSelectedPhotoIndex(index);
                                    resetLightboxZoom();
                                    setIsFullscreenSlideshowOpen(true);
                                  }}
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={URL.createObjectURL(image.file)}
                                    alt={`Uploaded ${index + 1}`}
                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                  />
                                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                    <div className="w-10 h-10 rounded-full bg-white/90 text-[#1b365d] flex items-center justify-center shadow-lg">
                                      <Maximize size={18} />
                                    </div>
                                  </div>
                                </div>
                              ))}
                              {regularPhotosList?.map((image, index) => {
                                const globalIndex = uploadedImages.length + index;
                                return (
                                  <div
                                    key={`api-${index}`}
                                    className="group relative aspect-[4/3] bg-gray-100 rounded-xl overflow-hidden border border-gray-200/80 shadow-sm hover:shadow-md transition-all cursor-pointer hover:scale-[1.02]"
                                    onClick={() => {
                                      setSelectedPhotoIndex(globalIndex);
                                      resetLightboxZoom();
                                      setIsFullscreenSlideshowOpen(true);
                                      if (
                                        isPublicView &&
                                        onMediaView &&
                                        image?.uuid
                                      ) {
                                        onMediaView(image.uuid);
                                      }
                                    }}
                                  >
                                    {image.is_processing ? (
                                      <div className="w-full h-full flex flex-col gap-2 items-center justify-center bg-gray-200">
                                        <p className="text-gray-500 font-medium text-xs">
                                          Processing...
                                        </p>
                                      </div>
                                    ) : (
                                      <>
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                          src={
                                            image.variant_urls?.slider ||
                                            image.variant_urls?.thumb ||
                                            image.url ||
                                            `${API_URL}/${image.file_path}`
                                          }
                                          alt={`Photo ${index + 1}`}
                                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                          loading="lazy"
                                        />
                                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                          <div className="w-10 h-10 rounded-full bg-white/90 text-[#1b365d] flex items-center justify-center shadow-lg">
                                            <Maximize size={18} />
                                          </div>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                );
                              })}
                            </div>

                            {/* Standard Interactive Pop-up Gallery Lightbox Modal (Solid White Theme) */}
                            {isFullscreenSlideshowOpen && allLightboxPhotos.length > 0 && (
                              <div
                                className="fixed inset-0 z-[99999] bg-white opacity-100 flex flex-col justify-between items-center select-none animate-in fade-in duration-150"
                                onClick={(e) => {
                                  if (e.target === e.currentTarget) {
                                    setIsFullscreenSlideshowOpen(false);
                                    resetLightboxZoom();
                                  }
                                }}
                              >
                                {/* Top Controls Bar */}
                                <div className="w-full z-50 flex items-center justify-between px-4 sm:px-8 py-4 bg-white border-b border-gray-200">
                                  {/* Counter & Name */}
                                  <div className="flex items-center gap-3">
                                    <span className="text-[#1b365d] text-sm font-semibold tracking-wide bg-gray-100/90 px-3 py-1.5 rounded-full border border-gray-200/80 shadow-sm font-alexandria">
                                      {selectedPhotoIndex + 1} / {allLightboxPhotos.length}
                                    </span>
                                    {allLightboxPhotos[selectedPhotoIndex]?.name && (
                                      <span className="text-gray-700 text-xs sm:text-sm font-medium hidden sm:inline-block truncate max-w-md font-alexandria">
                                        {allLightboxPhotos[selectedPhotoIndex].name}
                                      </span>
                                    )}
                                  </div>

                                  {/* Zoom & Action Controls */}
                                  <div className="flex items-center gap-2">
                                    {/* Zoom Controls */}
                                    <div className="flex items-center gap-1 bg-gray-100/90 backdrop-blur-md px-2 py-1 rounded-full border border-gray-200/80 shadow-sm">
                                      {/* Reset Zoom Button on the LEFT of Zoom Out */}
                                      {lightboxZoom > 1 && (
                                        <button
                                          onClick={resetLightboxZoom}
                                          className="p-1.5 text-gray-700 hover:text-[#1b365d] hover:bg-gray-200 rounded-full transition-all cursor-pointer mr-0.5"
                                          title="Reset Zoom (100%)"
                                        >
                                          <RotateCcw size={15} />
                                        </button>
                                      )}
                                      <button
                                        onClick={handleLightboxZoomOut}
                                        disabled={lightboxZoom <= 1}
                                        className="p-1.5 text-gray-700 hover:text-[#1b365d] hover:bg-gray-200 rounded-full transition-all disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
                                        title="Zoom Out"
                                      >
                                        <ZoomOut size={18} />
                                      </button>
                                      <span className="text-[#1b365d] text-xs font-semibold px-1 min-w-[40px] text-center font-alexandria">
                                        {Math.round(lightboxZoom * 100)}%
                                      </span>
                                      <button
                                        onClick={handleLightboxZoomIn}
                                        disabled={lightboxZoom >= 3}
                                        className="p-1.5 text-gray-700 hover:text-[#1b365d] hover:bg-gray-200 rounded-full transition-all disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
                                        title="Zoom In"
                                      >
                                        <ZoomIn size={18} />
                                      </button>
                                    </div>

                                    {/* Close Button */}
                                    <button
                                      onClick={() => {
                                        setIsFullscreenSlideshowOpen(false);
                                        resetLightboxZoom();
                                        setSelectedPhotoIndex(0);
                                      }}
                                      className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-[#1b365d] flex items-center justify-center border border-gray-200 transition-all cursor-pointer ml-2 shadow-sm"
                                      title="Close (Esc)"
                                    >
                                      <X size={20} />
                                    </button>
                                  </div>
                                </div>

                                {/* Center Image Display Area */}
                                <div
                                  className="relative w-full flex-1 flex items-center justify-center overflow-hidden px-4 py-2"
                                  onMouseDown={(e) => {
                                    if (lightboxZoom > 1) {
                                      setIsLightboxDragging(true);
                                      setLightboxDragStart({
                                        x: e.clientX - lightboxPan.x,
                                        y: e.clientY - lightboxPan.y,
                                      });
                                    }
                                  }}
                                  onMouseMove={(e) => {
                                    if (isLightboxDragging && lightboxZoom > 1) {
                                      setLightboxPan({
                                        x: e.clientX - lightboxDragStart.x,
                                        y: e.clientY - lightboxDragStart.y,
                                      });
                                    }
                                  }}
                                  onMouseUp={() => setIsLightboxDragging(false)}
                                  onMouseLeave={() => setIsLightboxDragging(false)}
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={allLightboxPhotos[selectedPhotoIndex]?.src}
                                    alt={`Photo ${selectedPhotoIndex + 1}`}
                                    className="max-h-[82vh] max-w-[90vw] object-contain transition-transform duration-100 ease-out select-none shadow-xl rounded-sm"
                                    style={{
                                      transform: `scale(${lightboxZoom}) translate(${lightboxPan.x / lightboxZoom}px, ${lightboxPan.y / lightboxZoom}px)`,
                                      cursor:
                                        lightboxZoom > 1
                                          ? isLightboxDragging
                                            ? "grabbing"
                                            : "grab"
                                          : "default",
                                    }}
                                    draggable={false}
                                    onDoubleClick={() => {
                                      if (lightboxZoom === 1) {
                                        setLightboxZoom(2);
                                      } else {
                                        resetLightboxZoom();
                                      }
                                    }}
                                  />
                                </div>

                                {/* Left / Previous Arrow */}
                                {allLightboxPhotos.length > 1 && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      resetLightboxZoom();
                                      const newIdx =
                                        selectedPhotoIndex === 0
                                          ? allLightboxPhotos.length - 1
                                          : selectedPhotoIndex - 1;
                                      setSelectedPhotoIndex(newIdx);
                                      if (
                                        isPublicView &&
                                        onMediaView &&
                                        allLightboxPhotos[newIdx]?.uuid
                                      ) {
                                        onMediaView(allLightboxPhotos[newIdx].uuid);
                                      }
                                    }}
                                    className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 z-50 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/90 hover:bg-white text-[#1b365d] flex items-center justify-center border border-gray-200/80 transition-all cursor-pointer shadow-lg backdrop-blur-md group hover:scale-105"
                                    title="Previous (Left Arrow)"
                                  >
                                    <ChevronLeft
                                      size={32}
                                      className="group-hover:-translate-x-0.5 transition-transform"
                                    />
                                  </button>
                                )}

                                {/* Right / Next Arrow */}
                                {allLightboxPhotos.length > 1 && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      resetLightboxZoom();
                                      const newIdx =
                                        (selectedPhotoIndex + 1) %
                                        allLightboxPhotos.length;
                                      setSelectedPhotoIndex(newIdx);
                                      if (
                                        isPublicView &&
                                        onMediaView &&
                                        allLightboxPhotos[newIdx]?.uuid
                                      ) {
                                        onMediaView(allLightboxPhotos[newIdx].uuid);
                                      }
                                    }}
                                    className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 z-50 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/90 hover:bg-white text-[#1b365d] flex items-center justify-center border border-gray-200/80 transition-all cursor-pointer shadow-lg backdrop-blur-md group hover:scale-105"
                                    title="Next (Right Arrow)"
                                  >
                                    <ChevronRight
                                      size={32}
                                      className="group-hover:translate-x-0.5 transition-transform"
                                    />
                                  </button>
                                )}

                                {/* Bottom Mini Tip */}
                                <div className="w-full z-50 py-3 bg-white border-t border-gray-100 flex items-center justify-center">
                                  <span className="text-gray-500 text-xs tracking-wider font-alexandria">
                                    Use Left / Right arrow keys to navigate • Double-click or use zoom tools to magnify • Esc to close
                                  </span>
                                </div>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </>
                  ) : (
                    (() => {
                      const allPhotos =
                        filesData?.files?.filter(
                          (file) =>
                            file?.service?.name !== "2D Floor Plans" &&
                            file?.service?.name !== "3D Floor Plans" &&
                            file.type === "photo",
                        ) || [];
                      if (userType === "agent") {
                        if (allPhotos.length > 0) {
                          return (
                            <div className="font-alexandria w-full h-[50vh] text-[#4290E9] flex justify-center items-center font-[500] text-[18px]">
                              <p>
                                You have not approved any photos yet. Go to
                                Photo service and approve media.
                              </p>
                            </div>
                          );
                        } else {
                          return (
                            <div className="font-alexandria w-full h-[50vh] text-[#E06D5E] flex justify-center items-center font-[500] text-[18px]">
                              <p>Vendor has not uploaded any photos yet.</p>
                            </div>
                          );
                        }
                      }
                      return (
                        <div className="font-alexandria w-full h-[50vh] text-gray-500 flex justify-center items-center">
                          <p>
                            No photos found — please upload photos or select a
                            photo service.
                          </p>
                        </div>
                      );
                    })()
                  )}
                </div>
              )}

              {activeTab === "Videos" && (
                <div className="pt-[140px] md:pt-[165px] px-4 sm:px-6 md:px-8 max-w-7xl mx-auto w-full pb-16 flex flex-col items-center font-alexandria">
                  {selectedVideoFiles.length > 0 ||
                  (currentVideoFiles?.length ?? 0) > 0 ? (
                    <div className="w-full flex flex-col items-center">
                      {/* Main Video Player Card */}
                      {mainVideo && (
                        <div className="w-full max-w-5xl aspect-video bg-black rounded-2xl overflow-hidden shadow-xl border border-gray-200/80 relative">
                          <video
                            key={mainVideo}
                            src={mainVideo}
                            className="w-full h-full object-contain bg-black"
                            controls
                            playsInline
                          />
                          {/* Client requested to remove bottom-right branding watermark; commented out in case they want it back later
                          {actualWatermarkLogo && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={actualWatermarkLogo}
                              alt="Watermark"
                              className="absolute bottom-12 right-6 w-[120px] object-contain opacity-60 pointer-events-none z-10 drop-shadow-md"
                            />
                          )}
                          */}
                        </div>
                      )}

                      {/* Video Thumbnails Selection List (if multiple videos exist) */}
                      {selectedVideoFiles.length +
                        (currentVideoFiles?.length || 0) >
                        1 && (
                        <div className="w-full max-w-5xl mt-8">
                          <h3 className="text-lg font-bold text-[#1b365d] mb-4">
                            All Videos (
                            {selectedVideoFiles.length +
                              (currentVideoFiles?.length || 0)}
                            )
                          </h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {selectedVideoFiles.map((file, idx) => {
                              const thumbSrc = URL.createObjectURL(file.file);
                              const isSelected = mainVideo === thumbSrc;
                              return (
                                <div
                                  key={`local-vid-${idx}`}
                                  onClick={() => setMainVideo(thumbSrc)}
                                  className={`group relative aspect-video bg-black rounded-xl overflow-hidden cursor-pointer border-2 transition-all shadow-sm ${
                                    isSelected
                                      ? "border-[#1b365d] ring-2 ring-[#1b365d]/20 scale-[1.02]"
                                      : "border-gray-200 hover:border-gray-400 hover:scale-[1.01]"
                                  }`}
                                >
                                  <video
                                    src={thumbSrc}
                                    className="w-full h-full object-cover pointer-events-none"
                                  />
                                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-all flex items-center justify-center">
                                    <div
                                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                                        isSelected
                                          ? "bg-[#1b365d] text-white"
                                          : "bg-white/90 text-[#1b365d] group-hover:scale-110"
                                      }`}
                                    >
                                      <Play size={18} />
                                    </div>
                                  </div>
                                  <div className="absolute bottom-2 left-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-sm rounded text-white text-xs truncate">
                                    {file.file.name}
                                  </div>
                                </div>
                              );
                            })}
                            {currentVideoFiles?.map((file, idx) => {
                              const apiSrc =
                                file.url || `${API_URL}/${file.file_path}`;
                              const isSelected = mainVideo === apiSrc;
                              return (
                                <div
                                  key={`api-vid-${idx}`}
                                  onClick={() => setMainVideo(apiSrc)}
                                  className={`group relative aspect-video bg-black rounded-xl overflow-hidden cursor-pointer border-2 transition-all shadow-sm ${
                                    isSelected
                                      ? "border-[#1b365d] ring-2 ring-[#1b365d]/20 scale-[1.02]"
                                      : "border-gray-200 hover:border-gray-400 hover:scale-[1.01]"
                                  }`}
                                >
                                  {file.is_processing ? (
                                    <div className="w-full h-full flex flex-col gap-2 items-center justify-center bg-gray-200">
                                      <p className="text-gray-500 font-medium text-xs">
                                        Processing...
                                      </p>
                                    </div>
                                  ) : (
                                    <>
                                      {file.variant_urls?.thumb ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                          src={file.variant_urls.thumb}
                                          alt={file.name || "Video thumbnail"}
                                          className="w-full h-full object-cover pointer-events-none"
                                        />
                                      ) : (
                                        <video
                                          src={apiSrc}
                                          className="w-full h-full object-cover pointer-events-none"
                                        />
                                      )}
                                      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-all flex items-center justify-center">
                                        <div
                                          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                                            isSelected
                                              ? "bg-[#1b365d] text-white"
                                              : "bg-white/90 text-[#1b365d] group-hover:scale-110"
                                          }`}
                                        >
                                          <Play size={18} />
                                        </div>
                                      </div>
                                      <div className="absolute bottom-2 left-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-sm rounded text-white text-xs truncate">
                                        {file.name || `Video ${idx + 1}`}
                                      </div>
                                    </>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    (() => {
                      const allVideos =
                        filesData?.files?.filter(
                          (file) => file.type === "video",
                        ) || [];
                      if (userType === "agent") {
                        if (allVideos.length > 0) {
                          return (
                            <div className="font-alexandria w-full h-[50vh] text-[#4290E9] flex justify-center items-center font-[500] text-[18px]">
                              <p>
                                You have not approved any videos yet. Go to
                                Video service and approve media.
                              </p>
                            </div>
                          );
                        } else {
                          return (
                            <div className="font-alexandria w-full h-[50vh] text-[#E06D5E] flex justify-center items-center font-[500] text-[18px]">
                              <p>Vendor has not uploaded any videos yet.</p>
                            </div>
                          );
                        }
                      }
                      return (
                        <div className="font-alexandria w-full h-[50vh] text-gray-500 flex justify-center items-center">
                          <p>
                            No Video found — please add Video or select a
                            Video service.
                          </p>
                        </div>
                      );
                    })()
                  )}
                </div>
              )}

              {activeTab === "360° Panos" && (
                <div className="w-full pt-[140px] md:pt-[165px] px-4 md:px-12 pb-10">
                  <div className="w-full max-w-6xl mx-auto flex flex-col items-center">
                    <ThreeSixtyViewer
                      files={panoramicFiles}
                      isEmbedded={true}
                    />
                  </div>
                </div>
              )}

              {activeTab === "Floorplan" && (
                <div className="w-full pt-[140px] md:pt-[165px]">
                  {isPublicView ? (
                    <PublicTourFloorPlans
                      floorPlanFiles={publicFloorPlanFiles || []}
                      snapshots={orderData?.tours?.[0]?.snapshots}
                      tourPhotos={publicTourPhotos as any}
                      watermarkLogo={actualWatermarkLogo}
                    />
                  ) : (
                    <TourFloorPlans type="confirm" />
                  )}
                </div>
              )}
              <div
                className="w-full pt-[140px] md:pt-[165px]"
                style={{
                  display: activeTab === "Matterport" ? undefined : "none",
                }}
              >
                {!displayMatterportLinks?.length ? (
                  userType === "agent" ? (
                    <div className="font-alexandria w-full h-[50vh] text-[#E06D5E] flex justify-center items-center font-[500] text-[18px]">
                      <p>Vendor has not added any Matterport links yet.</p>
                    </div>
                  ) : (
                    <div className="font-alexandria w-full h-[50vh] text-gray-500 flex justify-center items-center">
                      <p>No Matterport links found for this tour type.</p>
                    </div>
                  )
                ) : (
                  <Accordion
                    type="single"
                    collapsible
                    defaultValue="Preview-Matterport"
                    className="w-full"
                  >
                    <AccordionItem value="Preview-Matterport">
                      <AccordionTrigger
                        className={`px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] bg-[#E4E4E4] ${userType}-text text-[15px] md:text-[18px] font-[600] uppercase [&>svg]:text-current [&>svg]:w-6 [&>svg]:h-6 [&>svg]:stroke-[2] [&>svg]:stroke-current`}
                        style={{
                          backgroundColor: `var(--${role}-page-bg, #E4E4E4)`,
                        }}
                      >
                        Matterport Preview-
                        {activeTourType === "branded" ? "Branded" : "Unbranded"}
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="w-full flex flex-col items-center gap-10 py-[30px]">
                          {userType === "agent" &&
                          !(
                            orderData?.payment_status === "PAID" ||
                            orderData?.services?.find(
                              (s) =>
                                s.service?.name
                                  ?.toLowerCase()
                                  .includes("matterport") ||
                                s.service?.name
                                  ?.toLowerCase()
                                  .includes("3d tour"),
                            )?.payment_status === "PAID"
                          ) ? (
                            <div className="w-[90%] md:w-[80%] bg-orange-100 border border-orange-300 text-orange-800 px-4 py-3 rounded text-center mb-[-20px]">
                              You have not paid for this service yet. Pay the
                              service to visit/view Matterport.
                            </div>
                          ) : (
                            displayMatterportLinks?.map(
                              (link, idx) =>
                                isValidUrl(link.link) && (
                                  <div
                                    key={`preview-matterport-${idx}`}
                                    className="relative w-full md:w-[80%] h-[300px] sm:h-[500px] mt-4 px-4 md:px-0"
                                  >
                                    <iframe
                                      src={link.link}
                                      className="w-full h-full border"
                                      allowFullScreen
                                    ></iframe>
                                  </div>
                                ),
                            )
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                )}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      {/* Floating Side Contact View */}
      {activeTourType !== "unbranded" && orderData?.agent && (
        <div className="fixed right-0 top-1/2 -translate-y-1/2 z-50 flex items-center pointer-events-auto">
          {!isSideContactOpen ? (
            <button
              onClick={() => {
                setHasUserClosedSideContact(false);
                setIsSideContactOpen(true);
              }}
              className="bg-[#4290E9] hover:bg-[#337ab7] text-white py-4 px-2 rounded-l-xl shadow-xl cursor-pointer flex flex-col items-center gap-2 select-none transition-all"
              title="Open Contact Info"
            >
              <div className="w-5 h-5 rounded-full bg-white text-[#4290E9] flex items-center justify-center shadow-sm shrink-0">
                <ChevronLeft size={14} strokeWidth={3} />
              </div>
              <span className="font-bold text-xs tracking-widest uppercase [writing-mode:vertical-lr] rotate-180 select-none">
                CONTACT
              </span>
            </button>
          ) : (
            <div className="bg-[#ededed] border border-gray-300 rounded-l-2xl sm:rounded-2xl shadow-2xl p-4 sm:p-5 w-[260px] sm:w-[290px] mr-0 sm:mr-4 flex flex-col transition-all duration-300 animate-in fade-in slide-in-from-right-4">
              {/* Close Button */}
              <div className="flex justify-end mb-2">
                <button
                  onClick={() => {
                    setHasUserClosedSideContact(true);
                    setIsSideContactOpen(false);
                  }}
                  className="w-7 h-7 rounded-full bg-[#1b365d] hover:bg-[#2b6cb0] text-white flex items-center justify-center transition-colors shadow cursor-pointer"
                  title="Close Contact Info"
                >
                  <ChevronRight size={18} strokeWidth={3} />
                </button>
              </div>

              {/* Agent Photo */}
              <div className="bg-white border border-gray-300 rounded-sm p-1.5 mb-3 aspect-[4/3] w-full flex items-center justify-center overflow-hidden shadow-inner">
                {getAgentLogo() ||
                orderData?.agent?.avatar_url ||
                orderData?.agent?.avatar ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={
                      getAgentLogo() ||
                      orderData?.agent?.avatar_url ||
                      orderData?.agent?.avatar
                    }
                    alt={`${orderData?.agent?.first_name || "Agent"} photo`}
                    className="w-full h-full object-cover rounded-sm"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 font-medium text-xs">
                    No Image
                  </div>
                )}
              </div>

              {/* Agent Details */}
              <div className="flex flex-col items-center text-center">
                <h4 className="font-bold text-[#1b365d] text-lg sm:text-xl leading-snug">
                  {orderData?.agent?.first_name} {orderData?.agent?.last_name}
                </h4>
                {orderData?.agent?.company_name && (
                  <p className="italic text-gray-600 text-sm mt-1">
                    {orderData.agent.company_name}
                  </p>
                )}
                {orderData?.agent?.primary_phone && (
                  <a
                    href={`tel:${orderData.agent.primary_phone}`}
                    className="block text-[#2b6cb0] font-semibold text-base mt-2 hover:underline"
                  >
                    {orderData.agent.primary_phone}
                  </a>
                )}
                {orderData?.agent?.email && (
                  <a
                    href={`mailto:${orderData.agent.email}?subject=${encodeURIComponent(orderData?.property_address || "Inquiry regarding property")}`}
                    className="mt-3 flex items-center justify-center gap-2 bg-[#1b365d] hover:bg-[#2b6cb0] text-white text-xs sm:text-sm font-semibold px-4 py-2 rounded-md w-full transition-colors shadow-sm"
                  >
                    <Mail size={15} />
                    <span>Email Agent</span>
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <TourActivityDialog
        open={open}
        onOpenChange={setOpen}
        tourUuid={tourUuid || orderData?.tours?.[0]?.uuid || ""}
        propertyAddress={`${orderData?.property?.address || ""}, ${orderData?.property?.city || ""}, ${orderData?.property?.province || ""}`}
      />
    </div>
  );
};

export default TourConfirm;
