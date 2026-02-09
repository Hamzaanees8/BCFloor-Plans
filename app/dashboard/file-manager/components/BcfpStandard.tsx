import { LinkedIcon, ReltorIcon } from "@/components/Icons";
// import { AvatarFallback } from "@/components/ui/avatar";
// import { Avatar, AvatarImage } from "@radix-ui/react-avatar";
import { CircleCheckBig, Eye, File, Mail, Phone, Wrench, Pencil, Trash, ZoomOut, ZoomIn } from "lucide-react";
import Image from "next/image";
import { useFileManagerContext } from "../FileManagerContext";
import React from "react";
import { Order } from "../../orders/page";
import '../../../globals.css';
import StyledInput from "./StyledInput";
import FileManagerGallery from "./fileManagerGallery";

// Feature Sheet Service
import { featureSheetService } from "../file-manager";
import type { FeatureSheetPayload, FeatureSheetResponse, HighlightItem } from "../types/featureSheetTypes";
import { forwardRef, useImperativeHandle, useRef, useState, JSX } from "react";

// Interface for methods exposed to parent component
export interface BcfpStandardRef {
  exportToPayload: () => Promise<FeatureSheetPayload>;
  importFromPayload: (payload: FeatureSheetResponse) => void;
}

interface BcfpStandardProps {
  orderData: Order | null;
}

