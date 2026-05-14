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
  CircleArrowLeft,
  CircleArrowRight,
  Mail,
  Phone,
} from "lucide-react";
import { useFileManagerContext } from "../FileManagerContext";
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
import DynamicMap from "@/components/DYnamicMap";
import CustomSlideshow from "./CustomPreview";
import TourFloorPlans from "./TourFloorPlans";
import TourActivityDialog from "./TourActivityDialog";

interface TourConfimation {
  orderData: Order | null;
}

import { useAppContext } from "@/app/context/AppContext";
import { PublishTour } from "../file-manager";
import { toast } from "sonner";
import ConfirmationDialog from "@/components/ConfirmationDialog";

const TourConfirm = ({ orderData }: TourConfimation) => {
  const { userType } = useAppContext();
  const { selectedFiles, delay, transition, audioUrl, links, filesData } =
    useFileManagerContext();
  const uploadedImages = selectedFiles?.filter((f) => f.upload) || [];
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState("Home");
  const { selectedVideoFiles } = useFileManagerContext();
  const [mainVideo, setMainVideo] = useState<string | null>(null);
  // const [confirmFloor, setConfirmFloor] = useState(false);
  const [open, setOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showAgain, setShowAgain] = useState(true);

  useEffect(() => {
    if (filesData) {
      // @ts-expect-error: is_publish might not be in the type definition but is present in the API response
      setIsPublished(!!filesData.is_publish);
    }
  }, [filesData]);

  let currentTourPhotos = filesData?.files?.filter(file => file?.service?.name !== '2D Floor Plans' && file?.service?.name !== '3D Floor Plans' && file.type === "photo");

  const API_URL = process.env.NEXT_PUBLIC_FILES_API_URL;

  let currentVideoFiles = filesData?.files?.filter(file => file.type === "video");

  if (userType === 'agent') {
    currentTourPhotos = currentTourPhotos?.filter(file => file.is_admin_approved);
    currentVideoFiles = currentVideoFiles?.filter(file => file.is_admin_approved);
  }
  const currentPath = window.location.href;

  function getMainURL(url: string) {
    try {
      const urlObj = new URL(url);
      return `${urlObj.protocol}//${urlObj.host}`;
    } catch (error) {
      console.error('Invalid URL:', error);
      return null;
    }
  }
  const mainUrl = getMainURL(currentPath);
  console.log('mainUrl', mainUrl);

  const handlePrev = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? uploadedImages.length - 1 : prev - 1
    );
  };

  const handleNext = () => {
    setCurrentImageIndex((prev) =>
      prev === uploadedImages.length - 1 ? 0 : prev + 1
    );
  };

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
        setMainVideo(`${API_URL}/${currentVideoFiles[0].file_path}`);
      }
    }
  }, [selectedVideoFiles, currentVideoFiles, mainVideo, API_URL]);

  const hasPhotos = orderData?.services.some(s => s.service.name.toLowerCase().includes('photo'));
  const hasVideos = orderData?.services.some(s => s.service.name.toLowerCase().includes('video') || s.service.name.toLowerCase().includes('reel'));
  const hasMatterport = orderData?.services.some(s => s.service.name.toLowerCase().includes('matterport') || s.service.name.toLowerCase().includes('3d tour'));
  const hasFloorPlans = orderData?.services.some(s => s.service.name.toLowerCase().includes('floor plan'));

  const previewTabs = React.useMemo(() => {
    const tabs = ['Home'];
    if (hasPhotos) tabs.push('Photos');
    if (hasVideos) tabs.push('Videos');
    if (hasFloorPlans) tabs.push('Floorplan');
    if (hasMatterport) tabs.push('Matterport');
    return tabs;
  }, [hasPhotos, hasVideos, hasFloorPlans, hasMatterport]);

  useEffect(() => {
    if (!previewTabs.includes(activeTab)) {
      setActiveTab('Home');
    }
  }, [previewTabs, activeTab]);

  const brandedLinks = links.filter(l => l.type === 'branded');
  const unbrandedLinks = links.filter(l => l.type === 'unbranded');

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
      if (nextStatus && userType !== 'admin' && orderData?.payment_status !== 'PAID') {
        toast.error("This order must be paid in full before the tour can be published.");
        setIsPublishing(false);
        return;
      }

      await PublishTour(token, tourUuid, nextStatus);
      setIsPublished(nextStatus);
      toast.success(nextStatus ? "Tour published successfully!" : "Tour unpublished successfully!");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "An error occurred while updating the tour status."
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
      .replace(/\s+/g, '-')     // Replace spaces with -
      .replace(/[^\w-]+/g, '')    // Remove all non-word chars
      .replace(/--+/g, '-')      // Replace multiple - with single -
      .replace(/^-+/, '')        // Trim - from start of text
      .replace(/-+$/, '');       // Trim - from end of text
  };

  const tourUrl = `${mainUrl}/tour/${slugify(orderData?.property_address || "")}-${slugify(orderData?.property_location || "")}/${orderData?.uuid}`;

  return (
    <div className="w-full font-alexandria">
      {/* Tour Link Input */}
      {tourUuid && (
        <div className="flex  items-center justify-center py-4">
          <div className="flex flex-col gap-4 ">
            <div className="">Tour Link</div>
            <div className="flex justify-between">
              <Input
                type="text"
                value={tourUrl}
                className=" w-[410px] border border-[#8E8E8E] text-[#666666]"
                readOnly
              />
              <a
                target="_blank"
                href={tourUrl}
                className="w-fit px-3 bg-[#6BAE41] h-[35px] text-[14px] rounded-[8px] flex items-center justify-center gap-2 text-white ml-4">
                <span>View Tour</span> <UploadRightIcon size={18} />
              </a>
            </div>
            <div className="flex items-center gap-x-3">
              <Button
                onClick={handlePostTour}
                disabled={isPublishing}
                className={`w-[185px] transition-all duration-300 ${isPublished ? `${userType}-bg hover:bg-blue-500` : "bg-[#6BAE41]"}`}
              >
                {isPublishing ? "Updating..." : isPublished ? "Unpublish Tour" : "Post Tour"}
              </Button>
              <Button onClick={() => setOpen(true)} className={`w-[100px] ${userType}-bg hover:bg-blue-600`}>Stats</Button>
            </div>

          </div>
        </div>
      )}
      <Accordion type="single" defaultValue="Preview" className="w-full">
        <AccordionItem value="Preview">
          <AccordionTrigger className="px-[14px] py-[19px] border-t border-b border-[#BBBBBB] h-[60px] bg-[#E4E4E4] text-[#4290E9] text-[18px] font-semibold uppercase [&>svg]:text-[#4290E9] [&>svg]:w-6 [&>svg]:h-6 [&>svg]:stroke-2">
            Preview
          </AccordionTrigger>
          <AccordionContent>
            <div className="w-full flex flex-col gap-6 px-6 pb-6 relative ">
              {/* Tabs */}
              <div className="flex justify-center space-x-4 py-2 absolute top-3 z-30 place-self-center">
                {previewTabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`text-[13px] w-[179px] font-bold  px-4 py-2 rounded-md uppercase ${activeTab === tab
                      ? `${userType}-bg text-white`
                      : "bg-gray-200 text-[#666666]"
                      }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {activeTab === "Home" && (
                <div>
                  {uploadedImages.length > 0 && (
                    <div className="relative w-full h-[636px]  overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={URL.createObjectURL(
                          uploadedImages[currentImageIndex].file
                        )}
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

                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-4 px-4 py-12 mt-10 text-center text-sm">
                    {[
                      {
                        label: "PRICE",
                        value: `$${orderData?.property.listing_price}`,
                        icon: <PriceTag />,
                      },
                      {
                        label: "BEDS",
                        value: `${orderData?.property.bedrooms}`,
                        icon: <BedIcon />,
                      },
                      {
                        label: "BATHS",
                        value: `${orderData?.property.bathrooms}`,
                        icon: <BathIcon />,
                      },
                      {
                        label: "SQUARE FOOTAGE",
                        value: `${orderData?.property.square_footage}FT²`,
                        icon: <HomeIcon />,
                      },
                      {
                        label: "LOT SIZE",
                        value: `${orderData?.property.lot_size}FT²`,
                        icon: <LotIcon />,
                      },
                      {
                        label: "YEAR BUILT",
                        value: `${orderData?.property.year_constructed}`,
                        icon: <HelpIcon />,
                      },
                      {
                        label: "TYPE",
                        value: `${orderData?.property.property_type}`,
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

                  <div className="flex gap-10">
                    <div className="flex flex-col gap-5 items-center w-[350px]">
                      <div className="bg-[#ccc]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={
                            orderData?.agent.avatar_url || "/default-avatar.png"
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
                          {orderData?.agent.first_name}{" "}
                          {orderData?.agent.last_name}
                        </div>
                        <div className="text-[#424242] text-[20px] font-alexandria font-light">
                          {orderData?.agent.company_name || "Company Name"}
                        </div>
                        {orderData?.agent.primary_phone && (
                          <a
                            href={`tel:${orderData.agent.primary_phone}`}
                            className="text-[#4290E9] text-[20px] font-alexandria font-light"
                          >
                            {orderData.agent.primary_phone}
                          </a>
                        )}
                        {orderData?.agent.website && (
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
                          {orderData?.agent.primary_phone && (
                            <a
                              href={`tel:${orderData.agent.primary_phone}`}
                              className=""
                            >
                              <Phone className="text-[#7D7D7D]" />
                            </a>
                          )}
                          {orderData?.agent.email && (
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
                          Lorem ipsum dolor sit amet, consectetur adipiscing
                          elit, sed do eiusmod tempor incididunt ut labore et
                          dolore magna aliqua. Ut enim ad minim veniam, quis
                          nostrud exercitation ullamco laboris nisi ut aliquip
                          ex ea commodo consequat. Duis aute irure dolor in
                          reprehenderit in voluptate velit esse cillum dolore eu
                          fugiat nulla pariatur. Excepteur sint occaecat
                          cupidatat non proident, sunt in culpa qui officia
                          deserunt mollit anim id est laborum.
                        </p>
                        <Button className="w-max bg-[#4290E9]">
                          View Feature Sheet
                        </Button>
                      </div>

                      <div className="w-[800px] h-[300px]">
                        <DynamicMap
                          address={orderData?.property.address}
                          city={orderData?.property.city}
                          province={orderData?.property.province}
                          country={orderData?.property.country}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {activeTab === "Photos" && (
                <div className="">
                  {(uploadedImages.length > 0 || (currentTourPhotos?.length ?? 0) > 0) ? (
                    <>
                      <CustomSlideshow
                        images={uploadedImages}
                        delay={delay}
                        transition={transition}
                        audioUrl={audioUrl}
                        api_images={currentTourPhotos}
                      />

                      <div className="grid grid-cols-6 gap-2 mt-4">
                        {uploadedImages.map((image, index) => (
                          <div key={`uploaded-${index}`} className="w-full aspect-square overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={URL.createObjectURL(image.file)}
                              alt={`Uploaded ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                        {currentTourPhotos?.map((image, index) => (
                          <div key={`api-${index}`} className="w-full aspect-square overflow-hidden">
                            {image.is_processing ? (
                              <div className="w-full h-full flex flex-col gap-2 items-center justify-center bg-gray-200">
                                <p className="text-gray-500 font-medium text-10px">Processing...</p>
                              </div>
                            ) : (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img
                                src={image.variant_urls?.thumb || image.url || `${API_URL}/${image.file_path}`}
                                alt={`Uploaded ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="font-alexandria w-full h-[50vh] text-gray-500 flex justify-center items-center">
                      <p>No photos found — please upload photos or select a photo service.</p>
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

                    {/* Local uploaded videos */}
                    {(selectedVideoFiles.length > 0 || (currentVideoFiles?.length ?? 0) > 0) ? (
                      <div className="mt-4 w-full grid grid-cols-3 gap-5 p-3">
                        {selectedVideoFiles.map((file, idx) => {
                          const thumbSrc = URL.createObjectURL(file.file);
                          return (
                            <div
                              key={idx}
                              onClick={() => setMainVideo(thumbSrc)}
                              className="h-auto relative"
                            >
                              <div className="relative w-full h-[240px] cursor-pointer">
                                <video
                                  src={thumbSrc}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            </div>
                          );
                        })}
                        {currentVideoFiles?.map((file, idx) => {
                          const apiSrc = file.url || `${API_URL}/${file.file_path}`;
                          return (
                            <div
                              key={idx}
                              className="h-auto relative"
                            >
                              <div className="relative w-full h-[240px] cursor-pointer">
                                {file.is_processing ? (
                                  <div className="w-full h-full flex flex-col gap-2 items-center justify-center bg-gray-200">
                                    <p className="text-gray-500 font-medium text-sm">Processing...</p>
                                  </div>
                                ) : (
                                  <>
                                    {file.variant_urls?.thumb ? (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img
                                        src={file.variant_urls.thumb}
                                        alt="Video thumbnail"
                                        className="w-full h-full object-cover"
                                        onClick={() => setMainVideo(apiSrc)}
                                      />
                                    ) : (
                                      <video
                                        src={apiSrc}
                                        className="w-full h-full object-cover"
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
                    ) :
                      <div className="font-alexandria w-full h-[50vh] text-gray-500 flex justify-center items-center">
                        <p>No Video found — please add Video or select a Video service.</p>
                      </div>}

                  </div>
                </div>
              )}

              {activeTab === "Floorplan" && (
                <div className="w-full">
                  <TourFloorPlans type="confirm" />
                </div>
              )}
              {activeTab === "Matterport" && (
                <div className="w-full flex flex-col items-center gap-10">
                  {(!brandedLinks?.length && !unbrandedLinks?.length) ? (
                    <div className="font-alexandria w-full h-[50vh] text-gray-500 flex justify-center items-center">
                      <p>No Matterport links found — please add links or select a Matterport service.</p>
                    </div>
                  ) : (
                    <>
                      {brandedLinks?.map(
                        (link, idx) =>
                          isValidUrl(link.link) && (
                            <iframe
                              key={`preview-branded-${idx}`}
                              src={link.link}
                              className="w-[80%] h-[500px] border"
                              allowFullScreen
                            ></iframe>
                          )
                      )}
                      {unbrandedLinks?.map(
                        (link, idx) =>
                          isValidUrl(link.link) && (
                            <iframe
                              key={`preview-unbranded-${idx}`}
                              src={link.link}
                              className="w-[80%] h-[500px] border"
                              allowFullScreen
                            ></iframe>
                          )
                      )}
                    </>
                  )}
                </div>
              )}

            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      <TourActivityDialog
        open={open}
        onOpenChange={setOpen}
        tourUuid={orderData?.tours?.[0]?.uuid || ''}
        propertyAddress={`${orderData?.property.address}, ${orderData?.property.city}, ${orderData?.property.province}`}
      />
    </div>
  );
};

export default TourConfirm;
