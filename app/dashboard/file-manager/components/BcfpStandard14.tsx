import { House, Pencil, Trash, ZoomIn, ZoomOut } from "lucide-react";
import Image from "next/image";
import React, { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { Order } from "../../orders/page";
import "../../../globals.css";
import StyledInput from "./StyledInput";
import FileManagerGallery from "./fileManagerGallery";
import ImageSourceModal from "./ImageSourceModal";
import { featureSheetService } from "../file-manager";
import { FeatureSheetPayload, FeatureSheetResponse } from "../types/featureSheetTypes";

export interface BcfpStandard14Ref {
  exportToPayload: () => Promise<FeatureSheetPayload>;
  importFromPayload: (payload: FeatureSheetResponse) => void;
}

interface BcfpStandard14Props {
  orderData: Order | null;
}

const BcfpStandard14 = forwardRef<BcfpStandard14Ref, BcfpStandard14Props>(
  ({ orderData }, ref) => {
    const [byLawRestrictions, setByLawRestrictions] = useState("");
    const [maintFees, setMaintFees] = useState("");
    const [maintFeesInclude, setMaintFeesInclude] = useState("");
    const [featuresIncluded, setFeaturesIncluded] = useState("");
    const [siteInfluences, setSiteInfluences] = useState("");
    const [amenities, setAmenities] = useState("");
    const [view, setView] = useState("");
    const [description, setDescription] = useState("");
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [propertyName, setPropertyName] = useState("");
    const [amount, setAmount] = useState("");
    const [number, setNumber] = useState("");
    const [addressCode, setAddressCode] = useState("");
    const [roadName, setRoadName] = useState("");
    const [cityLine, setCityLine] = useState("");
    // const [mlsNumber, setMlsNumber] = useState("");
    const [bedroom, setBedroom] = useState("");
    const [bathroom, setBathroom] = useState("");
    const [sqft, setSqft] = useState("");
    const [builtYear, setBuiltYear] = useState("");

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
    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      exportToPayload: async () => {
        const payload = await featureSheetService.buildPayload({
          orderUuid: orderData?.uuid || "",
          templateKey: "BCFPStandard14",
          uploadedBy: "admin",
          type: "template",
          primaryColor: "#3A8D3D",
          offeredAtPrice: amount,
          realtorName: fullName,
          emailLink: email,
          companyName: propertyName,
          propertyNotesTitle: roadName,
          propertyNotesDescription: description,
          expandedDetail1Title: "By-law Restrictions",
          expandedDetail1Description: byLawRestrictions,
          expandedDetail2Title: "Maint. Fees",
          expandedDetail2Description: maintFees,
          expandedDetail3Title: "Maint. Fees Include",
          expandedDetail3Description: maintFeesInclude,
          expandedDetail4Title: "Features Included",
          expandedDetail4Description: featuresIncluded,
          keyHighlightLabel: "Site Influences",
          keyHighlights: siteInfluences ? siteInfluences.split("\n").filter(Boolean) : [],
          otherDetails: {
            amenities,
            view,
            bedroom,
            bathroom,
            sqft,
            builtYear,
            number,
            addressCode,
            cityLine,
          },
          images,
          imageScales: scale,
          imagePositions: position,
        });
        return payload;
      },
      importFromPayload: (payload: FeatureSheetResponse) => {
        const state = featureSheetService.parsePayloadToState(payload);
        if (state.offeredAtPrice) setAmount(state.offeredAtPrice as string);
        if (state.realtorName) setFullName(state.realtorName as string);
        if (state.emailLink) setEmail(state.emailLink as string);
        if (state.companyName) setPropertyName(state.companyName as string);
        if (state.propertyNotesTitle) setRoadName(state.propertyNotesTitle as string);
        if (state.propertyNotesDescription) setDescription(state.propertyNotesDescription as string);

        if (state.expandedDetail1Description) setByLawRestrictions(state.expandedDetail1Description as string);
        if (state.expandedDetail2Description) setMaintFees(state.expandedDetail2Description as string);
        if (state.expandedDetail3Description) setMaintFeesInclude(state.expandedDetail3Description as string);
        if (state.expandedDetail4Description) setFeaturesIncluded(state.expandedDetail4Description as string);

        if (state.keyHighlights) setSiteInfluences(state.keyHighlights.join("\n"));

        if (state.otherDetails) {
          const details = state.otherDetails as Record<string, unknown>;
          if (details.amenities) setAmenities(details.amenities as string);
          if (details.view) setView(details.view as string);
          if (details.bedroom) setBedroom(details.bedroom as string);
          if (details.bathroom) setBathroom(details.bathroom as string);
          if (details.sqft) setSqft(details.sqft as string);
          if (details.builtYear) setBuiltYear(details.builtYear as string);
          if (details.number) setNumber(details.number as string);
          if (details.addressCode) setAddressCode(details.addressCode as string);
          if (details.cityLine) setCityLine(details.cityLine as string);
        }

        if (state.images) setImages(state.images as unknown as typeof images);
        if (state.imageScales) setScale(state.imageScales as unknown as typeof scale);
        if (state.imagePositions) setPosition(state.imagePositions as unknown as typeof position);
      },
    }));

    console.log("orderData", orderData);


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
        <div className="flex">
          <div className="w-full flex flex-col bg-[#ffffff] justify-center font-alexandria relative">
            <div
              className="w-full h-[700px] place-self-center border-2 border-[#fff] relative overflow-hidden flex items-center justify-center group select-none"
              onMouseMove={(e) => handleMouseMove("image1", e)}
              onMouseUp={() => handleMouseUp("image1")}
              onMouseLeave={() => handleMouseLeave("image1")}
            >
              {images.image1 ? (
                <>
                  <div
                    className="w-full h-full flex items-center justify-center transition-transform duration-100 cursor-grab active:cursor-grabbing"
                    onMouseDown={(e) => handleMouseDown("image1", e)}
                    style={{
                      transform: `scale(${scale.image1}) translate(${position.image1.x / scale.image1
                        }px, ${position.image1.y / scale.image1}px)`,
                      transition: dragging.image1
                        ? "none"
                        : "transform 0.2s ease-out",
                    }}
                  >
                    <Image
                      unoptimized
                      src={images.image1}
                      alt="uploaded"
                      width={200}
                      height={300}
                      className="w-full h-full object-cover pointer-events-none"
                    />
                  </div>

                  {/* Zoom Controls */}
                  <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
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

                  {/* Edit & Delete */}
                  <button
                    type="button"
                    onClick={() => openImageSourceModal("image1")}
                    className="absolute top-2 right-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                    title="Edit image"
                  >
                    <Pencil className="w-4 h-4 text-gray-700" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete("image1", fileInputRef1)}
                    className="absolute top-2 right-2 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                    title="Delete image"
                  >
                    <Trash className="w-4 h-4 text-red-500" />
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

            <div className="flex flex-col gap-1 absolute top-0 left-[50px] w-[150px]">
              <div
                className="p-3 pt-[70px]"
                style={{
                  background:
                    "linear-gradient(to right, #3A8D3D 0%, #368038 20%, #337434 38%, #2F6A30 54%, #274C23 100%)",
                }}
              >
                <div className="font-bold text-[11px] text-[#B3B394] flex flex-col">
                  <span className="font-normal">CONTACT:</span>
                  <StyledInput
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    rows={1}
                    className=" text-[11px] text-[#B3B394] h-[18px] bg-transparent text-left w-full focus:outline-none border-none placeholder-[#B3B394] placeholder:font-[500]"
                    placeholder="FIRSTNAME LASTNAME"
                  />
                </div>
                <StyledInput
                  value={propertyName}
                  rows={1}
                  onChange={(e) => setPropertyName(e.target.value)}
                  className=" text-[11px] font-bold h-[18px] font- bg-transparent text-left text-white w-full focus:outline-none border-none placeholder-white placeholder:font-[200]"
                  placeholder="Macdonald Realty"
                />
                <hr className="border-t-2 border-dotted border-white w-full" />
                <div className="flex flex-col ">
                  <div className="flex gap-2 text-white text-[9px]">
                    PHONE:
                    <StyledInput
                      value={number}
                      onChange={(e) => setNumber(e.target.value)}
                      rows={1}
                      className="font-thin inline text-[9px] h-[16px] bg-transparent text-left w-full focus:outline-none border-none placeholder-white placeholder:font-[500]"
                      placeholder="604.000.0000"
                    />
                  </div>
                  <div className="flex gap-2 text-white text-[9px]">
                    EMAIL:
                    <StyledInput
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      rows={1}
                      className="font-thin inline text-[9px] h-[16px] bg-transparent text-left w-[180px] focus:outline-none border-none placeholder-white placeholder:font-[500]"
                      placeholder="FIRST@LAST.COM"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-2 absolute bottom-[70px] right-0 h-[30px]">
              <div
                className="opacity-[25%] w-[35px]"
                style={{
                  background:
                    "linear-gradient(to right, #3A8D3D 0%, #368038 20%, #337434 38%, #2F6A30 54%, #274C23 100%)",
                }}
              ></div>
              <div
                className="opacity-[50%] w-[35px]"
                style={{
                  background:
                    "linear-gradient(to right, #3A8D3D 0%, #368038 20%, #337434 38%, #2F6A30 54%, #274C23 100%)",
                }}
              ></div>
              <div
                className="opacity-[75%] w-[35px]"
                style={{
                  background:
                    "linear-gradient(to right, #3A8D3D 0%, #368038 20%, #337434 38%, #2F6A30 54%, #274C23 100%)",
                }}
              ></div>
              <div
                className="flex w-[350px]"
                style={{
                  background:
                    "linear-gradient(to right, #3A8D3D 0%, #368038 20%, #337434 38%, #2F6A30 54%, #274C23 100%)",
                }}
              ></div>
            </div>
            <div className="absolute bottom-0 right-0 px-6 py-2 z-2 w-[68%] gap-2 flex justify-self-center text-[#B3B394]">
              <span className="flex flex-col mt-1">
                <House className="w-4 h-4" />
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 8 8"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M1.07208 6.90507H1.20908C1.29908 6.90507 1.36508 6.90507 1.41708 6.95207C1.46108 6.99307 1.48508 7.04807 1.48508 7.11207C1.48508 7.22007 1.40508 7.30107 1.28408 7.30107H1.19308L1.47508 7.75507H1.58608L1.35708 7.38907C1.48808 7.37607 1.58608 7.25507 1.58608 7.11207C1.58608 7.01407 1.53908 6.91807 1.46108 6.86707C1.39608 6.81707 1.32508 6.81007 1.23408 6.81007H0.981079V7.75507H1.07208V6.90507Z"
                    fill="#B3B394"
                  />
                  <path
                    d="M1.93073 6.81015V7.75415H2.41973V7.66515H2.02373V7.32915H2.41973V7.23415H2.02373V6.90415H2.41973V6.81015H1.93073Z"
                    fill="#B3B394"
                  />
                  <path
                    d="M3.04311 6.81015L2.67511 7.75415H2.77411L2.88611 7.45715H3.30711L3.42011 7.75415H3.51911L3.15411 6.81015H3.04311ZM3.09611 6.89915L3.27511 7.37315H2.92011L3.09611 6.89915Z"
                    fill="#B3B394"
                  />
                  <path
                    d="M3.7901 6.81015V7.75415H4.2151V7.66515H3.8821V6.81015H3.7901Z"
                    fill="#B3B394"
                  />
                  <path
                    d="M4.39758 6.81015V6.90415H4.58758V7.75415H4.67958V6.90415H4.86958V6.81015H4.39758Z"
                    fill="#B3B394"
                  />
                  <path
                    d="M5.06702 7.27662C5.06702 7.56062 5.27402 7.77362 5.54502 7.77362C5.68702 7.77362 5.80902 7.71862 5.90602 7.61262C5.99002 7.52262 6.03102 7.41062 6.03102 7.27662C6.03102 7.14462 5.98202 7.02362 5.88502 6.93162C5.79302 6.83962 5.68002 6.79162 5.54802 6.79162C5.41702 6.79162 5.30602 6.83962 5.21402 6.92862C5.11902 7.02362 5.06702 7.14462 5.06702 7.27662ZM5.16202 7.27662C5.16202 7.16162 5.22002 7.04762 5.30702 6.97162C5.37602 6.91262 5.45902 6.88262 5.54502 6.88262C5.76502 6.88262 5.93702 7.06462 5.93702 7.27662C5.93702 7.50762 5.76502 7.68462 5.55402 7.68462C5.33602 7.68462 5.16202 7.51362 5.16202 7.27662Z"
                    fill="#B3B394"
                  />
                  <path
                    d="M6.43873 6.90507H6.57373C6.66173 6.90507 6.72973 6.90507 6.77973 6.95207C6.82773 6.99307 6.84873 7.04807 6.84873 7.11207C6.84873 7.22007 6.76873 7.30107 6.64773 7.30107H6.55773L6.83973 7.75507H6.94873L6.71973 7.38907C6.85373 7.37607 6.94873 7.25507 6.94873 7.11207C6.94873 7.01407 6.90173 6.91807 6.82773 6.86707C6.75973 6.81707 6.68873 6.81007 6.60073 6.81007H6.34473V7.75507H6.43873V6.90507Z"
                    fill="#B3B394"
                  />
                  <path
                    d="M0.880005 6.474H6.89398V0.460997H0.880005V6.474ZM4.07703 1.183H4.74799C5.36499 1.245 5.81501 1.728 5.80701 2.328C5.80201 2.92 5.35999 3.386 4.74799 3.449H4.07703V1.183ZM3.42798 5.714H1.73199V1.178H3.42798V5.714ZM4.07703 5.724V3.467L6.427 5.724H4.07703Z"
                    fill="#B3B394"
                  />
                  <path
                    d="M7.07922 6.6356C7.03422 6.6356 6.99122 6.6546 6.96222 6.6886C6.92922 6.7186 6.91022 6.7646 6.91022 6.8076C6.91022 6.8516 6.92722 6.8956 6.96222 6.9276C6.99122 6.9616 7.03422 6.9776 7.07922 6.9776C7.12522 6.9776 7.16922 6.9616 7.20322 6.9276C7.23322 6.8956 7.25122 6.8546 7.25122 6.8076C7.25122 6.7626 7.23322 6.7186 7.20322 6.6886C7.16922 6.6546 7.12722 6.6356 7.07922 6.6356ZM7.23322 6.8076C7.23322 6.8516 7.21822 6.8856 7.19022 6.9156C7.15922 6.9436 7.11922 6.9586 7.07922 6.9586C7.03922 6.9586 7.00322 6.9436 6.97422 6.9156C6.94422 6.8856 6.92922 6.8466 6.92922 6.8076C6.92922 6.7696 6.94422 6.7286 6.97422 6.6976C7.00322 6.6706 7.03822 6.6546 7.07922 6.6546C7.12122 6.6546 7.15922 6.6706 7.19022 6.7016C7.21622 6.7286 7.23322 6.7656 7.23322 6.8076ZM7.08722 6.7066H7.01222V6.9016H7.04322V6.8156H7.08822L7.13122 6.9016H7.16522L7.11922 6.8106C7.15022 6.8076 7.16722 6.7896 7.16722 6.7626C7.16722 6.7236 7.14122 6.7066 7.08722 6.7066ZM7.07922 6.7256C7.11822 6.7256 7.13822 6.7366 7.13822 6.7646C7.13822 6.7896 7.11822 6.7976 7.07922 6.7976H7.04322V6.7256H7.07922Z"
                    fill="#B3B394"
                  />
                </svg>
              </span>
              <p className="text-[10px] leading-tight">
                All information deemed reliable but not guaranteed and should be
                independently verified. All properties are subject to prior sale,
                change or withdrawal. Neither listing broker(s) nor BC Floor Plans
                shall be responsible for any typographical errors, misinformation,
                misprints and shall be held totally harmless.
              </p>
            </div>
            <div className="absolute left-[50px] bottom-[18px] group z-10">
              <div
                className="w-[180px] h-[105px] relative bg-white shadow-md group select-none overflow-hidden"
                onMouseMove={(e) => handleMouseMove("image2", e)}
                onMouseUp={() => handleMouseUp("image2")}
                onMouseLeave={() => handleMouseLeave("image2")}
              >
                {images.image2 ? (
                  <>
                    <div
                      className="w-full h-full flex items-center justify-center transition-transform duration-100 cursor-grab active:cursor-grabbing"
                      onMouseDown={(e) => handleMouseDown("image2", e)}
                      style={{
                        transform: `scale(${scale.image2}) translate(${position.image2.x / scale.image2
                          }px, ${position.image2.y / scale.image2}px)`,
                        transition: dragging.image2
                          ? "none"
                          : "transform 0.2s ease-out",
                      }}
                    >
                      <Image
                        unoptimized
                        src={images.image2}
                        alt="selected"
                        width={200}
                        height={300}
                        className="w-full h-full object-cover pointer-events-none"
                      />
                    </div>

                    {/* Zoom Controls */}
                    <div className="absolute bottom-2 right-2 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
                      <button
                        type="button"
                        onClick={() => handleZoom("image2", "in")}
                        className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                        title="Zoom In"
                      >
                        <ZoomIn className="w-3 h-3 text-gray-700" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleZoom("image2", "out")}
                        className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                        title="Zoom Out"
                      >
                        <ZoomOut className="w-3 h-3 text-gray-700" />
                      </button>
                    </div>

                    {/* Edit & Delete */}
                    <button
                      type="button"
                      onClick={() => openImageSourceModal("image2")}
                      className="absolute top-2 right-10 z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                      title="Edit image"
                    >
                      <Pencil className="w-4 h-4 text-gray-700" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete("image2", fileInputRef2)}
                      className="absolute top-2 right-2 z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                      title="Delete image"
                    >
                      <Trash className="w-4 h-4 text-red-500" />
                    </button>
                  </>
                ) : (
                  <div
                    onClick={() => openImageSourceModal("image2")}
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
          </div>
          <div
            className="w-full flex flex-col pt-[70px]  justify-center gap-3 font-alexandria relative "
            style={{
              background:
                "linear-gradient(to right, #3A8D3D 0%, #368038 20%, #337434 38%, #2F6A30 54%, #274C23 100%)",
            }}
          >
            <div className="relative">
              <div
                className="w-full h-[500px] place-self-center border-2 border-[#fff] relative overflow-hidden flex items-center justify-center group select-none"
                onMouseMove={(e) => handleMouseMove("image3", e)}
                onMouseUp={() => handleMouseUp("image3")}
                onMouseLeave={() => handleMouseLeave("image3")}
              >
                {images.image3 ? (
                  <>
                    <div
                      className="w-full h-full flex items-center justify-center transition-transform duration-100 cursor-grab active:cursor-grabbing"
                      onMouseDown={(e) => handleMouseDown("image3", e)}
                      style={{
                        transform: `scale(${scale.image3}) translate(${position.image3.x / scale.image3
                          }px, ${position.image3.y / scale.image3}px)`,
                        transition: dragging.image3
                          ? "none"
                          : "transform 0.2s ease-out",
                      }}
                    >
                      <Image
                        unoptimized
                        src={images.image3}
                        alt="uploaded"
                        width={200}
                        height={300}
                        className="w-full h-full object-cover pointer-events-none"
                      />
                    </div>

                    {/* Zoom Controls */}
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

                    {/* Edit & Delete */}
                    <button
                      type="button"
                      onClick={() => openImageSourceModal("image3")}
                      className="absolute top-2 right-10 z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                      title="Edit image"
                    >
                      <Pencil className="w-4 h-4 text-gray-700" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete("image3", fileInputRef3)}
                      className="absolute top-2 right-2 z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                      title="Delete image"
                    >
                      <Trash className="w-4 h-4 text-red-500" />
                    </button>
                  </>
                ) : (
                  <div
                    onClick={() => openImageSourceModal("image3")}
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

              <div className="flex gap-2 absolute bottom-[64px] right-0">
                <div
                  className="opacity-[25%] w-[35px]"
                  style={{
                    background:
                      "linear-gradient(to right, #3A8D3D 0%, #368038 20%, #337434 38%, #2F6A30 54%, #274C23 100%)",
                  }}
                ></div>
                <div
                  className="opacity-[50%] w-[35px]"
                  style={{
                    background:
                      "linear-gradient(to right, #3A8D3D 0%, #368038 20%, #337434 38%, #2F6A30 54%, #274C23 100%)",
                  }}
                ></div>
                <div
                  className="opacity-[75%] w-[35px]"
                  style={{
                    background:
                      "linear-gradient(to right, #3A8D3D 0%, #368038 20%, #337434 38%, #2F6A30 54%, #274C23 100%)",
                  }}
                ></div>
                <div
                  className="flex px-5 pr-[10px] py-1"
                  style={{
                    background:
                      "linear-gradient(to right, #3A8D3D 0%, #368038 20%, #337434 38%, #2F6A30 54%, #274C23 100%)",
                  }}
                >
                  <div className="font-bold items-center text-[14px] text-[#B3B394] flex flex-wrap gap-2">
                    <div className="inline">
                      <StyledInput
                        value={bedroom}
                        onChange={(e) => setBedroom(e.target.value)}
                        className="font-semibold text-[13px] bg-transparent text-left w-[20px] h-[20px] focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
                        placeholder="0"
                      />
                    </div>
                    BEDROOM |
                    <div className="inline">
                      <StyledInput
                        value={bathroom}
                        onChange={(e) => setBathroom(e.target.value)}
                        className="font-semibold text-[13px] bg-transparent text-left w-[20px] h-[20px]  focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
                        placeholder="0"
                      />
                    </div>
                    BATHROOM |
                    <div className="inline">
                      <StyledInput
                        value={sqft}
                        onChange={(e) => setSqft(e.target.value)}
                        className="font-semibold text-[13px] bg-transparent text-left h-[20px] w-[45px] focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
                        placeholder="000"
                      />
                    </div>
                    SQ FT | BUILT IN
                    <div className="inline">
                      <StyledInput
                        value={builtYear}
                        onChange={(e) => setBuiltYear(e.target.value)}
                        className="font-semibold text-[13px] bg-transparent text-left h-[20px] w-[45px] focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
                        placeholder="0000"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-1 absolute top-[2px] left-[50px] w-[150px]">
                <div
                  className="p-3"
                  style={{
                    background:
                      "linear-gradient(to right, #3A8D3D 0%, #368038 20%, #337434 38%, #2F6A30 54%, #274C23 100%)",
                  }}
                >
                  <div className="tracking-wide text-white mt-0 flex">
                    #
                    <StyledInput
                      value={addressCode}
                      onChange={(e) => setAddressCode(e.target.value)}
                      className="font-light text-[21px] h-[24px] w-[150px] leading-none mt-0 bg-transparent text-[#ffffff] text-left focus:outline-none border-none placeholder-[#ffffff] placeholder:font-[200]"
                      placeholder="0000-0000"
                    />
                  </div>
                  <div className="text-[13px] text-white font-bold leading-none mt-0 flex">
                    Number
                    <StyledInput
                      value={roadName}
                      onChange={(e) => setRoadName(e.target.value)}
                      className="font-light text-[13px] h-[24px] leading-none mt-0 bg-transparent text-[#ffffff] text-center w-[22px] focus:outline-none border-none placeholder-[#ffffff] placeholder:font-[200]"
                      placeholder="0"
                    />
                    Road
                  </div>
                  <hr className="border-t-2 border-dotted border-white w-full" />
                  <div className="uppercase mt-2 flex justify-center">
                    <StyledInput
                      value={cityLine}
                      rows={2}
                      onChange={(e) => setCityLine(e.target.value)}
                      className="text-[#B3B394] text-[13px] h-[40px] bg-transparent text-center focus:outline-none border-none placeholder-[#B3B394] placeholder:font-[200]"
                      placeholder="BRIGHOUSE SOUTH, RICHMOND"
                    />
                  </div>
                </div>
                <div
                  className="text-[30px] font-light mt-0"
                  style={{
                    background:
                      "linear-gradient(to right, #3A8D3D 0%, #368038 20%, #337434 38%, #2F6A30 54%, #274C23 100%)",
                    opacity: 0.7,
                  }}
                >
                  <StyledInput
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="font-semibold content-center text-center text-[#ffffff] text-[30px] h-[40px] bg-transparent w-full focus:outline-none border-none placeholder-[#ffffff] placeholder:font-[500]"
                    placeholder="$000,000"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-4 pl-[100px] pr-[20px] pb-[50px]">
              <div className="w-[100%]">
                <div className="relative top-[-60px]">
                  <div className="flex flex-col relative justify-center items-center">
                    <div className="grid grid-cols-2 gap-3 w-full">
                      {/* Image 4 */}
                      <div
                        className="w-full h-[175px] border-[2px] border-white shadow-sm place-self-center relative overflow-hidden flex items-center justify-center group select-none"
                        onMouseMove={(e) => handleMouseMove("image4", e)}
                        onMouseUp={() => handleMouseUp("image4")}
                        onMouseLeave={() => handleMouseLeave("image4")}
                      >
                        {images.image4 ? (
                          <>
                            <div
                              className="w-full h-full flex items-center justify-center transition-transform duration-100 cursor-grab active:cursor-grabbing"
                              onMouseDown={(e) => handleMouseDown("image4", e)}
                              style={{
                                transform: `scale(${scale.image4}) translate(${position.image4.x / scale.image4
                                  }px, ${position.image4.y / scale.image4}px)`,
                                transition: dragging.image4
                                  ? "none"
                                  : "transform 0.2s ease-out",
                              }}
                            >
                              <Image
                                unoptimized
                                src={images.image4}
                                alt="uploaded"
                                width={200}
                                height={300}
                                className="w-full h-full object-cover pointer-events-none"
                              />
                            </div>

                            {/* Zoom Controls */}
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

                            {/* Edit & Delete */}
                            <button
                              type="button"
                              onClick={() => openImageSourceModal("image4")}
                              className="absolute top-4 right-10 z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                              title="Edit image"
                            >
                              <Pencil className="w-4 h-4 text-gray-700" />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleDelete("image4", fileInputRef4)
                              }
                              className="absolute top-4 right-2 z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                              title="Delete image"
                            >
                              <Trash className="w-4 h-4 text-red-500" />
                            </button>
                          </>
                        ) : (
                          <div
                            onClick={() => openImageSourceModal("image4")}
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

                      {/* Image 5 */}
                      <div
                        className="w-full h-[175px] border-[2px] border-white shadow-sm place-self-center relative overflow-hidden flex items-center justify-center group select-none"
                        onMouseMove={(e) => handleMouseMove("image5", e)}
                        onMouseUp={() => handleMouseUp("image5")}
                        onMouseLeave={() => handleMouseLeave("image5")}
                      >
                        {images.image5 ? (
                          <>
                            <div
                              className="w-full h-full flex items-center justify-center transition-transform duration-100 cursor-grab active:cursor-grabbing"
                              onMouseDown={(e) => handleMouseDown("image5", e)}
                              style={{
                                transform: `scale(${scale.image5}) translate(${position.image5.x / scale.image5
                                  }px, ${position.image5.y / scale.image5}px)`,
                                transition: dragging.image5
                                  ? "none"
                                  : "transform 0.2s ease-out",
                              }}
                            >
                              <Image
                                unoptimized
                                src={images.image5}
                                alt="uploaded"
                                width={200}
                                height={300}
                                className="w-full h-full object-cover pointer-events-none"
                              />
                            </div>

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
                              onClick={() => openImageSourceModal("image5")}
                              className="absolute top-4 right-10 z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                              title="Edit image"
                            >
                              <Pencil className="w-4 h-4 text-gray-700" />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleDelete("image5", fileInputRef5)
                              }
                              className="absolute top-4 right-2 z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                              title="Delete image"
                            >
                              <Trash className="w-4 h-4 text-red-500" />
                            </button>
                          </>
                        ) : (
                          <div
                            onClick={() => openImageSourceModal("image5")}
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

                      {/* Image 6 */}
                      <div
                        className="w-full h-[175px] border-[2px] border-white shadow-sm place-self-center relative overflow-hidden flex items-center justify-center group select-none"
                        onMouseMove={(e) => handleMouseMove("image6", e)}
                        onMouseUp={() => handleMouseUp("image6")}
                        onMouseLeave={() => handleMouseLeave("image6")}
                      >
                        {images.image6 ? (
                          <>
                            <div
                              className="w-full h-full flex items-center justify-center transition-transform duration-100 cursor-grab active:cursor-grabbing"
                              onMouseDown={(e) => handleMouseDown("image6", e)}
                              style={{
                                transform: `scale(${scale.image6}) translate(${position.image6.x / scale.image6
                                  }px, ${position.image6.y / scale.image6}px)`,
                                transition: dragging.image6
                                  ? "none"
                                  : "transform 0.2s ease-out",
                              }}
                            >
                              <Image
                                unoptimized
                                src={images.image6}
                                alt="uploaded"
                                width={200}
                                height={300}
                                className="w-full h-full object-cover pointer-events-none"
                              />
                            </div>

                            <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
                              <button
                                type="button"
                                onClick={() => handleZoom("image6", "in")}
                                className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                                title="Zoom In"
                              >
                                <ZoomIn className="w-4 h-4 text-gray-700" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleZoom("image6", "out")}
                                className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                                title="Zoom Out"
                              >
                                <ZoomOut className="w-4 h-4 text-gray-700" />
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => openImageSourceModal("image6")}
                              className="absolute top-4 left-2 z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                              title="Edit image"
                            >
                              <Pencil className="w-4 h-4 text-gray-700" />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleDelete("image6", fileInputRef6)
                              }
                              className="absolute top-4 left-10 z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                              title="Delete image"
                            >
                              <Trash className="w-4 h-4 text-red-500" />
                            </button>
                          </>
                        ) : (
                          <div
                            onClick={() => openImageSourceModal("image6")}
                            className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
                          >
                            Select Image
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          ref={fileInputRef6}
                          onChange={(e) => handleImageChange("image6", e)}
                          className="hidden"
                        />
                      </div>

                      {/* Image 7 */}
                      <div
                        className="w-full h-[175px] border-[2px] border-white shadow-sm place-self-center relative overflow-hidden flex items-center justify-center group select-none"
                        onMouseMove={(e) => handleMouseMove("image7", e)}
                        onMouseUp={() => handleMouseUp("image7")}
                        onMouseLeave={() => handleMouseLeave("image7")}
                      >
                        {images.image7 ? (
                          <>
                            <div
                              className="w-full h-full flex items-center justify-center transition-transform duration-100 cursor-grab active:cursor-grabbing"
                              onMouseDown={(e) => handleMouseDown("image7", e)}
                              style={{
                                transform: `scale(${scale.image7}) translate(${position.image7.x / scale.image7
                                  }px, ${position.image7.y / scale.image7}px)`,
                                transition: dragging.image7
                                  ? "none"
                                  : "transform 0.2s ease-out",
                              }}
                            >
                              <Image
                                unoptimized
                                src={images.image7}
                                alt="uploaded"
                                width={200}
                                height={300}
                                className="w-full h-full object-cover pointer-events-none"
                              />
                            </div>

                            <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
                              <button
                                type="button"
                                onClick={() => handleZoom("image7", "in")}
                                className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                                title="Zoom In"
                              >
                                <ZoomIn className="w-4 h-4 text-gray-700" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleZoom("image7", "out")}
                                className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                                title="Zoom Out"
                              >
                                <ZoomOut className="w-4 h-4 text-gray-700" />
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => openImageSourceModal("image7")}
                              className="absolute top-4 right-10 z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                              title="Edit image"
                            >
                              <Pencil className="w-4 h-4 text-gray-700" />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleDelete("image7", fileInputRef7)
                              }
                              className="absolute top-4 right-2 z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                              title="Delete image"
                            >
                              <Trash className="w-4 h-4 text-red-500" />
                            </button>
                          </>
                        ) : (
                          <div
                            onClick={() => openImageSourceModal("image7")}
                            className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
                          >
                            Select Image
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          ref={fileInputRef7}
                          onChange={(e) => handleImageChange("image7", e)}
                          className="hidden"
                        />
                      </div>
                    </div>
                    <div className="absolute  group z-10">
                      <div
                        className="w-[200px] h-[130px] relative bg-white shadow-md group select-none overflow-hidden flex items-center justify-center"
                        onMouseMove={(e) => handleMouseMove("image8", e)}
                        onMouseUp={() => handleMouseUp("image8")}
                        onMouseLeave={() => handleMouseLeave("image8")}
                      >
                        {images.image8 ? (
                          <>
                            <div
                              className="w-full h-full flex items-center justify-center transition-transform duration-100 cursor-grab active:cursor-grabbing"
                              onMouseDown={(e) => handleMouseDown("image8", e)}
                              style={{
                                transform: `scale(${scale.image8}) translate(${position.image8.x / scale.image8
                                  }px, ${position.image8.y / scale.image8}px)`,
                                transition: dragging.image8
                                  ? "none"
                                  : "transform 0.2s ease-out",
                              }}
                            >
                              <Image
                                unoptimized
                                src={images.image8}
                                alt="selected"
                                width={200}
                                height={300}
                                className="w-full h-full object-cover pointer-events-none"
                              />
                            </div>

                            {/* Zoom Controls */}
                            <div className="absolute bottom-2 right-2 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
                              <button
                                type="button"
                                onClick={() => handleZoom("image8", "in")}
                                className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                                title="Zoom In"
                              >
                                <ZoomIn className="w-4 h-4 text-gray-700" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleZoom("image8", "out")}
                                className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                                title="Zoom Out"
                              >
                                <ZoomOut className="w-4 h-4 text-gray-700" />
                              </button>
                            </div>

                            {/* Edit & Delete */}
                            <button
                              type="button"
                              onClick={() => openImageSourceModal("image8")}
                              className="absolute top-2 right-10 z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                              title="Edit image"
                            >
                              <Pencil className="w-4 h-4 text-gray-700" />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleDelete("image8", fileInputRef8)
                              }
                              className="absolute top-2 right-2 z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                              title="Delete image"
                            >
                              <Trash className="w-4 h-4 text-red-500" />
                            </button>
                          </>
                        ) : (
                          <div
                            onClick={() => openImageSourceModal("image8")}
                            className="w-[200px] h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
                          >
                            Select Image
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          ref={fileInputRef8}
                          onChange={(e) => handleImageChange("image8", e)}
                          className="hidden"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          className="flex gap-8 p-[40px] relative"
          style={{
            background:
              "linear-gradient(to right, #3A8D3D 0%, #368038 20%, #337434 38%, #2F6A30 54%, #274C23 100%)",
          }}
        >
          <div className="w-1/2 flex flex-col gap-4">
            <div className="flex gap-4">
              <div className="w-6/12">
                <h2 className="text-[22px] px-5 text-center tracking-[-1px] font-bold text-[#B3B394]">
                  ON TOP OF IT ALL!
                </h2>
                <h2 className="text-[16px] px-5 text-center tracking-[-1px] font-bold text-[#B3B394]">
                  BEAUTIFUL SUB-PENTHOUSE IN THE WELL APPOINTED CENTRO BUILDING.
                </h2>
                <StyledInput
                  value={description}
                  rows={8}
                  onChange={(e) => setDescription(e.target.value)}
                  className="font-normal text-[10px] max-h-[300px] z-20 text-white leading-[1.6] italic bg-transparent text-left focus:outline-none border-none placeholder-white placeholder:font-[500]"
                  placeholder="This centrally located 2 bedroom, 2 bathroom home boasts incredible, totally unobstructed VIEWS overlooking Brighouse Park & to the South
                  and South Westproviding unhindered privacy. The perfect floorplan with open concept living and cross unit bedrooms. Dark laminate flooring,
                  S/S appliances, Gas range and a large open ‘den/nook’ area perfect for the home office. Huge private balcony, great building amenities
                  including exercise room, sauna, roof top courtyard and outdoor kids playground. With parking, and storage locker and balance of the the 5-10
                  warranty, this home provides nothing but exceptional value. Call today to set up your viewing. MLS # 000000"
                />
                <div className="grid grid-cols-2 text-white">
                  <div>
                    <div>
                      <span className="font-bold text-[#B3B394] text-[12px]">
                        BY-LAW RESTRICTIONS:
                      </span>
                      <StyledInput
                        value={byLawRestrictions}
                        rows={1}
                        onChange={(e) => setByLawRestrictions(e.target.value)}
                        className="font-semibold text-[8px] bg-transparent text-left w-full focus:outline-none border-none placeholder-[#FFFFFF] placeholder:font-[500]"
                        placeholder="Pets Allowed w/Rest., Rentals Allowed"
                      />
                    </div>
                    <div>
                      <span className="font-bold text-[#B3B394] text-[12px]">
                        MAINT. FEES:
                      </span>
                      <StyledInput
                        value={maintFees}
                        rows={1}
                        onChange={(e) => setMaintFees(e.target.value)}
                        className="font-semibold text-[8px] bg-transparent text-left w-full focus:outline-none border-none placeholder-[#FFFFFF] placeholder:font-[500]"
                        placeholder="$000.00"
                      />
                    </div>
                    <div>
                      <span className="font-bold text-[#B3B394] text-[12px]">
                        MAINT. FEES INCLUDE:
                      </span>
                      <StyledInput
                        value={maintFeesInclude}
                        onChange={(e) => setMaintFeesInclude(e.target.value)}
                        className="font-semibold text-[8px] bg-transparent text-left w-full focus:outline-none border-none placeholder-[#ffffff] placeholder:font-[500]"
                        placeholder="Gardening, Garbage Pickup, Gas, Hot Water, Management, Recreation Facility, Other, Caretaker"
                      />
                    </div>
                    <div>
                      <span className="font-bold text-[#B3B394] text-[12px]">
                        FEATURES INCLUDED:
                      </span>
                      <StyledInput
                        value={featuresIncluded}
                        onChange={(e) => setFeaturesIncluded(e.target.value)}
                        className="font-semibold text-[8px] bg-transparent text-left w-full focus:outline-none border-none placeholder-[#fff] placeholder:font-[500]"
                        placeholder="Clothes Washer/Dryer/ Fridge/Stove/DW, Drapes/ Window Coverings"
                      />
                    </div>
                  </div>
                  <div>
                    <div>
                      <span className="font-bold text-[#B3B394] text-[12px]">
                        SITE INFLUENCES:
                      </span>
                      <StyledInput
                        value={siteInfluences}
                        onChange={(e) => setSiteInfluences(e.target.value)}
                        className="font-semibold text-[8px] bg-transparent text-left w-full focus:outline-none border-none placeholder-[#FFFFFF] placeholder:font-[500]"
                        placeholder="Central Location, Golf Course Nearby, Recreation Nearby, Shopping Nearby"
                      />
                    </div>
                    <div>
                      <span className="font-bold text-[#B3B394] text-[12px]">
                        AMENITIES:
                      </span>
                      <StyledInput
                        value={amenities}
                        onChange={(e) => setAmenities(e.target.value)}
                        className="font-semibold text-[8px] bg-transparent text-left w-full focus:outline-none border-none placeholder-[#FFFFFF] placeholder:font-[500]"
                        placeholder="Exercise Centre, Garden, In Suite Laundry, Sauna/Steam Room"
                      />
                    </div>
                    <div>
                      <span className="font-bold text-[#B3B394] text-[12px]">
                        VIEW:
                      </span>
                      <StyledInput
                        value={view}
                        rows={1}
                        onChange={(e) => setView(e.target.value)}
                        className="font-semibold text-[8px] bg-transparent text-left w-full focus:outline-none border-none placeholder-[#FFFFFF] placeholder:font-[500]"
                        placeholder="South & SW - Van Isl."
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 w-6/12">
                {/* Image 9 */}
                <div
                  className="h-[200px] border-[2px] border-white shadow-sm relative z-10 group select-none overflow-hidden flex items-center justify-center"
                  onMouseMove={(e) => handleMouseMove("image9", e)}
                  onMouseUp={() => handleMouseUp("image9")}
                  onMouseLeave={() => handleMouseLeave("image9")}
                >
                  {images.image9 ? (
                    <>
                      <div
                        className="w-full h-full flex items-center justify-center transition-transform duration-100 cursor-grab active:cursor-grabbing"
                        onMouseDown={(e) => handleMouseDown("image9", e)}
                        style={{
                          transform: `scale(${scale.image9}) translate(${position.image9.x / scale.image9
                            }px, ${position.image9.y / scale.image9}px)`,
                          transition: dragging.image9
                            ? "none"
                            : "transform 0.2s ease-out",
                        }}
                      >
                        <Image
                          unoptimized
                          src={images.image9}
                          alt="uploaded"
                          width={200}
                          height={300}
                          className="w-full h-full object-cover pointer-events-none"
                        />
                      </div>

                      {/* Zoom Controls */}
                      <div className="absolute bottom-2 right-2 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
                        <button
                          type="button"
                          onClick={() => handleZoom("image9", "in")}
                          className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                          title="Zoom In"
                        >
                          <ZoomIn className="w-4 h-4 text-gray-700" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleZoom("image9", "out")}
                          className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                          title="Zoom Out"
                        >
                          <ZoomOut className="w-4 h-4 text-gray-700" />
                        </button>
                      </div>

                      {/* Edit & Delete */}
                      <button
                        type="button"
                        onClick={() => openImageSourceModal("image9")}
                        className="absolute top-2 right-10 z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                        title="Edit image"
                      >
                        <Pencil className="w-4 h-4 text-gray-700" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete("image9", fileInputRef9)}
                        className="absolute top-2 right-2 z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                        title="Delete image"
                      >
                        <Trash className="w-4 h-4 text-red-500" />
                      </button>
                    </>
                  ) : (
                    <div
                      onClick={() => openImageSourceModal("image9")}
                      className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
                    >
                      Select Image
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef9}
                    onChange={(e) => handleImageChange("image9", e)}
                    className="hidden"
                  />
                </div>

                {/* Image 10 */}
                <div
                  className="h-[200px] border-[2px] border-white shadow-sm relative z-10 group select-none overflow-hidden flex items-center justify-center"
                  onMouseMove={(e) => handleMouseMove("image10", e)}
                  onMouseUp={() => handleMouseUp("image10")}
                  onMouseLeave={() => handleMouseLeave("image10")}
                >
                  {images.image10 ? (
                    <>
                      <div
                        className="w-full h-full flex items-center justify-center transition-transform duration-100 cursor-grab active:cursor-grabbing"
                        onMouseDown={(e) => handleMouseDown("image10", e)}
                        style={{
                          transform: `scale(${scale.image10}) translate(${position.image10.x / scale.image10
                            }px, ${position.image10.y / scale.image10}px)`,
                          transition: dragging.image10
                            ? "none"
                            : "transform 0.2s ease-out",
                        }}
                      >
                        <Image
                          unoptimized
                          src={images.image10}
                          alt="uploaded"
                          width={200}
                          height={300}
                          className="w-full h-full object-cover pointer-events-none"
                        />
                      </div>

                      {/* Zoom Controls */}
                      <div className="absolute bottom-2 right-2 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
                        <button
                          type="button"
                          onClick={() => handleZoom("image10", "in")}
                          className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                          title="Zoom In"
                        >
                          <ZoomIn className="w-4 h-4 text-gray-700" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleZoom("image10", "out")}
                          className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                          title="Zoom Out"
                        >
                          <ZoomOut className="w-4 h-4 text-gray-700" />
                        </button>
                      </div>

                      {/* Edit & Delete */}
                      <button
                        type="button"
                        onClick={() => openImageSourceModal("image10")}
                        className="absolute top-2 right-10 z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                        title="Edit image"
                      >
                        <Pencil className="w-4 h-4 text-gray-700" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete("image10", fileInputRef10)}
                        className="absolute top-2 right-2 z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                        title="Delete image"
                      >
                        <Trash className="w-4 h-4 text-red-500" />
                      </button>
                    </>
                  ) : (
                    <div
                      onClick={() => openImageSourceModal("image10")}
                      className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
                    >
                      Select Image
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef10}
                    onChange={(e) => handleImageChange("image10", e)}
                    className="hidden"
                  />
                </div>
              </div>
            </div>
            <div
              className="w-full h-[420px] border-[2px] border-white shadow-sm place-self-center z-10 relative overflow-hidden flex items-center justify-center group select-none"
              onMouseMove={(e) => handleMouseMove("image11", e)}
              onMouseUp={() => handleMouseUp("image11")}
              onMouseLeave={() => handleMouseLeave("image11")}
            >
              {images.image11 ? (
                <>
                  <div
                    className="w-full h-full flex items-center justify-center transition-transform duration-100 cursor-grab active:cursor-grabbing"
                    onMouseDown={(e) => handleMouseDown("image11", e)}
                    style={{
                      transform: `scale(${scale.image11}) translate(${position.image11.x / scale.image11
                        }px, ${position.image11.y / scale.image11}px)`,
                      transition: dragging.image11
                        ? "none"
                        : "transform 0.2s ease-out",
                    }}
                  >
                    <Image
                      unoptimized
                      src={images.image11}
                      alt="uploaded"
                      width={200}
                      height={300}
                      className="w-full h-full object-cover pointer-events-none"
                    />
                  </div>

                  {/* Zoom Controls */}
                  <div className="absolute bottom-2 right-2 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
                    <button
                      type="button"
                      onClick={() => handleZoom("image11", "in")}
                      className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                      title="Zoom In"
                    >
                      <ZoomIn className="w-4 h-4 text-gray-700" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleZoom("image11", "out")}
                      className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                      title="Zoom Out"
                    >
                      <ZoomOut className="w-4 h-4 text-gray-700" />
                    </button>
                  </div>

                  {/* Edit & Delete */}
                  <button
                    type="button"
                    onClick={() => openImageSourceModal("image11")}
                    className="absolute top-24 right-10 z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                    title="Edit image"
                  >
                    <Pencil className="w-4 h-4 text-gray-700" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete("image11", fileInputRef11)}
                    className="absolute top-24 right-2 z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                    title="Delete image"
                  >
                    <Trash className="w-4 h-4 text-red-500" />
                  </button>
                </>
              ) : (
                <div
                  onClick={() => openImageSourceModal("image11")}
                  className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
                >
                  Select Image
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef11}
                onChange={(e) => handleImageChange("image11", e)}
                className="hidden"
              />
            </div>
          </div>
          <div className="w-1/2 flex gap-4">
            <div className="w-full flex flex-col gap-4 ">
              <div className="grid grid-cols-2 gap-4">
                <div
                  className="h-[200px] relative z-10 group border-[2px] border-white shadow-sm select-none overflow-hidden flex items-center justify-center"
                  onMouseMove={(e) => handleMouseMove("image12", e)}
                  onMouseUp={() => handleMouseUp("image12")}
                  onMouseLeave={() => handleMouseLeave("image12")}
                >
                  {images.image12 ? (
                    <>
                      <div
                        className="w-full h-full flex items-center justify-center transition-transform duration-100 cursor-grab active:cursor-grabbing"
                        onMouseDown={(e) => handleMouseDown("image12", e)}
                        style={{
                          transform: `scale(${scale.image12}) translate(${position.image12.x / scale.image12
                            }px, ${position.image12.y / scale.image12}px)`,
                          transition: dragging.image12
                            ? "none"
                            : "transform 0.2s ease-out",
                        }}
                      >
                        <Image
                          unoptimized
                          src={images.image12}
                          alt="uploaded"
                          width={200}
                          height={300}
                          className="w-full h-full object-cover pointer-events-none"
                        />
                      </div>

                      {/* Zoom Controls */}
                      <div className="absolute bottom-2 right-2 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
                        <button
                          type="button"
                          onClick={() => handleZoom("image12", "in")}
                          className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                          title="Zoom In"
                        >
                          <ZoomIn className="w-4 h-4 text-gray-700" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleZoom("image12", "out")}
                          className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                          title="Zoom Out"
                        >
                          <ZoomOut className="w-4 h-4 text-gray-700" />
                        </button>
                      </div>

                      {/* Edit & Delete */}
                      <button
                        type="button"
                        onClick={() => openImageSourceModal("image12")}
                        className="absolute top-2 right-10 z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                        title="Edit image"
                      >
                        <Pencil className="w-4 h-4 text-gray-700" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete("image12", fileInputRef12)}
                        className="absolute top-2 right-2 z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                        title="Delete image"
                      >
                        <Trash className="w-4 h-4 text-red-500" />
                      </button>
                    </>
                  ) : (
                    <div
                      onClick={() => openImageSourceModal("image12")}
                      className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
                    >
                      Select Image
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef12}
                    onChange={(e) => handleImageChange("image12", e)}
                    className="hidden"
                  />
                </div>

                <div
                  className="h-[200px] relative z-10 group border-[2px] border-white shadow-sm select-none overflow-hidden flex items-center justify-center"
                  onMouseMove={(e) => handleMouseMove("image13", e)}
                  onMouseUp={() => handleMouseUp("image13")}
                  onMouseLeave={() => handleMouseLeave("image13")}
                >
                  {images.image13 ? (
                    <>
                      <div
                        className="w-full h-full flex items-center justify-center transition-transform duration-100 cursor-grab active:cursor-grabbing"
                        onMouseDown={(e) => handleMouseDown("image13", e)}
                        style={{
                          transform: `scale(${scale.image13}) translate(${position.image13.x / scale.image13
                            }px, ${position.image13.y / scale.image13}px)`,
                          transition: dragging.image13
                            ? "none"
                            : "transform 0.2s ease-out",
                        }}
                      >
                        <Image
                          unoptimized
                          src={images.image13}
                          alt="uploaded"
                          width={200}
                          height={300}
                          className="w-full h-full object-cover pointer-events-none"
                        />
                      </div>

                      {/* Zoom Controls */}
                      <div className="absolute bottom-2 right-2 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
                        <button
                          type="button"
                          onClick={() => handleZoom("image13", "in")}
                          className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                          title="Zoom In"
                        >
                          <ZoomIn className="w-4 h-4 text-gray-700" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleZoom("image13", "out")}
                          className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                          title="Zoom Out"
                        >
                          <ZoomOut className="w-4 h-4 text-gray-700" />
                        </button>
                      </div>

                      {/* Edit & Delete */}
                      <button
                        type="button"
                        onClick={() => openImageSourceModal("image13")}
                        className="absolute top-2 right-10 z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                        title="Edit image"
                      >
                        <Pencil className="w-4 h-4 text-gray-700" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete("image13", fileInputRef13)}
                        className="absolute top-2 right-2 z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                        title="Delete image"
                      >
                        <Trash className="w-4 h-4 text-red-500" />
                      </button>
                    </>
                  ) : (
                    <div
                      onClick={() => openImageSourceModal("image13")}
                      className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
                    >
                      Select Image
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef13}
                    onChange={(e) => handleImageChange("image13", e)}
                    className="hidden"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div
                  className="h-[200px] relative z-10 group border-[2px] border-white shadow-sm select-none overflow-hidden flex items-center justify-center"
                  onMouseMove={(e) => handleMouseMove("image14", e)}
                  onMouseUp={() => handleMouseUp("image14")}
                  onMouseLeave={() => handleMouseLeave("image14")}
                >
                  {images.image14 ? (
                    <>
                      <div
                        className="w-full h-full flex items-center justify-center transition-transform duration-100 cursor-grab active:cursor-grabbing"
                        onMouseDown={(e) => handleMouseDown("image14", e)}
                        style={{
                          transform: `scale(${scale.image14}) translate(${position.image14.x / scale.image14
                            }px, ${position.image14.y / scale.image14}px)`,
                          transition: dragging.image14
                            ? "none"
                            : "transform 0.2s ease-out",
                        }}
                      >
                        <Image
                          unoptimized
                          src={images.image14}
                          alt="uploaded"
                          width={200}
                          height={300}
                          className="w-full h-full object-cover pointer-events-none"
                        />
                      </div>

                      {/* Zoom Controls */}
                      <div className="absolute bottom-2 right-2 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
                        <button
                          type="button"
                          onClick={() => handleZoom("image14", "in")}
                          className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                          title="Zoom In"
                        >
                          <ZoomIn className="w-4 h-4 text-gray-700" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleZoom("image14", "out")}
                          className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                          title="Zoom Out"
                        >
                          <ZoomOut className="w-4 h-4 text-gray-700" />
                        </button>
                      </div>

                      {/* Edit & Delete */}
                      <button
                        type="button"
                        onClick={() => openImageSourceModal("image14")}
                        className="absolute top-2 right-10 z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                        title="Edit image"
                      >
                        <Pencil className="w-4 h-4 text-gray-700" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete("image14", fileInputRef14)}
                        className="absolute top-2 right-2 z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                        title="Delete image"
                      >
                        <Trash className="w-4 h-4 text-red-500" />
                      </button>
                    </>
                  ) : (
                    <div
                      onClick={() => openImageSourceModal("image14")}
                      className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
                    >
                      Select Image
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef14}
                    onChange={(e) => handleImageChange("image14", e)}
                    className="hidden"
                  />
                </div>

                <div
                  className="h-[200px] relative z-10 group border-[2px] border-white shadow-sm select-none overflow-hidden flex items-center justify-center"
                  onMouseMove={(e) => handleMouseMove("image15", e)}
                  onMouseUp={() => handleMouseUp("image15")}
                  onMouseLeave={() => handleMouseLeave("image15")}
                >
                  {images.image15 ? (
                    <>
                      <div
                        className="w-full h-full flex items-center justify-center transition-transform duration-100 cursor-grab active:cursor-grabbing"
                        onMouseDown={(e) => handleMouseDown("image15", e)}
                        style={{
                          transform: `scale(${scale.image15}) translate(${position.image15.x / scale.image15
                            }px, ${position.image15.y / scale.image15}px)`,
                          transition: dragging.image15
                            ? "none"
                            : "transform 0.2s ease-out",
                        }}
                      >
                        <Image
                          unoptimized
                          src={images.image15}
                          alt="uploaded"
                          width={200}
                          height={300}
                          className="w-full h-full object-cover pointer-events-none"
                        />
                      </div>

                      {/* Zoom Controls */}
                      <div className="absolute bottom-2 right-2 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
                        <button
                          type="button"
                          onClick={() => handleZoom("image15", "in")}
                          className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                          title="Zoom In"
                        >
                          <ZoomIn className="w-4 h-4 text-gray-700" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleZoom("image15", "out")}
                          className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                          title="Zoom Out"
                        >
                          <ZoomOut className="w-4 h-4 text-gray-700" />
                        </button>
                      </div>

                      {/* Edit & Delete */}
                      <button
                        type="button"
                        onClick={() => openImageSourceModal("image15")}
                        className="absolute top-2 right-10 z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                        title="Edit image"
                      >
                        <Pencil className="w-4 h-4 text-gray-700" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete("image15", fileInputRef15)}
                        className="absolute top-2 right-2 z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                        title="Delete image"
                      >
                        <Trash className="w-4 h-4 text-red-500" />
                      </button>
                    </>
                  ) : (
                    <div
                      onClick={() => openImageSourceModal("image15")}
                      className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
                    >
                      Select Image
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef15}
                    onChange={(e) => handleImageChange("image15", e)}
                    className="hidden"
                  />
                </div>
              </div>
              <div
                className="h-[420px] relative z-10 group select-none overflow-hidden flex items-center justify-center border-[2px] border-white shadow-sm"
                onMouseMove={(e) => handleMouseMove("image16", e)}
                onMouseUp={() => handleMouseUp("image16")}
                onMouseLeave={() => handleMouseLeave("image16")}
              >
                {images.image16 ? (
                  <>
                    <div
                      className="w-full h-full flex items-center justify-center transition-transform duration-100 cursor-grab active:cursor-grabbing"
                      onMouseDown={(e) => handleMouseDown("image16", e)}
                      style={{
                        transform: `scale(${scale.image16}) translate(${position.image16.x / scale.image16
                          }px, ${position.image16.y / scale.image16}px)`,
                        transition: dragging.image16
                          ? "none"
                          : "transform 0.2s ease-out",
                      }}
                    >
                      <Image
                        unoptimized
                        src={images.image16}
                        alt="uploaded"
                        width={200}
                        height={300}
                        className="w-full h-full object-cover pointer-events-none"
                      />
                    </div>

                    {/* Zoom Controls */}
                    <div className="absolute bottom-2 right-2 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
                      <button
                        type="button"
                        onClick={() => handleZoom("image16", "in")}
                        className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                        title="Zoom In"
                      >
                        <ZoomIn className="w-4 h-4 text-gray-700" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleZoom("image16", "out")}
                        className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                        title="Zoom Out"
                      >
                        <ZoomOut className="w-4 h-4 text-gray-700" />
                      </button>
                    </div>

                    {/* Edit & Delete */}
                    <button
                      type="button"
                      onClick={() => openImageSourceModal("image16")}
                      className="absolute top-2 right-10 z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                      title="Edit image"
                    >
                      <Pencil className="w-4 h-4 text-gray-700" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete("image16", fileInputRef16)}
                      className="absolute top-2 right-2 z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                      title="Delete image"
                    >
                      <Trash className="w-4 h-4 text-red-500" />
                    </button>
                  </>
                ) : (
                  <div
                    onClick={() => openImageSourceModal("image16")}
                    className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
                  >
                    Select Image
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef16}
                  onChange={(e) => handleImageChange("image16", e)}
                  className="hidden"
                />
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }
);

BcfpStandard14.displayName = "BcfpStandard14";

export default BcfpStandard14;
