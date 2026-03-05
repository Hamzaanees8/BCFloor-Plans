import { House, Pencil, Trash, ZoomIn, ZoomOut } from "lucide-react";
import Image from "next/image";
import React, { forwardRef, useImperativeHandle, useRef, useState, useEffect } from "react";
import { Order } from "../../orders/page";
import "../../../globals.css";
import StyledInput from "./StyledInput";
import FileManagerGallery from "./fileManagerGallery";
import { useFileManagerContext } from "../FileManagerContext";
import { featureSheetService } from "../file-manager";
import { FeatureSheetResponse, FeatureSheetPayload } from "../types/featureSheetTypes";

export interface BcfpStandard8Ref {
  exportToPayload: () => Promise<FeatureSheetPayload>;
  importFromPayload: (payload: FeatureSheetResponse) => void;
}

interface BcfpStandard8Props {
  orderData: Order | null;
}

const BcfpStandard8 = forwardRef<BcfpStandard8Ref, BcfpStandard8Props>(({ orderData }, ref) => {
  // Form state
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
  const [mlsNumber, setMlsNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [number, setNumber] = useState("");
  const [address, setAddress] = useState("");
  const [addressCode, setAddressCode] = useState("");
  const [roadName, setRoadName] = useState("");
  const [cityLine, setCityLine] = useState("");
  const [bedroom, setBedroom] = useState("");
  const [bathroom, setBathroom] = useState("");
  const [sqft, setSqft] = useState("");
  const [builtYear, setBuiltYear] = useState("");

  // Unified images state
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
  });

  // Zoom and pan states
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
  });

  // File manager gallery state
  const [showImageSourceModal, setShowImageSourceModal] = useState(false);
  const [currentImageSlot, setCurrentImageSlot] = useState<string | null>(null);
  const [showGallery, setShowGallery] = useState(false);

  const openImageSourceModal = (slot: string | null) => {
    setCurrentImageSlot(slot);
    setShowImageSourceModal(true);
  };

  // Refs
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

  const { formData, updateFormData } = useFileManagerContext();

  // Initial sync from context on mount
  useEffect(() => {
    if (formData) {
      if (formData.byLawRestrictions) setByLawRestrictions(formData.byLawRestrictions);
      if (formData.maintenanceFees) setMaintFees(formData.maintenanceFees);
      if (formData.maintenanceFeesInclude) setMaintFeesInclude(formData.maintenanceFeesInclude);
      if (formData.featuresIncluded) setFeaturesIncluded(formData.featuresIncluded);
      if (formData.siteInfluences) setSiteInfluences(formData.siteInfluences);
      if (formData.amenities) setAmenities(formData.amenities);
      if (formData.view) setView(formData.view);
      if (formData.description) setDescription(formData.description);
      if (formData.fullName) setFullName(formData.fullName);
      if (formData.email) setEmail(formData.email);
      if (formData.mlsNumber) setMlsNumber(formData.mlsNumber);
      if (formData.amount) setAmount(formData.amount);
      if (formData.number) setNumber(formData.number);
      if (formData.address) setAddress(formData.address);
      if (formData.addressCode) setAddressCode(formData.addressCode);
      if (formData.roadName) setRoadName(formData.roadName);
      if (formData.cityLine) setCityLine(formData.cityLine);
      if (formData.bedroom) setBedroom(formData.bedroom);
      if (formData.bathroom) setBathroom(formData.bathroom);
      if (formData.sqft) setSqft(formData.sqft);
      if (formData.builtYear) setBuiltYear(formData.builtYear);

      if (formData.images) {
        setImages(prev => ({ ...prev, ...(formData.images as typeof images) }));
      }
      if (formData.imageScales) {
        setScale(prev => ({ ...prev, ...(formData.imageScales as typeof scale) }));
      }
      if (formData.imagePositions) {
        setPosition(prev => ({ ...prev, ...(formData.imagePositions as typeof position) }));
      }
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update context when local state changes
  useEffect(() => {
    updateFormData({
      byLawRestrictions,
      maintenanceFees: maintFees,
      maintenanceFeesInclude: maintFeesInclude,
      featuresIncluded,
      siteInfluences,
      amenities,
      view,
      description,
      fullName,
      email,
      mlsNumber,
      amount,
      number,
      address,
      addressCode,
      roadName,
      cityLine,
      bedroom,
      bathroom,
      sqft,
      builtYear,
      images,
      imageScales: scale,
      imagePositions: position
    });
  }, [
    byLawRestrictions, maintFees, maintFeesInclude, featuresIncluded, siteInfluences,
    amenities, view, description, fullName, email, mlsNumber, amount, number,
    address, addressCode, roadName, cityLine, bedroom, bathroom, sqft, builtYear,
    images, scale, position, updateFormData
  ]);

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    exportToPayload: async () => {
      const payload = await featureSheetService.buildPayload({
        orderUuid: orderData?.uuid || "",
        templateKey: "BCFPStandard8",
        uploadedBy: "admin",
        type: "template",
        primaryColor: "#647074",
        offeredAtPrice: amount,
        realtorName: fullName,
        emailLink: email,
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
          address,
          addressCode,
          cityLine,
          mlsNumber
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
        if (details.address) setAddress(details.address as string);
        if (details.addressCode) setAddressCode(details.addressCode as string);
        if (details.cityLine) setCityLine(details.cityLine as string);
        if (details.roadName) setRoadName(details.roadName as string);
        if (details.mlsNumber) setMlsNumber(details.mlsNumber as string);
      }

      if (state.images) setImages((prev) => ({ ...prev, ...(state.images as unknown as typeof images) }));
      if (state.imageScales) setScale((prev) => ({ ...prev, ...(state.imageScales as unknown as typeof scale) }));
      if (state.imagePositions) setPosition((prev) => ({ ...prev, ...(state.imagePositions as unknown as typeof position) }));
    },
  }));

  // Unified handlers
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
        default:
          break;
      }
    } else if (source === 'gallery') {
      setShowGallery(true);
    }
  };

  const handleGalleryImageSelect = (imageUrl: string) => {
    if (!currentImageSlot) return;

    setImages(prev => ({ ...prev, [currentImageSlot]: imageUrl }));
    setShowGallery(false);
    setCurrentImageSlot(null);
  };

  // Helper function to render image with controls
  const renderImageWithControls = (
    key: keyof typeof images,
    ref: React.RefObject<HTMLInputElement | null>,
    containerClass: string = "",
    showZoomControls: boolean = true
  ) => (
    <div
      className={`relative overflow-hidden flex items-center justify-center group ${containerClass}`}
      onMouseDown={(e) => handleMouseDown(key, e)}
      onMouseMove={(e) => handleMouseMove(key, e)}
      onMouseUp={() => handleMouseUp(key)}
      onMouseLeave={() => handleMouseLeave(key)}
    >
      {images[key] ? (
        <>
          <Image
            unoptimized
            src={images[key]!}
            alt="uploaded"
            width={200}
            height={300}
            className="w-full h-full object-cover transition-transform duration-150"
            style={{
              transform: `scale(${scale[key]}) translate(${position[key].x}px, ${position[key].y}px)`,
              cursor: dragging[key]
                ? "grabbing"
                : scale[key] > 1
                  ? "grab"
                  : "default",
            }}
          />

          {showZoomControls && scale[key] > 1 && (
            <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
              <button
                type="button"
                onClick={() => handleZoom(key, "in")}
                className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4 text-gray-700" />
              </button>
              <button
                type="button"
                onClick={() => handleZoom(key, "out")}
                className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4 text-gray-700" />
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => openImageSourceModal(key)}
            className="absolute top-2 right-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
            title="Edit image"
          >
            <Pencil className="w-4 h-4 text-gray-700" />
          </button>

          <button
            type="button"
            onClick={() => handleDelete(key, ref)}
            className="absolute top-2 right-2 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
            title="Delete image"
          >
            <Trash className="w-4 h-4 text-red-500" />
          </button>
        </>
      ) : (
        <div
          onClick={() => openImageSourceModal(key)}
          className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
        >
          Select Image
        </div>
      )}

      <input
        type="file"
        accept="image/*"
        ref={ref}
        onChange={(e) => handleImageChange(key, e)}
        className="hidden"
      />
    </div>
  );

  return (
    <>
      {showImageSourceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-4">Select Image Source</h3>
            <div className="flex gap-4">
              <button
                onClick={() => handleImageSourceSelect('local')}
                className="flex-1 bg-[#4290E9] text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors"
              >
                Upload
              </button>
              <button
                onClick={() => handleImageSourceSelect('gallery')}
                className="flex-1 bg-[#6BAE41] text-white py-2 px-4 rounded hover:bg-[#6bae41e1] transition-colors"
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

      <div className="flex gap-10 px-[50px] py-[40px] bg-[#647074] relative">
        <div className="w-1/2 flex flex-col gap-4 relative z-[1]">
          {renderImageWithControls("image1", fileInputRef1, "w-[500px] h-[600px] bg-white border-[2px] border-white shadow-sm place-self-center")}

          <div className="flex flex-col gap-4">
            <div className="group z-10">
              {renderImageWithControls("image2", fileInputRef2, "w-[200px] h-[110px] relative bg-white shadow-md", false)}
            </div>
            <div className="flex gap-2">
              <div className="">
                <span className="text-[20px] text-white">CONTACT:</span>
                <StyledInput
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="text-[20px] text-white h-[22px] bg-transparent text-left w-[200px] focus:outline-none border-none placeholder-white placeholder:font-[500]"
                  placeholder="FIRSTNAME LASTNAME"
                />
                <div className="flex gap-2 font-normal text-[20px] text-white">
                  Phone:
                  <StyledInput
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    className="font-thin text-[20px] h-[22px] bg-transparent text-left w-[200px] focus:outline-none border-none placeholder-white placeholder:font-[500]"
                    placeholder="604.000.0000"
                  />
                </div>
                <div className="flex gap-2 font-normal text-[20px] text-white">
                  Email:
                  <StyledInput
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="font-thin text-[20px] h-[22px] bg-transparent text-left w-[200px] focus:outline-none border-none placeholder-white placeholder:font-[200]"
                    placeholder="Enter email here"
                  />
                </div>
                <div className="flex gap-2 font-normal text-[20px] text-white">
                  MLS#
                  <StyledInput
                    value={mlsNumber}
                    onChange={(e) => setMlsNumber(e.target.value)}
                    className="font-thin text-[20px] h-[22px] bg-transparent text-left w-[200px] focus:outline-none border-none placeholder-white placeholder:font-[200]"
                    placeholder="Enter MLS here"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="text-start w-[67%] font-thin flex gap-2 text-white absolute bottom-[4px] right-0">
            <span className="text-[8px] font-bold leading-normal">
              All information deemed reliable but not guaranteed and should be
              independently verified. All properties are subject to prior
              sale, change or withdrawal. Neither listing broker(s) nor BC
              Floor Plans shall be responsible for any typographical errors,
              misinformation, misprints and shall be held totally harmless.
            </span>
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
                  fill="white"
                />
                <path
                  d="M1.93073 6.81015V7.75415H2.41973V7.66515H2.02373V7.32915H2.41973V7.23415H2.02373V6.90415H2.41973V6.81015H1.93073Z"
                  fill="white"
                />
                <path
                  d="M3.04311 6.81015L2.67511 7.75415H2.77411L2.88611 7.45715H3.30711L3.42011 7.75415H3.51911L3.15411 6.81015H3.04311ZM3.09611 6.89915L3.27511 7.37315H2.92011L3.09611 6.89915Z"
                  fill="white"
                />
                <path
                  d="M3.7901 6.81015V7.75415H4.2151V7.66515H3.8821V6.81015H3.7901Z"
                  fill="white"
                />
                <path
                  d="M4.39758 6.81015V6.90415H4.58758V7.75415H4.67958V6.90415H4.86958V6.81015H4.39758Z"
                  fill="white"
                />
                <path
                  d="M5.06702 7.27662C5.06702 7.56062 5.27402 7.77362 5.54502 7.77362C5.68702 7.77362 5.80902 7.71862 5.90602 7.61262C5.99002 7.52262 6.03102 7.41062 6.03102 7.27662C6.03102 7.14462 5.98202 7.02362 5.88502 6.93162C5.79302 6.83962 5.68002 6.79162 5.54802 6.79162C5.41702 6.79162 5.30602 6.83962 5.21402 6.92862C5.11902 7.02362 5.06702 7.14462 5.06702 7.27662ZM5.16202 7.27662C5.16202 7.16162 5.22002 7.04762 5.30702 6.97162C5.37602 6.91262 5.45902 6.88262 5.54502 6.88262C5.76502 6.88262 5.93702 7.06462 5.93702 7.27662C5.93702 7.50762 5.76502 7.68462 5.55402 7.68462C5.33602 7.68462 5.16202 7.51362 5.16202 7.27662Z"
                  fill="white"
                />
                <path
                  d="M6.43873 6.90507H6.57373C6.66173 6.90507 6.72973 6.90507 6.77973 6.95207C6.82773 6.99307 6.84873 7.04807 6.84873 7.11207C6.84873 7.22007 6.76873 7.30107 6.64773 7.30107H6.55773L6.83973 7.75507H6.94873L6.71973 7.38907C6.85373 7.37607 6.94873 7.25507 6.94873 7.11207C6.94873 7.01407 6.90173 6.91807 6.82773 6.86707C6.75973 6.81707 6.68873 6.81007 6.60073 6.81007H6.34473V7.75507H6.43873V6.90507Z"
                  fill="white"
                />
                <path
                  d="M0.880005 6.474H6.89398V0.460997H0.880005V6.474ZM4.07703 1.183H4.74799C5.36499 1.245 5.81501 1.728 5.80701 2.328C5.80201 2.92 5.35999 3.386 4.74799 3.449H4.07703V1.183ZM3.42798 5.714H1.73199V1.178H3.42798V5.714ZM4.07703 5.724V3.467L6.427 5.724H4.07703Z"
                  fill="white"
                />
                <path
                  d="M7.07922 6.6356C7.03422 6.6356 6.99122 6.6546 6.96222 6.6886C6.92922 6.7186 6.91022 6.7646 6.91022 6.8076C6.91022 6.8516 6.92722 6.8956 6.96222 6.9276C6.99122 6.9616 7.03422 6.9776 7.07922 6.9776C7.12522 6.9776 7.16922 6.9616 7.20322 6.9276C7.23322 6.8956 7.25122 6.8546 7.25122 6.8076C7.25122 6.7626 7.23322 6.7186 7.20322 6.6886C7.16922 6.6546 7.12722 6.6356 7.07922 6.6356ZM7.23322 6.8076C7.23322 6.8516 7.21822 6.8856 7.19022 6.9156C7.15922 6.9436 7.11922 6.9586 7.07922 6.9586C7.03922 6.9586 7.00322 6.9436 6.97422 6.9156C6.94422 6.8856 6.92922 6.8466 6.92922 6.8076C6.92922 6.7696 6.94422 6.7286 6.97422 6.6976C7.00322 6.6706 7.03822 6.6546 7.07922 6.6546C7.12122 6.6546 7.15922 6.6706 7.19022 6.7016C7.21622 6.7286 7.23322 6.7656 7.23322 6.8076ZM7.08722 6.7066H7.01222V6.9016H7.04322V6.8156H7.08822L7.13122 6.9016H7.16522L7.11922 6.8106C7.15022 6.8076 7.16722 6.7896 7.16722 6.7626C7.16722 6.7236 7.14122 6.7066 7.08722 6.7066ZM7.07922 6.7256C7.11822 6.7256 7.13822 6.7366 7.13822 6.7646C7.13822 6.7896 7.11822 6.7976 7.07922 6.7976H7.04322V6.7256H7.07922Z"
                  fill="white"
                />
              </svg>
            </span>
          </div>
        </div>

        <div className="w-1/2 flex flex-col relative z-[1] gap-4">
          <div className="">
            {renderImageWithControls("image3", fileInputRef3, "w-full h-[400px] border-[2px] border-white shadow-sm place-self-center")}
          </div>

          <div className="flex w-full flex-col justify-center relative z-[19] items-center">
            <div className="text-[28px] font-light leading-none mt-0 text-white flex gap-2">
              <span className="inline">
                <StyledInput
                  value={addressCode}
                  onChange={(e) => setAddressCode(e.target.value)}
                  className="font-semibold text-[#FFFFFF] text-left text-[30px] h-[30px] w-[180px] bg-transparent focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
                  placeholder="0000-0000"
                />
              </span>
              <span className="text-white flex">
                <StyledInput
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="font-light text-[28px] h-[30px] leading-none mt-0 bg-transparent text-white text-left w-[230px] focus:outline-none border-none placeholder-gray-300 placeholder:font-[200]"
                  placeholder="Address Avenue"
                />
              </span>
            </div>
            <div className="text-white text-[10px]">
              <StyledInput
                value={cityLine}
                onChange={(e) => setCityLine(e.target.value)}
                className="text-white text-[10px] h-[20px] bg-transparent text-center w-[210px] focus:outline-none border-none placeholder-gray-300 placeholder:font-[200]"
                placeholder="BRIGHOUSE SOUTH, RICHMOND"
              />
            </div>
            <div className="">
              <StyledInput
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="font-light text-[28px] h-[30px] w-[150px] leading-none mt-0 bg-transparent text-white text-left focus:outline-none border-none placeholder-gray-300 placeholder:font-[200]"
                placeholder="$000,000"
              />
            </div>
          </div>

          <div className="flex flex-col relative justify-center items-center">
            {renderImageWithControls("image4", fileInputRef4, "w-[350px] h-[250px] border-[2px] border-white shadow-sm place-self-center")}

            <div className="flex flex-col w-full absolute z-[-1]">
              <hr className="border-t-4 border-white border-dotted w-full" />
              <div className="h-[100px] w-full bg-[#9BA4A7] my-2"></div>
              <hr className="border-t-4 border-white border-dotted w-full" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-4 bg-[#647074] relative">
        <div className="w-1/2 pl-[50px] py-[40px] flex flex-col gap-4">
          {renderImageWithControls("image5", fileInputRef5, "w-full h-[420px] border-[2px] border-white shadow-sm place-self-center")}

          <div className="font-bold text-[18px] text-[#FFFFFF] flex flex-wrap gap-2">
            <div className="inline">
              <StyledInput
                value={bedroom}
                onChange={(e) => setBedroom(e.target.value)}
                className="font-semibold text-[13px] bg-transparent text-left w-[20px] h-[20px] focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
                placeholder="0"
              />
            </div>
            BEDROOM •
            <div className="inline">
              <StyledInput
                value={bathroom}
                onChange={(e) => setBathroom(e.target.value)}
                className="font-semibold text-[13px] bg-transparent text-left w-[20px] h-[20px]  focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
                placeholder="0"
              />
            </div>
            BATHROOM •
            <div className="inline">
              <StyledInput
                value={sqft}
                onChange={(e) => setSqft(e.target.value)}
                className="font-semibold text-[13px] bg-transparent text-left h-[20px] w-[60px] focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
                placeholder="000"
              />
            </div>
            SQ FT •
            BUILT IN
            <div className="inline">
              <StyledInput
                value={builtYear}
                onChange={(e) => setBuiltYear(e.target.value)}
                className="font-semibold text-[13px] bg-transparent text-left h-[30px] w-[80px] focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
                placeholder="0000"
              />
            </div>
          </div>

          <StyledInput
            value={description}
            rows={8}
            onChange={(e) => setDescription(e.target.value)}
            className="font-normal text-[10px] h-[90px] z-20 text-white leading-[1.6] italic bg-transparent text-left focus:outline-none border-none placeholder-white placeholder:font-[500]"
            placeholder="This centrally located 2 bedroom, 2 bathroom home boasts incredible, totally unobstructed VIEWS overlooking Brighouse Park & to
              the South and South Westproviding unhindered privacy. The perfect floorplan with open concept living and cross unit bedrooms. Dark
              laminate flooring, S/S appliances, Gas range and a large open 'den/nook' area perfect for the home office. Huge private balcony,
              great building amenities including exercise room, sauna, roof top courtyard and outdoor kids playground. With parking, and storage
              locker and balance of the the 5-10 warranty, this home provides nothing but exceptional value. Call today to set up your viewing.
              MLS # V981073 This centrally located 2 bedroom, 2 bathroom home boasts incredible, totally unobstructed VIEWS overlooking
              Brighouse Park & to the South and South Westproviding unhindered privacy. The perfect floorplan with open concept living and cross
              unit bedrooms. Dark laminate flooring, S/S appliances, Gas range and a large open 'den/nook' area perfect for the home office. Huge
              private balcony, great building amenities including exercise room, sauna, roof top courtyard and outdoor kids playground. With parking,
              and storage locker and balance of the the 5-10 warranty, this home provides nothing but exceptional value. Call today to set up your
              viewing. MLS # 00000"
          />

          <div className="grid grid-cols-2 gap-4">
            {renderImageWithControls("image6", fileInputRef6, "h-[200px] border-[2px] border-white shadow-sm")}
            {renderImageWithControls("image7", fileInputRef7, "h-[200px] border-[2px] border-white shadow-sm")}
          </div>
        </div>

        <div className="w-1/2 flex gap-4">
          <div className="w-[70%] flex flex-col gap-4 py-[40px]">
            <div className="grid grid-cols-2 gap-2">
              {renderImageWithControls("image8", fileInputRef8, "h-[165px] border-[2px] border-white shadow-sm", false)}
              {renderImageWithControls("image9", fileInputRef9, "h-[165px] border-[2px] border-white shadow-sm", false)}
              {renderImageWithControls("image10", fileInputRef10, "h-[165px] border-[2px] border-white shadow-sm", false)}
              {renderImageWithControls("image11", fileInputRef11, "h-[165px] border-[2px] border-white shadow-sm", false)}
            </div>
            {renderImageWithControls("image12", fileInputRef12, "h-[480px] border-[2px] border-white shadow-sm")}
          </div>

          <div className="bg-[#9BA4A7] w-[30%] py-[40px] pl-[18px] pr-[50px]">
            <div className="flex flex-col gap-2 text-black text-[12px] leading-relaxed relative z-10">
              <div className="text-[28px] flex font-light leading-none mt-0 text-white">
                <span className="text-[16px]">#</span>
                <span className="inline">
                  <StyledInput
                    value={addressCode}
                    onChange={(e) => setAddressCode(e.target.value)}
                    className="font-light text-[28px] h-[30px] w-[150px] leading-none mt-0 bg-transparent text-white text-left focus:outline-none border-none placeholder-gray-300 placeholder:font-[200]"
                    placeholder="0000-0000"
                  />
                </span>
              </div>
              <span className="text-white flex text-[18px]">
                Number
                <StyledInput
                  value={roadName}
                  onChange={(e) => setRoadName(e.target.value)}
                  className="font-light text-[18px] h-[30px] leading-none mt-0 bg-transparent text-white text-center w-[65px] focus:outline-none border-none placeholder-gray-300 placeholder:font-[200]"
                  placeholder="0"
                />
                Road
              </span>
              <StyledInput
                value={description}
                rows={8}
                onChange={(e) => setDescription(e.target.value)}
                className="font-normal text-[12px] h-[250px] w-full text-white bg-transparent text-left focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
                placeholder="On top of it all! Beautiful sub-penthouse in the well
                appointed CENTRO building. This centrally located 2 bedroom, 2
                bathroom home boasts incredible, totally unobstructed VIEWS
                overlooking Brighouse Park & to the South and South
                Westproviding unhindered privacy. The perfect floorplan with
                open concept living and cross unit bedrooms. Dark laminate
                flooring, S/S appliances, Gas range and a large open
                'den/nook' area perfect for the home office.."
              />
              <div className="space-y-2 text-[8px]">
                <div>
                  <span className="font-bold text-[#FFFFFF] text-[12px]">BY-LAW RESTRICTIONS:</span>
                  <StyledInput
                    value={byLawRestrictions}
                    onChange={(e) => setByLawRestrictions(e.target.value)}
                    className="font-semibold text-[8px] bg-transparent text-left w-full focus:outline-none border-none placeholder-[#FFFFFF] placeholder:font-[500]"
                    placeholder="Pets Allowed w/Rest., Rentals Allowed"
                  />
                </div>
                <div>
                  <span className="font-bold text-[#FFFFFF] text-[12px]">MAINT. FEES:</span>
                  <StyledInput
                    value={maintFees}
                    onChange={(e) => setMaintFees(e.target.value)}
                    className="font-semibold text-[8px] bg-transparent text-left w-full focus:outline-none border-none placeholder-[#FFFFFF] placeholder:font-[500]"
                    placeholder="$000.00"
                  />
                </div>
                <div>
                  <span className="font-bold text-[#FFFFFF] text-[12px]">MAINT. FEES INCLUDE:</span>
                  <StyledInput
                    value={maintFeesInclude}
                    onChange={(e) => setMaintFeesInclude(e.target.value)}
                    className="font-semibold text-[8px] bg-transparent text-left w-full focus:outline-none border-none placeholder-[#FFFFFF] placeholder:font-[500]"
                    placeholder="Gardening, Garbage Pickup, Gas, Hot Water, Management, Recreation Facility, Other, Caretaker"
                  />
                </div>
                <div>
                  <span className="font-bold text-[#FFFFFF] text-[12px]">FEATURES INCLUDED:</span>
                  <StyledInput
                    value={featuresIncluded}
                    onChange={(e) => setFeaturesIncluded(e.target.value)}
                    className="font-semibold text-[8px] bg-transparent text-left w-full focus:outline-none border-none placeholder-[#FFFFFF] placeholder:font-[500]"
                    placeholder="Clothes Washer/Dryer/ Fridge/Stove/DW, Drapes/ Window Coverings"
                  />
                </div>
              </div>
              <div className="space-y-2 text-[8px]">
                <div>
                  <span className="font-bold text-[#FFFFFF] text-[12px]">SITE INFLUENCES:</span>
                  <StyledInput
                    value={siteInfluences}
                    onChange={(e) => setSiteInfluences(e.target.value)}
                    className="font-semibold text-[8px] bg-transparent text-left w-full focus:outline-none border-none placeholder-[#FFFFFF] placeholder:font-[500]"
                    placeholder="Central Location, Golf Course Nearby, Recreation Nearby, Shopping Nearby"
                  />
                </div>
                <div>
                  <span className="font-bold text-[#FFFFFF] text-[12px]">AMENITIES:</span>
                  <StyledInput
                    value={amenities}
                    onChange={(e) => setAmenities(e.target.value)}
                    className="font-semibold text-[8px] bg-transparent text-left w-full focus:outline-none border-none placeholder-[#FFFFFF] placeholder:font-[500]"
                    placeholder="Exercise Centre, Garden, In Suite Laundry, Sauna/Steam Room"
                  />
                </div>
                <div>
                  <span className="font-bold text-[#FFFFFF] text-[12px]">VIEW:</span>
                  <StyledInput
                    value={view}
                    onChange={(e) => setView(e.target.value)}
                    className="font-semibold text-[8px] bg-transparent text-left w-full focus:outline-none border-none placeholder-[#FFFFFF] placeholder:font-[500]"
                    placeholder="South & SW - Van Isl."
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
});

BcfpStandard8.displayName = "BcfpStandard8";

export default BcfpStandard8;