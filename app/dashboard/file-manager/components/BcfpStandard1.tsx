import {
  Bathrooms,
  Bedrooms,
  LinkedIcon,
  Parking,
  ReltorIcon,
  UtilitiesIncluded,
} from "@/components/Icons";
import { AvatarFallback } from "@/components/ui/avatar";
import { Avatar, AvatarImage } from "@radix-ui/react-avatar";
import { Mail, Pencil, Phone, Trash2, ZoomIn, ZoomOut } from "lucide-react";
import Image from "next/image";
import React, { useRef, useState } from "react";
import { Order } from "../../orders/page";
import FileManagerGallery from "./fileManagerGallery";
import ImageSourceModal from "./ImageSourceModal";

interface BcfpStandard {
  orderData: Order | null;
}
const BcfpStandard1 = ({ orderData }: BcfpStandard) => {
  // const { formData } = useFileManagerContext();
  // --- images States ---
  const [images, setImages] = useState({
    image1: null as string | null,
    image2: null as string | null,
    image3: null as string | null,
    image4: null as string | null,
    image5: null as string | null,
    image6: null as string | null,
    image7: null as string | null,
    image8: null as string | null,
    image9: null as string | null,
    image10: null as string | null,
    image11: null as string | null,
    image12: null as string | null,
    image13: null as string | null,
    image14: null as string | null,
    image15: null as string | null,
    image16: null as string | null,
    image17: null as string | null,
    image18: null as string | null,
  });

  const [scale, setScale] = useState({
    image1: 1,
    image2: 1,
    image3: 1,
    image4: 1,
    image5: 1,
    image6: 1,
    image7: 1,
    image8: 1,
    image9: 1,
    image10: 1,
    image11: 1,
    image12: 1,
    image13: 1,
    image14: 1,
    image15: 1,
    image16: 1,
    image17: 1,
    image18: 1,
  });

  const [position, setPosition] = useState({
    image1: { x: 0, y: 0 },
    image2: { x: 0, y: 0 },
    image3: { x: 0, y: 0 },
    image4: { x: 0, y: 0 },
    image5: { x: 0, y: 0 },
    image6: { x: 0, y: 0 },
    image7: { x: 0, y: 0 },
    image8: { x: 0, y: 0 },
    image9: { x: 0, y: 0 },
    image10: { x: 0, y: 0 },
    image11: { x: 0, y: 0 },
    image12: { x: 0, y: 0 },
    image13: { x: 0, y: 0 },
    image14: { x: 0, y: 0 },
    image15: { x: 0, y: 0 },
    image16: { x: 0, y: 0 },
    image17: { x: 0, y: 0 },
    image18: { x: 0, y: 0 },
  });

  const [dragging, setDragging] = useState({
    image1: false,
    image2: false,
    image3: false,
    image4: false,
    image5: false,
    image6: false,
    image7: false,
    image8: false,
    image9: false,
    image10: false,
    image11: false,
    image12: false,
    image13: false,
    image14: false,
    image15: false,
    image16: false,
    image17: false,
    image18: false,
  });

  const lastPosition = useRef({
    image1: { x: 0, y: 0 },
    image2: { x: 0, y: 0 },
    image3: { x: 0, y: 0 },
    image4: { x: 0, y: 0 },
    image5: { x: 0, y: 0 },
    image6: { x: 0, y: 0 },
    image7: { x: 0, y: 0 },
    image8: { x: 0, y: 0 },
    image9: { x: 0, y: 0 },
    image10: { x: 0, y: 0 },
    image11: { x: 0, y: 0 },
    image12: { x: 0, y: 0 },
    image13: { x: 0, y: 0 },
    image14: { x: 0, y: 0 },
    image15: { x: 0, y: 0 },
    image16: { x: 0, y: 0 },
    image17: { x: 0, y: 0 },
    image18: { x: 0, y: 0 },
  });
  const [showImageSourceModal, setShowImageSourceModal] = useState(false);
  const [currentImageSlot, setCurrentImageSlot] = useState<string | null>(null);
  const [showGallery, setShowGallery] = useState(false);
  // --- Refs ---
  const fileInputRef1 = useRef<HTMLInputElement | null>(null);
  const fileInputRef2 = useRef<HTMLInputElement | null>(null);
  const fileInputRef3 = useRef<HTMLInputElement | null>(null);
  const fileInputRef4 = useRef<HTMLInputElement | null>(null);
  const fileInputRef5 = useRef<HTMLInputElement | null>(null);
  const fileInputRef6 = useRef<HTMLInputElement | null>(null);
  const fileInputRef7 = useRef<HTMLInputElement | null>(null);
  const fileInputRef8 = useRef<HTMLInputElement | null>(null);
  const fileInputRef9 = useRef<HTMLInputElement | null>(null);
  const fileInputRef10 = useRef<HTMLInputElement | null>(null);
  const fileInputRef11 = useRef<HTMLInputElement | null>(null);
  const fileInputRef12 = useRef<HTMLInputElement | null>(null);
  const fileInputRef13 = useRef<HTMLInputElement | null>(null);
  const fileInputRef14 = useRef<HTMLInputElement | null>(null);
  const fileInputRef15 = useRef<HTMLInputElement | null>(null);
  const fileInputRef16 = useRef<HTMLInputElement | null>(null);
  const fileInputRef17 = useRef<HTMLInputElement | null>(null);
  const fileInputRef18 = useRef<HTMLInputElement | null>(null);

  // --- Handlers ---
  const handleImageChange = (
    key: keyof typeof images,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      setImages((prev) => ({ ...prev, [key]: url }));
    }
  };

  const handleDelete = (
    key: keyof typeof images,
    ref: React.RefObject<HTMLInputElement | null>
  ) => {
    setImages((prev) => ({ ...prev, [key]: null }));
    setScale((prev) => ({ ...prev, [key]: 1 }));
    setPosition((prev) => ({ ...prev, [key]: { x: 0, y: 0 } }));
    if (ref.current) ref.current.value = "";
  };

  const handleZoom = (key: keyof typeof images, direction: "in" | "out") => {
    setScale((prev) => {
      const newScale = direction === "in" ? prev[key] + 0.1 : prev[key] - 0.1;
      const bounded = Math.min(Math.max(newScale, 1), 3);
      if (bounded <= 1) {
        setPosition((p) => ({ ...p, [key]: { x: 0, y: 0 } }));
      }
      return { ...prev, [key]: bounded };
    });
  };

  const handleMouseDown = (key: keyof typeof images, e: React.MouseEvent) => {
    if (scale[key] <= 1) return;
    setDragging((prev) => ({ ...prev, [key]: true }));
    lastPosition.current[key] = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (key: keyof typeof images, e: React.MouseEvent) => {
    if (!dragging[key]) return;
    const dx = e.clientX - lastPosition.current[key].x;
    const dy = e.clientY - lastPosition.current[key].y;

    setPosition((prev) => ({
      ...prev,
      [key]: { x: prev[key].x + dx, y: prev[key].y + dy },
    }));

    lastPosition.current[key] = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = (key: keyof typeof images) => {
    setDragging((prev) => ({ ...prev, [key]: false }));
  };

  const handleMouseLeave = (key: keyof typeof images) => {
    setDragging((prev) => ({ ...prev, [key]: false }));
  };

  const handleImageSourceSelect = (source: "local" | "gallery") => {
    setShowImageSourceModal(false);

    if (source === "local") {
      switch (currentImageSlot) {
        case "image1":
          fileInputRef1.current?.click();
          break;
        case "image2":
          fileInputRef2.current?.click();
          break;
        case "image3":
          fileInputRef3.current?.click();
          break;
        case "image4":
          fileInputRef4.current?.click();
          break;
        case "image5":
          fileInputRef5.current?.click();
          break;
        case "image6":
          fileInputRef6.current?.click();
          break;
        case "image7":
          fileInputRef7.current?.click();
          break;
        case "image8":
          fileInputRef8.current?.click();
          break;
        case "image9":
          fileInputRef9.current?.click();
          break;
        case "image10":
          fileInputRef10.current?.click();
          break;
        case "image11":
          fileInputRef11.current?.click();
          break;
        case "image12":
          fileInputRef12.current?.click();
          break;
        case "image13":
          fileInputRef13.current?.click();
          break;
        case "image14":
          fileInputRef14.current?.click();
          break;
        case "image15":
          fileInputRef15.current?.click();
          break;
        case "image16":
          fileInputRef16.current?.click();
          break;
        case "image17":
          fileInputRef17.current?.click();
          break;
        case "image18":
          fileInputRef18.current?.click();
          break;
        default:
          break;
      }
    } else if (source === "gallery") {
      setShowGallery(true);
    }
  };

  const handleGalleryImageSelect = (imageUrl: string) => {
    if (!currentImageSlot) return;

    switch (currentImageSlot) {
      case "image1":
        setImages((prev) => ({ ...prev, image1: imageUrl }));
        break;
      case "image2":
        setImages((prev) => ({ ...prev, image2: imageUrl }));
        break;
      case "image3":
        setImages((prev) => ({ ...prev, image3: imageUrl }));
        break;
      case "image4":
        setImages((prev) => ({ ...prev, image4: imageUrl }));
        break;
      case "image5":
        setImages((prev) => ({ ...prev, image5: imageUrl }));
        break;
      case "image6":
        setImages((prev) => ({ ...prev, image6: imageUrl }));
        break;
      case "image7":
        setImages((prev) => ({ ...prev, image7: imageUrl }));
        break;
      case "image8":
        setImages((prev) => ({ ...prev, image8: imageUrl }));
        break;
      case "image9":
        setImages((prev) => ({ ...prev, image9: imageUrl }));
        break;
      case "image10":
        setImages((prev) => ({ ...prev, image10: imageUrl }));
        break;
      case "image11":
        setImages((prev) => ({ ...prev, image11: imageUrl }));
        break;
      case "image12":
        setImages((prev) => ({ ...prev, image12: imageUrl }));
        break;
      case "image13":
        setImages((prev) => ({ ...prev, image13: imageUrl }));
        break;
      case "image14":
        setImages((prev) => ({ ...prev, image14: imageUrl }));
        break;
      case "image15":
        setImages((prev) => ({ ...prev, image15: imageUrl }));
        break;
      case "image16":
        setImages((prev) => ({ ...prev, image16: imageUrl }));
        break;
      case "image17":
        setImages((prev) => ({ ...prev, image17: imageUrl }));
        break;
      case "image18":
        setImages((prev) => ({ ...prev, image18: imageUrl }));
        break;
      default:
        break;
    }
    setShowGallery(false);
    setCurrentImageSlot(null);
  };

  const openImageSourceModal = (imageSlot: string) => {
    setCurrentImageSlot(imageSlot);
    setShowGallery(true);
  };

  return (
    <>
      {showImageSourceModal && (
        <ImageSourceModal
          onClose={() => setShowImageSourceModal(false)}
          onSelectSource={handleImageSourceSelect}
        />
      )}

      {showGallery && (
        <FileManagerGallery
          isOpen={showGallery}
          onClose={() => {
            setShowGallery(false);
            setCurrentImageSlot(null);
          }}
          onImageSelect={handleGalleryImageSelect}
        />
      )}
      <div className="w-full items-center justify-center">
        <div className="w-full relative">
          <div className="absolute top-[20px] left-[20px] md:top-[35px] md:left-[40px] flex flex-col text-[14px] md:text-[18px] font-[400] text-[#F2F2F2] gap-1 md:gap-3">
            <div className="flex justify-center">
              <ReltorIcon className="w-8 h-8 md:w-auto md:h-auto" />
            </div>
            <div>
              <div>
                {orderData?.agent.first_name} {orderData?.agent.last_name}
              </div>
              <div>{orderData?.agent.company_name} Realtor</div>
            </div>
          </div>
          <div className="relative flex w-full group">
            <div
              className="w-full h-full relative overflow-hidden flex items-center justify-center"
              onMouseDown={(e) => handleMouseDown("image1", e)}
              onMouseMove={(e) => handleMouseMove("image1", e)}
              onMouseUp={() => handleMouseUp("image1")}
              onMouseLeave={() => handleMouseLeave("image1")}
            >
              {images.image1 ? (
                <>
                  <Image
                    unoptimized
                    src={images.image1}
                    alt="featured property"
                    width={800}
                    height={400}
                    className="w-full h-auto object-cover transition-transform duration-150"
                    style={{
                      transform: `scale(${scale.image1}) translate(${position.image1.x}px, ${position.image1.y}px)`,
                      cursor: dragging.image1
                        ? "grabbing"
                        : scale.image1 > 1
                          ? "grab"
                          : "default",
                    }}
                  />

                  {/* Zoom Controls */}
                  <div className="absolute bottom-3 left-3 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
                    <button
                      type="button"
                      onClick={() => handleZoom("image1", "in")}
                      className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                      title="Zoom In"
                    >
                      <ZoomIn className="w-4 h-4 text-gray-700" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleZoom("image1", "out")}
                      className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                      title="Zoom Out"
                    >
                      <ZoomOut className="w-4 h-4 text-gray-700" />
                    </button>
                  </div>

                  {/* Edit Button */}
                  <button
                    type="button"
                    onClick={() => openImageSourceModal("image1")}
                    className="absolute top-3 right-12 bg-white p-2 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                    title="Edit image"
                  >
                    <Pencil className="w-4 h-4 text-gray-700" />
                  </button>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => handleDelete("image1", fileInputRef1)}
                    className="absolute top-3 right-3 bg-white p-2 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                    title="Delete image"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </>
              ) : (
                <div
                  onClick={() => openImageSourceModal("image1")}
                  className="w-full h-[700px] bg-gray-200 rounded-md cursor-pointer flex items-center justify-center text-gray-400 min-h-[200px]"
                >
                  <div className="text-center">
                    Select Image
                  </div>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef1}
                onChange={(e) => handleImageChange("image1", e)}
                className="hidden"
              />
            </div>
          </div>
        </div>

        <div className="mt-[-80px] md:mt-[-120px]">
          <div className="relative w-full h-[200px] md:h-[350px]">
            <div className="w-full h-[200px] md:h-[350px] absolute inset-0">
              <svg
                viewBox="0 0 345 132"
                xmlns="http://www.w3.org/2000/svg"
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="none"
              >
                <path
                  d="M0 7V26.6C5 56 132 51 195 45C124 46 36 20 0 7Z"
                  fill="#D9D9D9"
                />
                <path
                  d="M345 0C312 22 205 39 155 44L162 56L345 38V0Z"
                  fill="#404953"
                />
                <path
                  d="M345 25C249 61 75 40 0 25V132H345V25Z"
                  fill="#2E353D"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="mt-[-120px] md:mt-[-200px] py-[20px] md:py-[50px] relative bg-[#2E353D] m-auto h-auto flex items-center justify-center px-5 z-10">
          <div className="flex flex-col md:flex-row justify-between gap-[20px] md:gap-[50px] w-full md:w-[90%] lg:w-[80%] xl:w-[60%]">
            <div className="flex flex-col text-[30px] md:text-[50px] leading-[30px] md:leading-[40px] font-[300] text-[#FFFFFF] gap-2 md:gap-4 font-inter uppercase">
              <div className="font-[700]">Luxury Homes</div>
              <div>Affordable</div>
              <div>Prices</div>
            </div>
            <div className="flex flex-col gap-3 md:gap-5 text-[12px] md:text-[14px] font-[300] text-[#FFFFFF] uppercase">
              <div className="flex flex-col md:flex-row gap-2 md:gap-12 border-b border-white pb-3 md:pb-5">
                <div>Starting at</div>
                <div className="text-[24px] md:text-[30px] font-[600]">
                  $450,000
                </div>
              </div>
              <div className="flex flex-col md:flex-row gap-2 md:gap-12 border-b border-white pb-3 md:pb-5">
                <div>Type</div>
                <div className="">Single Family Residence</div>
              </div>
              <div className="flex flex-col md:flex-row gap-2 md:gap-12 pb-3 md:pb-5">
                <div className="flex gap-2 md:gap-4">
                  <div>Size</div>
                  <div>1,500 SQFT</div>
                </div>
                <div className="flex gap-2 md:gap-4">
                  <div>Built In</div>
                  <div>1995</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-[20px] md:gap-[50px] py-[20px] md:py-[50px] px-[20px] sm:px-[50px] md:px-[100px] bg-white w-full md:w-[90%] lg:w-[80%] m-auto">
          <div className="grid grid-cols-2 gap-4 md:gap-7 flex-shrink-0 w-full md:w-[60%]">
            {['LIVING ROOM', 'MASTER BEDROOM', 'KITCHEN', 'BASEMENT'].map((room, index) => {
              const imageId = `image${index + 2}` as keyof typeof images; // Creates image2, image3, image4, image5

              // Proper ref assignment based on index
              const getFileInputRef = () => {
                switch (imageId) {
                  case 'image2': return fileInputRef2;
                  case 'image3': return fileInputRef3;
                  case 'image4': return fileInputRef4;
                  case 'image5': return fileInputRef5;
                  default: return fileInputRef2;
                }
              };

              const fileInputRef = getFileInputRef();

              return (
                <div key={room} className="flex flex-col">
                  <div className="relative flex w-full group">
                    <div
                      className="w-full h-[100px] md:h-[150px] relative overflow-hidden flex items-center justify-center"
                      onMouseDown={(e) => handleMouseDown(imageId, e)}
                      onMouseMove={(e) => handleMouseMove(imageId, e)}
                      onMouseUp={() => handleMouseUp(imageId)}
                      onMouseLeave={() => handleMouseLeave(imageId)}
                    >
                      {images[imageId] ? (
                        <>
                          <Image
                            unoptimized
                            src={images[imageId]!}
                            alt={room.toLowerCase()}
                            width={200}
                            height={300}
                            className="w-full h-full object-cover transition-transform duration-150"
                            style={{
                              transform: `scale(${scale[imageId]}) translate(${position[imageId].x}px, ${position[imageId].y}px)`,
                              cursor: dragging[imageId]
                                ? "grabbing"
                                : scale[imageId] > 1
                                  ? "grab"
                                  : "default",
                            }}
                          />

                          {/* Zoom Controls */}
                          <div className="absolute bottom-1 left-1 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
                            <button
                              type="button"
                              onClick={() => handleZoom(imageId, "in")}
                              className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                              title="Zoom In"
                            >
                              <ZoomIn className="w-3 h-3 md:w-4 md:h-4 text-gray-700" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleZoom(imageId, "out")}
                              className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                              title="Zoom Out"
                            >
                              <ZoomOut className="w-3 h-3 md:w-4 md:h-4 text-gray-700" />
                            </button>
                          </div>

                          {/* Edit Button */}
                          <button
                            type="button"
                            onClick={() => openImageSourceModal(imageId)}
                            className="absolute top-2 right-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                            title="Edit image"
                          >
                            <Pencil className="w-3 h-3 md:w-4 md:h-4 text-gray-700" />
                          </button>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => handleDelete(imageId, fileInputRef)}
                            className="absolute top-2 right-2 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                            title="Delete image"
                          >
                            <Trash2 className="w-3 h-3 md:w-4 md:h-4 text-red-500" />
                          </button>
                        </>
                      ) : (
                        <div
                          onClick={() => openImageSourceModal(imageId)}
                          className="w-full h-full bg-gray-300 cursor-pointer flex items-center justify-center text-gray-400 text-xs md:text-sm"
                        >
                          Select Image
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={(e) => handleImageChange(imageId, e)}
                        className="hidden"
                      />
                    </div>
                  </div>
                  <span className="mt-2 text-xs md:text-sm font-bold">{room}</span>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col justify-between w-full md:w-[40%] gap-4 md:gap-0 font-alexandria">
            <div>
              <h2 className="text-xs md:text-sm font-bold uppercase mb-2">
                House Overview
              </h2>
              <p className="text-xs md:text-sm mb-3 font-[300]">
                Lorem Ipsum Dolor Sit Amet, Consectetur Adipiscing Elit, Sed Do
                Eiusmod Tempor Incididunt Ut Labore Et Dolore Magna Aliqua.
              </p>
              <hr className="border-gray-400 my-3 md:my-4" />

              <div className="grid grid-cols-2 gap-y-3 md:gap-y-4 justify-items-center text-[#2E353D]">
                {[
                  {
                    icon: <Bedrooms className="w-8 h-8 md:w-10 md:h-10" />,
                    value: "4",
                    label: "Bedrooms",
                  },
                  {
                    icon: <Bathrooms className="w-8 h-8 md:w-10 md:h-10" />,
                    value: "2",
                    label: "Bathrooms",
                  },
                  {
                    icon: <Parking className="w-8 h-8 md:w-10 md:h-10" />,
                    value: "3",
                    label: "Parking",
                  },
                  {
                    icon: (
                      <UtilitiesIncluded className="w-8 h-8 md:w-10 md:h-10" />
                    ),
                    value: "Yes",
                    label: "Utilities Included",
                  },
                ].map((item, index) => (
                  <div
                    key={index}
                    className="flex flex-col items-center gap-2 md:gap-3"
                  >
                    <div className="flex gap-2 md:gap-4">
                      {item.icon}
                      <div className="text-base md:text-lg font-semibold">
                        {item.value}
                      </div>
                    </div>
                    <div className="text-xs uppercase">{item.label}</div>
                  </div>
                ))}
              </div>

              <hr className="border-gray-400 my-3 md:my-4" />

              <p className="text-xs md:text-sm font-[300]">
                123 House Street, City, Province, PC
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between px-5 py-5 md:py-10 bg-[#2E353D] font-alexandria">
          <div className="flex gap-3 md:gap-5 items-center font-alexandria mb-4 md:mb-0">
            <div className="h-[60px] w-[60px] md:h-[80px] md:w-[80px] rounded-full overflow-hidden">
              <Avatar className="h-[60px] w-[60px] md:h-[80px] md:w-[80px]">
                <AvatarImage
                  src={
                    orderData?.agent.avatar_url
                      ? orderData?.agent.avatar_url
                      : "https://github.com/shadcn.png"
                  }
                />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
            </div>
            <div className="text-[14px] md:text-[16px] font-normal text-[#F2F2F2]">
              <div>Realtor</div>
              <div>
                {orderData?.agent.first_name} {orderData?.agent.last_name}
              </div>
              <div>{orderData?.agent.company_name} Realtor Services</div>
            </div>
          </div>
          <div className="flex gap-10 items-center font-alexandria justify-end">
            {orderData?.agent.primary_phone && (
              <a href={`tel:${orderData.agent.primary_phone}`} className="">
                <Phone className="text-transparent fill-white w-6 h-6 md:w-auto md:h-auto" />
              </a>
            )}
            {orderData?.agent.email && (
              <a href={`mailto:${orderData.agent.email}`} className=" ">
                <LinkedIcon className="text-white w-10 h-10  md:w-auto md:h-auto" />
              </a>
            )}
            {orderData?.agent.email && (
              <a href={`mailto:${orderData.agent.email}`} className=" ">
                <Mail className="text-white w-6 h-6 md:w-auto md:h-auto" />
              </a>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default BcfpStandard1;
