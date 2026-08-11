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
  MapPin,
  Video,
  FileText,
  Box,
  ImageIcon,
} from "lucide-react";
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
  isAudioPlaying,
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
  const roleSettings = appliedSettings?.[
    role as keyof typeof appliedSettings
  ] ||
    appliedSettings?.["admin"] || {
      pageTabColor: "#4290E9",
      activeColor: "#4290E9",
    };

  const fileManagerContext = useOptionalFileManagerContext();
  const selectedFiles = fileManagerContext?.selectedFiles || [];
  const delay =
    fileManagerContext?.delay ||
    Number(orderData?.tours?.[0]?.slide_show?.slide_delay) ||
    4000;
  const transition =
    fileManagerContext?.transition ||
    orderData?.tours?.[0]?.slide_show?.transitions ||
    "kenburns";
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

  let currentTourPhotos = isPublicView
    ? publicTourPhotos
    : filesData?.files?.filter(
        (file) =>
          file?.service?.name !== "2D Floor Plans" &&
          file?.service?.name !== "3D Floor Plans" &&
          file.type === "photo",
      );

  const isMediaApprovedByAgent = (file: any) => {
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
  };

  if (currentTourPhotos) {
    currentTourPhotos = getGlobalPhotoOrder(currentTourPhotos as any);
    currentTourPhotos = currentTourPhotos?.filter(isMediaApprovedByAgent);
  }

  const API_URL = process.env.NEXT_PUBLIC_FILES_API_URL;

  const currentVideoFiles = React.useMemo(() => {
    let files = isPublicView
      ? publicVideoFiles
      : filesData?.files?.filter((file) => file.type === "video");

    if (!isPublicView) {
      files = files?.filter(isMediaApprovedByAgent);
    }
    return files;
  }, [isPublicView, publicVideoFiles, filesData?.files]);
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

  const previewTabs = React.useMemo(() => {
    const tabs = ["Home", "Overview", "Contact"];
    if (hasPhotos) tabs.push("Photos");
    if (hasVideos) tabs.push("Videos");
    if (hasFloorPlans) tabs.push("Floorplan");
    if (hasMatterport) tabs.push("Matterport");
    return tabs;
  }, [hasPhotos, hasVideos, hasFloorPlans, hasMatterport]);

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
          <AccordionContent className={hideAccordion ? "border-none" : ""}>
            <div
              className={`w-full flex flex-col gap-6 px-0 pb-6 relative ${hideAccordion ? "pt-0" : ""}`}
            >
              {/* Tabs */}
              <div className="flex overflow-x-auto whitespace-nowrap scrollbar-none max-w-[95%] md:max-w-none px-4 gap-2 py-2 absolute top-3 z-30 left-1/2 -translate-x-1/2 w-full md:w-auto justify-start md:justify-center">
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
                        return <FileText size={14} className="inline mr-1.5" />;
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
                      onClick={() => setActiveTab(tab)}
                      className={`text-xs md:text-[13px] w-auto min-w-[80px] md:w-[160px] font-bold px-3 py-1.5 md:px-4 md:py-2 rounded-md uppercase shrink-0 transition-all flex items-center justify-center ${
                        activeTab === tab
                          ? `${userType}-bg text-white shadow-md`
                          : "bg-gray-200 text-[#666666] hover:bg-gray-300"
                      }`}
                    >
                      {getTabIcon(tab)}
                      <span>{tab}</span>
                    </button>
                  );
                })}
              </div>

              {activeTab === "Home" && (
                <div className="pt-[0px]">
                  {(uploadedImages.length > 0 ||
                    (currentTourPhotos?.length ?? 0) > 0) && (
                    <div
                      className={`relative w-full overflow-hidden ${isPublicView ? "h-[70vh] md:h-[100vh]" : "h-[45vh] sm:h-[636px]"}`}
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
                        propIsPlaying={isAudioPlaying}
                        propIsMuted={isAudioMuted}
                        propSetIsPlaying={setIsAudioPlaying}
                        propSetIsMuted={setIsAudioMuted}
                        watermarkUrl={actualWatermarkLogo}
                      />

                      {isPublicView && (
                        <div className="absolute bottom-4 left-4 right-4 md:right-auto md:bottom-6 md:left-6 z-50 pointer-events-auto">
                          <div className="bg-black/70 backdrop-blur-md rounded-lg md:rounded-[12px] px-3 py-2 md:px-4 md:py-3 flex items-center gap-2 md:gap-3 shadow-lg">
                            <MapPin className="text-white w-5 h-5 md:w-6 md:h-6 shrink-0" />
                            <div className="flex flex-col text-left">
                              <span className="text-white font-medium text-[16px] md:text-[22px] leading-tight">
                                {orderData?.property_address ||
                                  orderData?.property?.address}
                              </span>
                              <span className="text-white/80 text-xs md:text-[15px] leading-tight mt-1">
                                {orderData?.property_location ||
                                  `${orderData?.property?.city}, ${orderData?.property?.province}`}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "Overview" && (
                <div className="pt-[80px] px-4 md:px-12 flex flex-col gap-10 max-w-5xl mx-auto w-full pb-12">
                  {/* Property Stats Icons */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-4 py-6 text-center text-sm">
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
                        label: "SQUARE FOOTAGE",
                        value: orderData?.property.square_footage
                          ? `${orderData?.property.square_footage}FT²`
                          : null,
                        icon: <HomeIcon />,
                      },
                      {
                        label: "LOT SIZE",
                        value: orderData?.property.lot_size
                          ? `${orderData?.property.lot_size}FT²`
                          : null,
                        icon: <LotIcon />,
                      },
                      {
                        label: "YEAR BUILT",
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

                  <hr className="border-gray-200" />

                  {/* Agent Contact + About Property */}
                  <div className="flex flex-col md:flex-row gap-6 md:gap-10">
                    {activeTourType !== "unbranded" && (
                      <div className="flex flex-col gap-5 items-start w-full md:w-[350px]">
                        {orderData?.agent.logo_url ? (
                          <div className="bg-[#ccc] w-[250px] aspect-square rounded-lg flex items-center justify-center overflow-hidden mx-auto md:mx-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={orderData.agent.logo_url}
                              alt="Agent"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                                const parent = e.currentTarget.parentElement;
                                if (parent) parent.style.display = "none";
                              }}
                            />
                          </div>
                        ) : null}
                        <div className="text-left w-full flex flex-col gap-[12px] items-center md:items-start">
                          <div className="text-[#424242] text-[16px] font-alexandria font-semibold">
                            Contact
                          </div>
                          <div className="text-[#424242] text-[20px] font-alexandria font-light text-center md:text-left">
                            {orderData?.agent.first_name}{" "}
                            {orderData?.agent.last_name}
                          </div>
                          <div className="text-[#424242] text-[20px] font-alexandria font-light text-center md:text-left">
                            {orderData?.agent.company_name || "Company Name"}
                          </div>
                          {orderData?.agent.primary_phone && (
                            <a
                              href={`tel:${orderData.agent.primary_phone}`}
                              className="text-[20px] font-alexandria font-light text-center md:text-left"
                              style={{ color: roleSettings.pageTabColor }}
                            >
                              {orderData.agent.primary_phone}
                            </a>
                          )}
                          {orderData?.agent.website && (
                            <a
                              href={orderData.agent.website}
                              className="text-[20px] font-alexandria font-light text-center md:text-left break-all"
                              style={{ color: roleSettings.pageTabColor }}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {orderData.agent.website}
                            </a>
                          )}
                          <div className="flex gap-3 justify-center md:justify-start">
                            {orderData?.agent.primary_phone && (
                              <a href={`tel:${orderData.agent.primary_phone}`}>
                                <Phone className="text-[#7D7D7D]" />
                              </a>
                            )}
                            {orderData?.agent.email && (
                              <a href={`mailto:${orderData.agent.email}`}>
                                <Mail className="text-[#7D7D7D]" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="flex flex-col md:flex-1 justify-between gap-7 h-fit w-full">
                      <div className="flex flex-col gap-4">
                        <h2 className="text-md font-semibold text-[#424242] font-alexandria text-center md:text-left">
                          ABOUT THE PROPERTY
                        </h2>
                        <p className="text-sm text-gray-600 text-center md:text-left">
                          {orderData?.property.description ||
                            "No description available."}
                        </p>
                        <div className="flex flex-wrap gap-3 justify-center md:justify-start">
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
                                    className="w-max hover:opacity-90 text-white"
                                    style={{
                                      backgroundColor:
                                        roleSettings.pageTabColor,
                                    }}
                                    onClick={() => {
                                      const sheet =
                                        listingSheets[listingSheets.length - 1];
                                      if (
                                        sheet.type === "pdf" &&
                                        sheet.pdf_url
                                      ) {
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
                                    className="w-max hover:opacity-90 text-white"
                                    style={{
                                      backgroundColor:
                                        roleSettings.pageTabColor,
                                    }}
                                    onClick={() => {
                                      const sheet =
                                        tabloidSheets[tabloidSheets.length - 1];
                                      if (
                                        sheet.type === "pdf" &&
                                        sheet.pdf_url
                                      ) {
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
                  </div>

                  <hr className="border-gray-200" />

                  {/* Share icons */}
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-sm font-semibold text-gray-500 italic">
                      Share
                    </span>
                    <div className="flex items-center gap-3">
                      <a
                        href={`mailto:?subject=${encodeURIComponent(orderData?.property_address || "")}&body=${encodeURIComponent(currentPath)}`}
                        className="w-10 h-10 rounded-full bg-[#1b365d] flex items-center justify-center text-white hover:opacity-90 transition-opacity"
                        title="Share via Email"
                      >
                        <Mail size={18} />
                      </a>
                      <a
                        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentPath)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 rounded-full bg-[#1b365d] flex items-center justify-center text-white hover:opacity-90 transition-opacity"
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
                        className="w-10 h-10 rounded-full bg-[#1b365d] flex items-center justify-center text-white hover:opacity-90 transition-opacity"
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
                        className="w-10 h-10 rounded-full bg-[#1b365d] flex items-center justify-center text-white hover:opacity-90 transition-opacity"
                        title="Share"
                      >
                        <span className="text-xl font-bold">+</span>
                      </button>
                    </div>
                  </div>

                  <hr className="border-gray-200" />

                  {/* Neighborhood */}
                  <div className="flex flex-col gap-4">
                    <h3 className="text-center text-xl font-semibold text-[#424242]">
                      Neighborhood
                    </h3>
                    <div className="w-full h-[350px] bg-gray-100 rounded-lg overflow-hidden border border-gray-200 relative">
                      <iframe
                        src={`https://maps.google.com/maps?q=${encodeURIComponent(`${orderData?.property.address || ""}, ${orderData?.property.city || ""}, ${orderData?.property.province || ""}`)}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
                        className="w-full h-full border-0"
                        allowFullScreen
                        loading="lazy"
                      />
                    </div>
                  </div>

                  <hr className="border-gray-200" />

                  {/* Map */}
                  <div className="flex flex-col gap-4">
                    <h3 className="text-center text-xl font-semibold text-[#424242]">
                      Map
                    </h3>
                    <div className="w-full h-[400px] bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
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
                <div className="pt-[80px] px-4 md:px-12 flex flex-col items-center gap-8 max-w-4xl mx-auto w-full pb-16">
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

                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          toast.info("Showing all tours for this agent");
                        }}
                        className="text-sm text-gray-600 hover:underline underline"
                      >
                        View All My Tours
                      </a>

                      {/* Company name styled */}
                      <div className="mt-1 flex items-center">
                        <span className="text-base font-bold tracking-wider text-[#d92525]">
                          {orderData?.agent.company_name?.toUpperCase() || ""}
                        </span>
                      </div>

                      {/* Email + Phone action buttons */}
                      <div className="flex flex-col sm:flex-row gap-3 mt-4">
                        {orderData?.agent.email && (
                          <a
                            href={`mailto:${orderData.agent.email}?subject=Inquiry about ${encodeURIComponent(orderData?.property_address || "Property")}`}
                            className="inline-flex items-center gap-2 bg-[#1b365d] text-white px-5 py-2.5 rounded-full font-medium shadow-sm hover:bg-[#132744] transition-colors"
                          >
                            <Mail size={16} />
                            <span>{orderData.agent.email}</span>
                          </a>
                        )}
                        {orderData?.agent.primary_phone && (
                          <a
                            href={`tel:${orderData.agent.primary_phone}`}
                            className="inline-flex items-center gap-2 bg-[#1b365d] text-white px-5 py-2.5 rounded-full font-medium shadow-sm hover:bg-[#132744] transition-colors"
                          >
                            <Phone size={16} />
                            <span>{orderData.agent.primary_phone}</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {activeTab === "Photos" && (
                <div className="">
                  {uploadedImages.length > 0 ||
                  (currentTourPhotos?.length ?? 0) > 0 ? (
                    <>
                      <CustomSlideshow
                        className={
                          isPublicView
                            ? "h-[70vh] md:h-[100vh]"
                            : "h-[45vh] sm:h-[636px]"
                        }
                        images={uploadedImages}
                        delay={delay}
                        transition={transition}
                        audioUrl={audioUrl}
                        api_images={currentTourPhotos}
                        currentIndex={currentImageIndex}
                        onSlideChange={(index) => {
                          setCurrentImageIndex(index);
                          if (
                            isPublicView &&
                            onMediaView &&
                            currentTourPhotos?.[index - uploadedImages.length]
                          ) {
                            onMediaView(
                              currentTourPhotos[index - uploadedImages.length]
                                .uuid,
                            );
                          }
                        }}
                        externalAudioControl={isPublicView ? true : undefined}
                        propIsPlaying={isAudioPlaying}
                        propIsMuted={isAudioMuted}
                        propSetIsPlaying={setIsAudioPlaying}
                        propSetIsMuted={setIsAudioMuted}
                        watermarkUrl={actualWatermarkLogo}
                      />

                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-6 md:mt-12 px-4 md:px-6">
                        {uploadedImages.map((image, index) => (
                          <div
                            key={`uploaded-${index}`}
                            className={`w-full aspect-video bg-black overflow-hidden cursor-pointer transition-all ${currentImageIndex === index ? "ring-2 ring-[#4290E9] ring-offset-1" : ""}`}
                            onClick={() => setCurrentImageIndex(index)}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={URL.createObjectURL(image.file)}
                              alt={`Uploaded ${index + 1}`}
                              className="w-full h-full object-contain"
                            />
                          </div>
                        ))}
                        {currentTourPhotos?.map((image, index) => {
                          const globalIndex = uploadedImages.length + index;
                          return (
                            <div
                              key={`api-${index}`}
                              className={`w-full aspect-video bg-black overflow-hidden cursor-pointer transition-all ${currentImageIndex === globalIndex ? "ring-2 ring-[#4290E9] ring-offset-1" : ""}`}
                              onClick={() => setCurrentImageIndex(globalIndex)}
                            >
                              {image.is_processing ? (
                                <div className="w-full h-full flex flex-col gap-2 items-center justify-center bg-gray-200">
                                  <p className="text-gray-500 font-medium text-10px">
                                    Processing...
                                  </p>
                                </div>
                              ) : (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img
                                  src={
                                    image.variant_urls?.thumb ||
                                    image.url ||
                                    `${API_URL}/${image.file_path}`
                                  }
                                  alt={`Uploaded ${index + 1}`}
                                  className="w-full h-full object-contain"
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
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
                <div className="w-full ">
                  <div className="p-0 pt-0">
                    {/* Main video preview */}
                    {mainVideo && (
                      <div className="mb-6 h-[50vh] sm:h-[95vh] w-full bg-black overflow-hidden relative">
                        <video
                          src={mainVideo || undefined}
                          className="w-full h-full object-contain"
                          controls
                        />
                        {actualWatermarkLogo && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={actualWatermarkLogo}
                            alt="Watermark"
                            className="absolute bottom-12 right-6 w-[120px] object-contain opacity-60 pointer-events-none z-10 drop-shadow-md"
                          />
                        )}
                      </div>
                    )}

                    {/* Local uploaded videos */}
                    {selectedVideoFiles.length > 0 ||
                    (currentVideoFiles?.length ?? 0) > 0 ? (
                      <div className="mt-4 w-full grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-5 p-2 md:p-3">
                        {selectedVideoFiles.map((file, idx) => {
                          const thumbSrc = URL.createObjectURL(file.file);
                          return (
                            <div
                              key={idx}
                              onClick={() => setMainVideo(thumbSrc)}
                              className="h-auto relative"
                            >
                              <div className="relative w-full h-[180px] sm:h-[240px] cursor-pointer bg-black overflow-hidden">
                                <video
                                  src={thumbSrc}
                                  className="w-full h-full object-contain"
                                />
                              </div>
                            </div>
                          );
                        })}
                        {currentVideoFiles?.map((file, idx) => {
                          const apiSrc =
                            file.url || `${API_URL}/${file.file_path}`;
                          return (
                            <div key={idx} className="h-auto relative">
                              <div className="relative w-full h-[180px] sm:h-[240px] cursor-pointer bg-black overflow-hidden">
                                {file.is_processing ? (
                                  <div className="w-full h-full flex flex-col gap-2 items-center justify-center bg-gray-200">
                                    <p className="text-gray-500 font-medium text-sm">
                                      Processing...
                                    </p>
                                  </div>
                                ) : (
                                  <>
                                    {file.variant_urls?.thumb ? (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img
                                        src={file.variant_urls.thumb}
                                        alt="Video thumbnail"
                                        className="w-full h-full object-contain"
                                        onClick={() => setMainVideo(apiSrc)}
                                      />
                                    ) : (
                                      <video
                                        src={apiSrc}
                                        className="w-full h-full object-contain"
                                        onClick={() => setMainVideo(apiSrc)}
                                      />
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })}
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
                </div>
              )}

              {activeTab === "Floorplan" && (
                <div className="w-full pt-[80px]">
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
                className="w-full pt-[80px]"
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
