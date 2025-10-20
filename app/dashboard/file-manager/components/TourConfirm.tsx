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
import { useFileManagerContext } from "../FileManagerContext ";
import {
  BathIcon,
  BedIcon,
  HelpIcon,
  HomeIcon,
  LotIcon,
  PriceTag,
  TypoeIcon,
} from "@/components/Icons";
import { Order } from "../../orders/page";
import DynamicMap from "@/components/DYnamicMap";
import CustomSlideshow from "./CustomPreview";
import TourFloorPlans from "./TourFloorPlans";
import TourActivityDialog from "./TourActivityDialog";

interface TourConfimation {
  orderData: Order | null;
}

const TourConfirm = ({ orderData }: TourConfimation) => {
  const { selectedFiles, delay, transition, audioUrl, links, filesData } =
    useFileManagerContext();
  console.log(orderData);
  const uploadedImages = selectedFiles?.filter((f) => f.upload) || [];
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState("Home");
  const { selectedVideoFiles } = useFileManagerContext();
  const [mainVideo, setMainVideo] = useState<string | null>(null);
  // const [confirmFloor, setConfirmFloor] = useState(false);
  const [open, setOpen] = useState(false);
  const currentTourPhotos = filesData?.files?.filter(file => file?.service?.name !== '2D Floor Plans' && file?.service?.name !== '3D Floor Plans' && file.type === "photo");

  const API_URL = process.env.NEXT_PUBLIC_FILES_API_URL;

  const currentVideoFiles = filesData?.files?.filter(file => file.type === "video");


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

  const brandedLinks = links.filter(l => l.type === 'branded');
  const unbrandedLinks = links.filter(l => l.type === 'unbranded');
  return (
    <div className="w-full">
      {/* Tour Link Input */}
      <div className="flex  items-center justify-center py-4">
        <div className="flex flex-col gap-4 ">
          <div className="">Tour Link</div>
          <Input
            type="text"
            value="Tour.link@linkns.com/235263"
            className=" w-[410px] border border-[#8E8E8E] text-[#666666]"
            readOnly
          />
          <div className="flex items-center gap-x-3">
            <Button className="w-[185px] bg-[#6BAE41]">Post Tour</Button>
            <Button onClick={() => setOpen(true)} className="w-[100px] bg-[#4290E9]">Stats</Button>
          </div>

        </div>
      </div>
      <Accordion type="single" defaultValue="Preview" className="w-full">
        <AccordionItem value="Preview">
          <AccordionTrigger className="px-[14px] py-[19px] border-t border-b border-[#BBBBBB] h-[60px] bg-[#E4E4E4] text-[#4290E9] text-[18px] font-semibold uppercase [&>svg]:text-[#4290E9] [&>svg]:w-6 [&>svg]:h-6 [&>svg]:stroke-2">
            Preview
          </AccordionTrigger>
          <AccordionContent>
            <div className="w-full flex flex-col gap-6 px-6 pb-6 relative ">
              {/* Tabs */}
              <div className="flex justify-center space-x-4 py-2 absolute top-3 z-50 place-self-center">
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

                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-4 px-4 py-12 text-center text-sm">
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

                  <CustomSlideshow
                    images={uploadedImages}
                    delay={delay}
                    transition={transition}
                    audioUrl={audioUrl}
                    api_images={currentTourPhotos}
                  />
                  {(uploadedImages.length > 0 || (currentTourPhotos?.length ?? 0) > 0) && (
                    <div className="grid grid-cols-6 gap-2 mt-4">
                      {uploadedImages.map((image, index) => (
                        <div
                          key={index}
                          className="w-full aspect-square overflow-hidden"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={URL.createObjectURL(image.file)}
                            alt={`Uploaded ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                      {currentTourPhotos?.map((image, index) => (
                        <div
                          key={index}
                          className="w-full aspect-square overflow-hidden"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={`${API_URL}/${image.file_path}`}
                            alt={`Uploaded ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {activeTab === "Videos" && (
                <div className="w-full ">
                  <div className="p-4 pt-0">
                    {/* Main video preview */}
                    <div className="mb-6 h-[95vh] w-full bg-black overflow-hidden">
                      <video
                        src={mainVideo || undefined}
                        className="w-full h-full object-contain"
                        controls
                      />
                    </div>

                    {/* Local uploaded videos */}
                    {(selectedVideoFiles.length > 0 || (currentVideoFiles?.length ?? 0) > 0) && (
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
                          const apiSrc = `${API_URL}/${file.file_path}`;
                          return (
                            <div
                              key={idx}
                              onClick={() => setMainVideo(apiSrc)}
                              className="h-auto relative"
                            >
                              <div className="relative w-full h-[240px] cursor-pointer">
                                <video
                                  src={apiSrc}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

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
                  {brandedLinks.map(
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

                  {unbrandedLinks.map(
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
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      <TourActivityDialog open={open} onOpenChange={setOpen} />
    </div>
  );
};

export default TourConfirm;