const BcfpStandard = forwardRef<BcfpStandardRef, BcfpStandardProps>(({ orderData }, ref) => {
  const { formData } = useFileManagerContext();

  // State for editable text fields
  const [offeredAtPrice, setOfferedAtPrice] = useState("$1,275,000");
  const [realtorTitle, setRealtorTitle] = useState("Realtor");
  const [realtorName, setRealtorName] = useState(`${orderData?.agent.first_name || ""} ${orderData?.agent.last_name || ""}`);
  const [companyName, setCompanyName] = useState(`${orderData?.agent.company_name || ""} Realtor Services`);
  const [keyHighlightLabel, setKeyHighlightLabel] = useState("Key Highlight");
  const [propertyNotesTitle, setPropertyNotesTitle] = useState(formData.propertyNotesTitle.trim() === "" ? "Property Notes" : formData.propertyNotesTitle);
  const [propertyNotesDescription, setPropertyNotesDescription] = useState(formData.propertyNotesDescription || "No property notes provided.");
  const [expandedDetail1Title, setExpandedDetail1Title] = useState(formData.expandedDetail1.trim() === "" ? "Expanded Detail 1" : formData.expandedDetail1);
  const [expandedDetail1Description, setExpandedDetail1Description] = useState(formData.expandedDetail1Description || "No Expanded Detail provided.");
  const [expandedDetail2Title, setExpandedDetail2Title] = useState(formData.expandedDetail2.trim() === "" ? "Expanded Detail 2" : formData.expandedDetail2);
  const [expandedDetail2Description, setExpandedDetail2Description] = useState(formData.expandedDetail2Description || "No Expanded Detail provided.");
  const [contactLabel, setContactLabel] = useState("Contact");
  const [contactInfo, setContactInfo] = useState("Realtor contact info");
  const [ctaText, setCtaText] = useState("CTA");

  // State for editable key highlights (ensure 6 slots, preserve provided values)
  const [keyHighlights, setKeyHighlights] = useState<string[]>(() => {
    const provided = Array.isArray(formData.Keyhighlights) ? formData.Keyhighlights.slice(0, 6) : [];
    const out = [...provided];
    while (out.length < 6) out.push("");
    return out;
  });

  // State for editable highlights
  const [highlights, setHighlights] = useState(formData.highlights.map(highlight => ({
    ...highlight,
    title: highlight.title.trim() || "Highlight",
    value: highlight.value || "Value"
  })));

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

  const handleImageSourceSelect = (source: 'local' | 'gallery') => {
    setShowImageSourceModal(false);

    if (source === 'local') {
      switch (currentImageSlot) {
        case 'image1':
          fileInputRef1.current?.click();
          break;
        case 'image2':
          fileInputRef2.current?.click();
          break;
        case 'image3':
          fileInputRef3.current?.click();
          break;
        case 'image4':
          fileInputRef4.current?.click();
          break;
        case 'image5':
          fileInputRef5.current?.click();
          break;
        case 'image6':
          fileInputRef6.current?.click();
          break;
        case 'image7':
          fileInputRef7.current?.click();
          break;
        case 'image8':
          fileInputRef8.current?.click();
          break;
        case 'image9':
          fileInputRef9.current?.click();
          break;
        case 'image10':
          fileInputRef10.current?.click();
          break;
        case 'image11':
          fileInputRef11.current?.click();
          break;
        case 'image12':
          fileInputRef12.current?.click();
          break;
        case 'image13':
          fileInputRef13.current?.click();
          break;
        default:
          break;
      }
    } else if (source === 'gallery') {
      setShowGallery(true);
    }
  };

  const handleGalleryImageSelect = (imageUrl: string) => {
    if (!currentImageSlot) return;

    switch (currentImageSlot) {
      case 'image1':
        setImages(prev => ({ ...prev, image1: imageUrl }));
        break;
      case 'image2':
        setImages(prev => ({ ...prev, image2: imageUrl }));
        break;
      case 'image3':
        setImages(prev => ({ ...prev, image3: imageUrl }));
        break;
      case 'image4':
        setImages(prev => ({ ...prev, image4: imageUrl }));
        break;
      case 'image5':
        setImages(prev => ({ ...prev, image5: imageUrl }));
        break;
      case 'image6':
        setImages(prev => ({ ...prev, image6: imageUrl }));
        break;
      case 'image7':
        setImages(prev => ({ ...prev, image7: imageUrl }));
        break;
      case 'image8':
        setImages(prev => ({ ...prev, image8: imageUrl }));
        break;
      case 'image9':
        setImages(prev => ({ ...prev, image9: imageUrl }));
        break;
      case 'image10':
        setImages(prev => ({ ...prev, image10: imageUrl }));
        break;
      case 'image11':
        setImages(prev => ({ ...prev, image11: imageUrl }));
        break;
      case 'image12':
        setImages(prev => ({ ...prev, image12: imageUrl }));
        break;
      case 'image13':
        setImages(prev => ({ ...prev, image13: imageUrl }));
        break;
      default:
        break;
    }
    setShowGallery(false);
    setCurrentImageSlot(null);
  };

  const openImageSourceModal = (imageSlot: string) => {
    setCurrentImageSlot(imageSlot);
    setShowImageSourceModal(true);
  };

  // Icon map and highlight handlers
  const iconMap: Record<string, JSX.Element> = {
    check: <CircleCheckBig className="w-6 h-6 text-[#4290E9]" />,
    eye: <Eye className="w-6 h-6 text-[#4290E9]" />,
    file: <File className="w-6 h-6 text-[#4290E9]" />,
    wrench: <Wrench className="w-6 h-6 text-[#4290E9]" />,
  };
  const defaultIcon = <CircleCheckBig className="w-6 h-6 text-[#4290E9]" />;

  const handleHighlightTitleChange = (index: number, newTitle: string) => {
    setHighlights((prev) => prev.map((h, i) => (i === index ? { ...h, title: newTitle } : h)));
  };

  const handleHighlightValueChange = (index: number, newValue: string) => {
    setHighlights((prev) => prev.map((h, i) => (i === index ? { ...h, value: newValue } : h)));
  };

  // Icon menu state and handlers
  const [openIconMenu, setOpenIconMenu] = useState<number | null>(null);
  const iconOptions = Object.keys(iconMap);

  const toggleIconMenu = (index: number) => {
    setOpenIconMenu((prev) => (prev === index ? null : index));
  };

  const setHighlightIcon = (index: number, iconKey: string) => {
    setHighlights((prev) => prev.map((h, i) => (i === index ? { ...h, icon: iconKey } : h)));
    setOpenIconMenu(null);
  };

  // Key highlights change handler
  const handleKeyHighlightChange = (index: number, value: string) => {
    setKeyHighlights((prev) => prev.map((k, i) => (i === index ? value : k)));
  };



  // Expose methods to parent component via ref
  useImperativeHandle(ref, () => ({
    exportToPayload: async () => {
      const payload = await featureSheetService.buildPayload({
        orderUuid: orderData?.uuid || "",
        templateKey: "BCFPStandard",
        uploadedBy: "admin",
        type: "template",
        primaryColor: "#4290E9",
        offeredAtPrice,
        realtorTitle,
        realtorName,
        companyName,
        keyHighlightLabel,
        keyHighlights,
        propertyNotesTitle,
        propertyNotesDescription,
        expandedDetail1Title,
        expandedDetail1Description,
        expandedDetail2Title,
        expandedDetail2Description,
        contactLabel,
        contactInfo,
        ctaText,
        highlights,
        images,
        imageScales: scale,
        imagePositions: position,
      });
      return payload;
    },

    importFromPayload: (payload: FeatureSheetResponse) => {
      const state = featureSheetService.parsePayloadToState(payload);
      if (state.offeredAtPrice) setOfferedAtPrice(state.offeredAtPrice as string);
      if (state.realtorTitle) setRealtorTitle(state.realtorTitle as string);
      if (state.realtorName) setRealtorName(state.realtorName as string);
      if (state.companyName) setCompanyName(state.companyName as string);
      if (state.keyHighlightLabel) setKeyHighlightLabel(state.keyHighlightLabel as string);
      if (state.keyHighlights) setKeyHighlights(state.keyHighlights as string[]);
      if (state.propertyNotesTitle) setPropertyNotesTitle(state.propertyNotesTitle as string);
      if (state.propertyNotesDescription) setPropertyNotesDescription(state.propertyNotesDescription as string);
      if (state.expandedDetail1Title) setExpandedDetail1Title(state.expandedDetail1Title as string);
      if (state.expandedDetail1Description) setExpandedDetail1Description(state.expandedDetail1Description as string);
      if (state.expandedDetail2Title) setExpandedDetail2Title(state.expandedDetail2Title as string);
      if (state.expandedDetail2Description) setExpandedDetail2Description(state.expandedDetail2Description as string);
      if (state.contactLabel) setContactLabel(state.contactLabel as string);
      if (state.contactInfo) setContactInfo(state.contactInfo as string);
      if (state.ctaText) setCtaText(state.ctaText as string);
      if (state.highlights) setHighlights(state.highlights as HighlightItem[]);

      setImages(state.images as typeof images);
      setScale(state.imageScales as typeof scale);
      setPosition(state.imagePositions as typeof position);
    },
  }));


  return (
    <>
      {showImageSourceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-4">Select Image Source</h3>
            <div className="flex gap-4">
              <button
                onClick={() => handleImageSourceSelect('local')}
                className="flex-1 bg-[#4290E9] text-white py-2 px-4 rounded hover:bg-[#4290e9ea] transition-colors"
              >
                Upload
              </button>
              <button
                onClick={() => handleImageSourceSelect('gallery')}
                className="flex-1 bg-[#6BAE41] text-white py-2 px-4 rounded hover:bg-[#6bae41ea] transition-colors"
              >
                From Gallery
              </button>
            </div>
            <button
              onClick={() => setShowImageSourceModal(false)}
              className="w-full mt-4 bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
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
        <div className={`bg-[#4290E9] h-auto md:h-[221px] w-full flex flex-col md:flex-row items-center justify-between px-5 py-5 md:py-0`}>
          <div className="flex flex-col text-[14px] md:text-[18px] font-[400] text-[#F2F2F2] gap-1 md:gap-3 mb-4 md:mb-0">
            <div className="flex justify-center">
              <ReltorIcon className="w-10 h-10 md:w-auto md:h-auto" />
            </div>
            <div className="text-center md:text-left">
              <div>{orderData?.agent.first_name}{" "}{orderData?.agent.last_name}</div>
              <div>{orderData?.agent.company_name} Realtor</div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 md:gap-[60px] items-center w-full md:w-auto">
            <div className="flex flex-col font-alexandria gap-2 md:gap-5 text-center md:text-right w-full md:w-auto">
              <div className="font-bold text-[20px] md:text-[26px] text-[#F2F2F2]">
                Offered at
              </div>
              {/* <input
              type="text"
              value={offeredAtPrice}
              onChange={(e) => setOfferedAtPrice(e.target.value)}
              className="text-[40px] md:text-[80px] leading-[40px] md:leading-[80px] font-light text-[#F2F2F2] bg-transparent border-none outline-none text-center md:text-right w-full"
            /> */}
              <StyledInput
                value={offeredAtPrice}
                onChange={(e) => setOfferedAtPrice(e.target.value)}
                className=" text-[80px] text-[#F2F2F2] bg-transparent text-right w-full focus:outline-none border-none placeholder-[#F2F2F2] placeholder:font-[500]"
                placeholder="FIRSTNAME LASTNAME"
              />
            </div>

            <div className="flex flex-col md:flex-row gap-3 md:gap-5 items-center font-alexandria w-full justify-center md:justify-start">

              {/* <Avatar className="h-[60px] w-[60px] md:h-[80px] md:w-[80px]">
                <AvatarImage src={agentAvatar} />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar> */}

              <div
                className="h-[60px] w-[60px] md:h-[80px] md:w-[80px] border-[2px] text-center rounded-full border-white shadow-sm place-self-center relative overflow-hidden flex items-center justify-center group"
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
                      alt="uploaded"
                      width={200}
                      height={300}
                      className="w-full h-full object-cover transition-transform duration-150"
                      style={{
                        transform: `scale(${scale.image1}) translate(${position.image1.x}px, ${position.image1.y}px)`,
                        cursor: dragging.image1
                          ? "grabbing"
                          : scale.image1 > 1
                            ? "grab"
                            : "default",
                      }}
                    />

                    {/* Zoom Buttons */}
                    <div className="absolute bottom-[3px] left-[8px] flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
                      <button
                        type="button"
                        onClick={() => handleZoom("image1", "in")}
                        className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                        title="Zoom In"
                      >
                        <ZoomIn className="w-3 h-3 text-gray-700" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleZoom("image1", "out")}
                        className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                        title="Zoom Out"
                      >
                        <ZoomOut className="w-3 h-3 text-gray-700" />
                      </button>
                    </div>

                    {/* Edit/Delete */}
                    <button
                      type="button"
                      onClick={() => openImageSourceModal("image1")}
                      className="absolute top-1 right-11 z-10 bg-white p-1 rounded-full hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                      title="Edit image"
                    >
                      <Pencil className="w-3 h-3 text-gray-700" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete("image1", fileInputRef1)}
                      className="absolute top-1 right-3 z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                      title="Delete image"
                    >
                      <Trash className="w-3 h-3 text-red-500" />
                    </button>
                  </>
                ) : (
                  <div
                    onClick={() => openImageSourceModal("image1")}
                    className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
                  >
                    Select Image
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

              <div className="text-[14px] md:text-[16px] rounded-full font-normal text-[#F2F2F2] text-center md:text-left">
                <input
                  type="text"
                  value={realtorTitle}
                  onChange={(e) => setRealtorTitle(e.target.value)}
                  className="bg-transparent border-none outline-none w-full text-center md:text-left"
                />
                <input
                  type="text"
                  value={realtorName}
                  onChange={(e) => setRealtorName(e.target.value)}
                  className="bg-transparent border-none outline-none w-full text-center md:text-left"
                />
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="bg-transparent border-none outline-none w-full text-center md:text-left"
                />
              </div>

              <div className="flex flex-row md:flex-col gap-3 md:gap-2">
                {orderData?.agent.primary_phone && (
                  <a href={`tel:${orderData.agent.primary_phone}`}>
                    <Phone className="text-transparent fill-white w-6 h-6" />
                  </a>
                )}
                {orderData?.agent.email && (
                  <a href={`mailto:${orderData.agent.email}`}>
                    <LinkedIcon className="text-white w-10 h-10 md:w-auto md:h-auto" />
                  </a>
                )}
                {orderData?.agent.email && (
                  <a href={`mailto:${orderData.agent.email}`}>
                    <Mail className="text-white w-6 h-6" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="relative group">
          {/* <ImageBlock
          image={mainImage}
          fileRef={mainImageRef}
          onChange={handleImageChange(setMainImage)}
          onDelete={handleDeleteImage(setMainImage, "/featuresheetimage.png")}
          defaultImage="/featuresheetimage.png"
        /> */}
          <div
            className="h-[640px] w-full group relative overflow-hidden"
            onMouseDown={(e) => handleMouseDown("image2", e)}
            onMouseMove={(e) => handleMouseMove("image2", e)}
            onMouseUp={() => handleMouseUp("image2")}
            onMouseLeave={() => handleMouseLeave("image2")}
          >
            {images.image2 ? (
              <>
                <Image
                  unoptimized
                  src={images.image2}
                  alt="uploaded"
                  width={200}
                  height={300}
                  className="w-full h-full object-cover transition-transform duration-150"
                  style={{
                    transform: `scale(${scale.image2}) translate(${position.image2.x}px, ${position.image2.y}px)`,
                    cursor: dragging.image2
                      ? "grabbing"
                      : scale.image2 > 1
                        ? "grab"
                        : "default",
                  }}
                />

                <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
                  <button
                    type="button"
                    onClick={() => handleZoom("image2", "in")}
                    className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-4 h-4 text-gray-700" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleZoom("image2", "out")}
                    className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-4 h-4 text-gray-700" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => openImageSourceModal('image2')}
                  className="absolute top-[110px] right-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                  title="Edit image"
                >
                  <Pencil className="w-4 h-4 text-gray-700" />
                </button>

                <button
                  type="button"
                  onClick={() => handleDelete("image2", fileInputRef2)}
                  className="absolute top-[110px] right-2 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                  title="Delete image"
                >
                  <Trash className="w-4 h-4 text-red-500" />
                </button>
              </>
            ) : (
              <div
                onClick={() => openImageSourceModal('image2')}
                className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
              >
                Select Image
              </div>
            )}

            <input
              type="file"
              accept="image/*"
              ref={fileInputRef2}
              onChange={(e) => handleImageChange("image2", e)}
              className="hidden"
            />
          </div>
        </div>

        <div className="flex flex-col md:flex-row px-4 md:px-5 py-4 mt-4 gap-4 md:gap-6">
          <div className="flex flex-col w-full md:w-[30%]">
            <StyledInput
              value={keyHighlightLabel}
              onChange={(e) => setKeyHighlightLabel(e.target.value)}
              className="font-semibold text-[#4290E9] text-[36px]  h-[30px] bg-transparent text-left w-full focus:outline-none border-none placeholder:font-[500]"
              placeholder="Key Highlight "
            />
            <div className="grid grid-cols-2  gap-y-3 md:gap-y-5 gap-x-4 md:gap-x-6 mt-[24px] md:mt-[48px]">
              {keyHighlights.map((item, index) => (
                <div key={index} className="flex items-center gap-3 md:gap-5 font-alexandria">
                  <span className="w-[16px] h-[16px] flex-none bg-blue-500 rounded-full"></span>

                  <StyledInput
                    value={item ?? ""}
                    onChange={(e) => handleKeyHighlightChange(index, e.target.value)}
                    className="font-semibold text-[#303030] text-[20px]  h-[30px] bg-transparent text-left w-full focus:outline-none border-none placeholder:font-[500]"
                    placeholder="Add key highlight"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col w-full md:w-[70%] gap-[24px] md:gap-[48px] font-alexandria">

            <StyledInput
              value={propertyNotesTitle}
              onChange={(e) => setPropertyNotesTitle(e.target.value)}
              className="font-semibold text-[#4290E9] text-[24px] md:text-[36px] h-[30px] bg-transparent text-left w-full focus:outline-none border-none placeholder:font-[500]"
              placeholder="Enter Property Notes "
            />
            <StyledInput
              value={propertyNotesDescription}
              onChange={(e) => setPropertyNotesDescription(e.target.value)}
              className="font-semibold text-[#4290E9] text-[16px] md:text-[20px] h-[120%] bg-transparent text-left w-full focus:outline-none border-none placeholder:font-[500]"
              placeholder="No property notes provided."
            />

          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mt-4">

          <div
            className="h-[200px] md:h-[300px] w-full group relative overflow-hidden"
            onMouseDown={(e) => handleMouseDown("image3", e)}
            onMouseMove={(e) => handleMouseMove("image3", e)}
            onMouseUp={() => handleMouseUp("image3")}
            onMouseLeave={() => handleMouseLeave("image3")}
          >
            {images.image3 ? (
              <>
                <Image
                  unoptimized
                  src={images.image3}
                  alt="uploaded"
                  width={200}
                  height={300}
                  className="w-full h-full object-cover transition-transform duration-150"
                  style={{
                    transform: `scale(${scale.image3}) translate(${position.image3.x}px, ${position.image3.y}px)`,
                    cursor: dragging.image3
                      ? "grabbing"
                      : scale.image3 > 1
                        ? "grab"
                        : "default",
                  }}
                />

                <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
                  <button
                    type="button"
                    onClick={() => handleZoom("image3", "in")}
                    className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-4 h-4 text-gray-700" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleZoom("image3", "out")}
                    className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-4 h-4 text-gray-700" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => openImageSourceModal('image3')}
                  className="absolute top-[110px] right-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                  title="Edit image"
                >
                  <Pencil className="w-4 h-4 text-gray-700" />
                </button>

                <button
                  type="button"
                  onClick={() => handleDelete("image3", fileInputRef3)}
                  className="absolute top-[110px] right-2 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                  title="Delete image"
                >
                  <Trash className="w-4 h-4 text-red-500" />
                </button>
              </>
            ) : (
              <div
                onClick={() => openImageSourceModal('image3')}
                className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
              >
                Select Image
              </div>
            )}

            <input
              type="file"
              accept="image/*"
              ref={fileInputRef3}
              onChange={(e) => handleImageChange("image3", e)}
              className="hidden"
            />
          </div>
          <div
            className="h-[200px] md:h-[300px] w-full group relative overflow-hidden"
            onMouseDown={(e) => handleMouseDown("image4", e)}
            onMouseMove={(e) => handleMouseMove("image4", e)}
            onMouseUp={() => handleMouseUp("image4")}
            onMouseLeave={() => handleMouseLeave("image4")}
          >
            {images.image4 ? (
              <>
                <Image
                  unoptimized
                  src={images.image4}
                  alt="uploaded"
                  width={200}
                  height={300}
                  className="w-full h-full object-cover transition-transform duration-150"
                  style={{
                    transform: `scale(${scale.image4}) translate(${position.image4.x}px, ${position.image4.y}px)`,
                    cursor: dragging.image4
                      ? "grabbing"
                      : scale.image4 > 1
                        ? "grab"
                        : "default",
                  }}
                />

                <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
                  <button
                    type="button"
                    onClick={() => handleZoom("image4", "in")}
                    className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-4 h-4 text-gray-700" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleZoom("image4", "out")}
                    className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-4 h-4 text-gray-700" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => openImageSourceModal('image4')}
                  className="absolute top-[110px] right-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                  title="Edit image"
                >
                  <Pencil className="w-4 h-4 text-gray-700" />
                </button>

                <button
                  type="button"
                  onClick={() => handleDelete("image4", fileInputRef4)}
                  className="absolute top-[110px] right-2 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                  title="Delete image"
                >
                  <Trash className="w-4 h-4 text-red-500" />
                </button>
              </>
            ) : (
              <div
                onClick={() => openImageSourceModal('image4')}
                className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
              >
                Select Image
              </div>
            )}

            <input
              type="file"
              accept="image/*"
              ref={fileInputRef4}
              onChange={(e) => handleImageChange("image4", e)}
              className="hidden"
            />
          </div>
          <div
            className="h-[200px] md:h-[300px] w-full group relative overflow-hidden"
            onMouseDown={(e) => handleMouseDown("image5", e)}
            onMouseMove={(e) => handleMouseMove("image5", e)}
            onMouseUp={() => handleMouseUp("image5")}
            onMouseLeave={() => handleMouseLeave("image5")}
          >
            {images.image5 ? (
              <>
                <Image
                  unoptimized
                  src={images.image5}
                  alt="uploaded"
                  width={200}
                  height={300}
                  className="w-full h-full object-cover transition-transform duration-150"
                  style={{
                    transform: `scale(${scale.image5}) translate(${position.image5.x}px, ${position.image5.y}px)`,
                    cursor: dragging.image5
                      ? "grabbing"
                      : scale.image5 > 1
                        ? "grab"
                        : "default",
                  }}
                />

                <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
                  <button
                    type="button"
                    onClick={() => handleZoom("image5", "in")}
                    className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-4 h-4 text-gray-700" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleZoom("image5", "out")}
                    className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-4 h-4 text-gray-700" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => openImageSourceModal('image5')}
                  className="absolute top-[110px] right-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                  title="Edit image"
                >
                  <Pencil className="w-4 h-4 text-gray-700" />
                </button>

                <button
                  type="button"
                  onClick={() => handleDelete("image5", fileInputRef5)}
                  className="absolute top-[110px] right-2 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                  title="Delete image"
                >
                  <Trash className="w-4 h-4 text-red-500" />
                </button>
              </>
            ) : (
              <div
                onClick={() => openImageSourceModal('image5')}
                className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
              >
                Select Image
              </div>
            )}

            <input
              type="file"
              accept="image/*"
              ref={fileInputRef5}
              onChange={(e) => handleImageChange("image5", e)}
              className="hidden"
            />
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-5 px-4 md:px-5 py-6 md:py-10">
          <div className="flex flex-col w-full md:w-[50%] gap-[24px] md:gap-[48px] font-alexandria">

            <StyledInput
              value={expandedDetail1Title}
              onChange={(e) => setExpandedDetail1Title(e.target.value)}
              className="font-semibold text-[#4290E9] text-[36px] h-[30px] bg-transparent text-left w-full focus:outline-none border-none placeholder:font-[500]"
              placeholder="Enter Property Notes "
            />
            <StyledInput
              value={expandedDetail1Description}
              onChange={(e) => setExpandedDetail1Description(e.target.value)}
              className="font-semibold text-[#303030] text-[20px] h-[120%] bg-transparent text-left w-full focus:outline-none border-none placeholder:font-[500]"
              placeholder="No Expanded Detail provided. "
            />
          </div>

          <div className="flex flex-col w-full md:w-[50%] gap-[24px] md:gap-[48px] font-alexandria">
            <StyledInput
              value={expandedDetail2Title}
              onChange={(e) => setExpandedDetail2Title(e.target.value)}
              className="font-semibold text-[#4290E9] text-[36px] h-[30px] bg-transparent text-left w-full focus:outline-none border-none placeholder:font-[500]"
              placeholder="Enter Property Notes "
            />
            <StyledInput
              value={expandedDetail2Description}
              onChange={(e) => setExpandedDetail2Description(e.target.value)}
              className="font-semibold text-[#303030] text-[20px] h-[120%] bg-transparent text-left w-full focus:outline-none border-none placeholder:font-[500]"
              placeholder="No Expanded Detail provided. "
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-6 px-4 md:px-5 py-6 md:py-10">
          {highlights.map((highlight, index) => (
            <div
              key={index}
              className="flex flex-col items-center gap-4 md:gap-6 font-alexandria w-full sm:w-[45%] md:w-[300px]"
            >
              <StyledInput
                value={highlight.title}
                onChange={(e) => handleHighlightTitleChange(index, e.target.value)}
                className=" text-[#4290E9] text-[36px] h-[30px] bg-transparent text-center w-full focus:outline-none border-none placeholder:font-[500]"
                placeholder="No Expanded Detail provided. "
              />

              <div className="relative">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleIconMenu(index)}
                  className="text-[20px] justify-center self-center cursor-pointer"
                >
                  {iconMap[highlight.icon] || defaultIcon}
                </div>

                {openIconMenu === index && (
                  <div className="absolute left-1/2 transform -translate-x-1/2 mt-2 bg-white p-2 rounded shadow z-20 flex gap-2">
                    {iconOptions.map((key) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setHighlightIcon(index, key)}
                        className="p-1 rounded hover:bg-gray-100"
                      >
                        {iconMap[key] || defaultIcon}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <StyledInput
                value={highlight.value}
                onChange={(e) => handleHighlightValueChange(index, e.target.value)}
                className=" text-[#303030] text-[20px] h-[30px] bg-transparent text-center w-full focus:outline-none border-none placeholder:font-[500]"
                placeholder="No Expanded Detail provided. "
              />
            </div>
          ))}
        </div>

        <div className="flex justify-between px-4 md:px-5 py-6 md:py-10 bg-[#4290E9] font-alexandria">
          <div className="flex flex-col gap-3 md:gap-5">

            <StyledInput
              value={contactLabel}
              onChange={(e) => setContactLabel(e.target.value)}
              className=" text-[#F2F2F2] text-[16px] h-[30px] bg-transparent text-left w-full focus:outline-none border-none placeholder:font-[500]"
              placeholder="Realtor contact info "
            />
            <StyledInput
              value={contactInfo}
              onChange={(e) => setContactInfo(e.target.value)}
              className=" text-[#F2F2F2] text-[16px] h-[30px] bg-transparent text-left w-full focus:outline-none border-none placeholder:font-[500]"
              placeholder="Realtor contact info "
            />
            <StyledInput
              value={ctaText}
              onChange={(e) => setCtaText(e.target.value)}
              className=" text-[#F2F2F2] text-[16px] h-[30px] bg-transparent text-left w-full focus:outline-none border-none placeholder:font-[500]"
              placeholder="Realtor contact info "
            />
          </div>
        </div>
      </div>
    </>
  );
});

BcfpStandard.displayName = "BcfpStandard";

export default BcfpStandard;