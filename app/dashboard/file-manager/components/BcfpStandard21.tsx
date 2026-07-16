import { House, Pencil, RotateCw, Trash, ZoomIn, ZoomOut } from "lucide-react";
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Order } from "../../orders/page";
import "../../../globals.css";
import StyledInput from "./StyledInput";
import ImageSourceModal from "./ImageSourceModal";
import FileManagerGallery from "./fileManagerGallery";
import ImageEditor from "./ImageEditor";
import { featureSheetService } from "../file-manager";
import { FeatureSheetPayload, FeatureSheetResponse } from "../types/featureSheetTypes";
import { useFileManagerContext } from "../FileManagerContext";

export interface BcfpStandard21Ref {
  exportToPayload: () => Promise<FeatureSheetPayload>;
  importFromPayload: (payload: FeatureSheetResponse) => void;
}

interface BcfpStandard21Props {
  orderData: Order | null;
}

const BcfpStandard21 = forwardRef<BcfpStandard21Ref, BcfpStandard21Props>(
  ({ orderData }, ref) => {
    // --- Text Field States ---
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [propertyName, setPropertyName] = useState("");
    const [number, setNumber] = useState("");
    const [amount, setAmount] = useState("");
    const [byLawRestrictions, setByLawRestrictions] = useState("");
    const [maintenanceFees, setMaintenanceFees] = useState("");
    const [maintenanceFeesInclude, setMaintenanceFeesInclude] = useState("");
    const [featuresIncluded, setFeaturesIncluded] = useState("");
    const [siteInfluences, setSiteInfluences] = useState("");
    const [amenities, setAmenities] = useState("");
    const [mlsNumber, setMlsNumber] = useState("");
    const [view, setView] = useState("");
    const [bedroom, setBedroom] = useState("");
    const [bathroom, setBathroom] = useState("");
    const [sqft, setSqft] = useState("");
    const [builtYear, setBuiltYear] = useState("");
    const [description, setDescription] = useState("");
    const [headline, setHeadline] = useState("");
    const [addressCode, setAddressCode] = useState("");
    const [roadName, setRoadName] = useState("");
    const [cityLine, setCityLine] = useState("");
    const [patioSqft, setPatioSqft] = useState("");
    const [ceilingHeight, setCeilingHeight] = useState("");

    const [fieldStyles, setFieldStyles] = useState<Record<string, any>>({});

    const updateFieldStyle = (fieldName: string, style: any) => {
      setFieldStyles((prev) => ({ ...prev, [fieldName]: style }));
    };

    // --- Image States ---
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

    const [rotation, setRotation] = useState({
      image1: 0,
      image2: 0,
      image3: 0,
      image4: 0,
      image5: 0,
      image6: 0,
      image7: 0,
      image8: 0,
      image9: 0,
      image10: 0,
      image11: 0,
      image12: 0,
      image13: 0,
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

    // --- Input Refs ---
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

    const getFileInputRef = (key: string) => {
      switch (key) {
        case "image1": return fileInputRef1;
        case "image2": return fileInputRef2;
        case "image3": return fileInputRef3;
        case "image4": return fileInputRef4;
        case "image5": return fileInputRef5;
        case "image6": return fileInputRef6;
        case "image7": return fileInputRef7;
        case "image8": return fileInputRef8;
        case "image9": return fileInputRef9;
        case "image10": return fileInputRef10;
        case "image11": return fileInputRef11;
        case "image12": return fileInputRef12;
        case "image13": return fileInputRef13;
        default: return fileInputRef1;
      }
    };

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      exportToPayload: async () => {
        const payload = await featureSheetService.buildPayload({
          orderUuid: orderData?.uuid || "",
          templateKey: "BCFPStandard21",
          uploadedBy: "admin",
          type: "template",
          primaryColor: "#1B435E",
          offeredAtPrice: amount,
          realtorName: fullName,
          emailLink: email,
          companyName: propertyName,
          propertyNotesTitle: roadName,
          propertyNotesDescription: description,
          expandedDetail1Title: "By-law Restrictions",
          expandedDetail1Description: byLawRestrictions,
          expandedDetail2Title: "Maint. Fees",
          expandedDetail2Description: maintenanceFees,
          expandedDetail3Title: "Maint. Fees Include",
          expandedDetail3Description: maintenanceFeesInclude,
          expandedDetail4Title: "Features Included",
          expandedDetail4Description: featuresIncluded,
          keyHighlightLabel: "Site Influences",
          keyHighlights: siteInfluences ? siteInfluences.split("\n").filter(Boolean) : [],
          otherDetails: {
            maintenanceFees,
            maintenanceFeesInclude,
            amenities,
            view,
            bedroom,
            bathroom,
            sqft,
            builtYear,
            number,
            addressCode,
            cityLine,
            mlsNumber,
            headline,
            patioSqft,
            ceilingHeight,
          },
          images,
          imageScales: scale,
          imagePositions: position,
          fieldStyles,
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
        if (state.expandedDetail2Description) setMaintenanceFees(state.expandedDetail2Description as string);
        if (state.expandedDetail3Description) setMaintenanceFeesInclude(state.expandedDetail3Description as string);
        if (state.expandedDetail4Description) setFeaturesIncluded(state.expandedDetail4Description as string);

        if (state.keyHighlights) setSiteInfluences(state.keyHighlights.join("\n"));

        if (state.otherDetails) {
          const details = state.otherDetails as Record<string, unknown>;
          if (details.maintenanceFees) setMaintenanceFees(details.maintenanceFees as string);
          if (details.maintenanceFeesInclude) setMaintenanceFeesInclude(details.maintenanceFeesInclude as string);
          if (details.amenities) setAmenities(details.amenities as string);
          if (details.view) setView(details.view as string);
          if (details.bedroom) setBedroom(details.bedroom as string);
          if (details.bathroom) setBathroom(details.bathroom as string);
          if (details.sqft) setSqft(details.sqft as string);
          if (details.builtYear) setBuiltYear(details.builtYear as string);
          if (details.number) setNumber(details.number as string);
          if (details.addressCode) setAddressCode(details.addressCode as string);
          if (details.cityLine) setCityLine(details.cityLine as string);
          if (details.mlsNumber) setMlsNumber(details.mlsNumber as string);
          if (details.headline) setHeadline(details.headline as string);
          if (details.patioSqft) setPatioSqft(details.patioSqft as string);
          if (details.ceilingHeight) setCeilingHeight(details.ceilingHeight as string);
        }

        if (state.images) setImages((prev) => ({ ...prev, ...(state.images as unknown as typeof images) }));
        if (state.imageScales) setScale((prev) => ({ ...prev, ...(state.imageScales as unknown as typeof scale) }));
        if (state.imagePositions) setPosition((prev) => ({ ...prev, ...(state.imagePositions as unknown as typeof position) }));
        if (state.fieldStyles) setFieldStyles(state.fieldStyles as Record<string, any>);
      },
    }));

    const { formData, updateFormData } = useFileManagerContext();

    // Data population effect from orderData & context
    useEffect(() => {
      if (orderData) {
        if (orderData.property) {
          if (orderData.property.listing_price) setAmount(orderData.property.listing_price.toString());
          if (orderData.property.bedrooms) setBedroom(orderData.property.bedrooms.toString());
          if (orderData.property.bathrooms) setBathroom(orderData.property.bathrooms.toString());
          if (orderData.property.square_footage) setSqft(orderData.property.square_footage.toString());
          if (orderData.property.year_constructed) setBuiltYear(orderData.property.year_constructed.toString());
          if (orderData.property.description) setDescription(orderData.property.description);
          if (orderData.property.mls_number) setMlsNumber(orderData.property.mls_number);
          if (orderData.property.suite) setAddressCode(orderData.property.suite);
          if (orderData.property.address) setRoadName(orderData.property.address);

          let cityString = "";
          if (orderData.property.city) cityString += orderData.property.city;
          if (orderData.property.province) cityString += (cityString ? ", " : "") + orderData.property.province;
          if (orderData.property.postal_code) cityString += (cityString ? " " : "") + orderData.property.postal_code;
          if (cityString) setCityLine(cityString);
        }
        if (orderData.agent) {
          const agent = orderData.agent;
          if (agent.first_name || agent.last_name) setFullName(`${agent.first_name || ""} ${agent.last_name || ""}`.trim());
          if (agent.email) setEmail(agent.email);
          if (agent.primary_phone) setNumber(agent.primary_phone);
          if (agent.company_name) setPropertyName(agent.company_name);
        }
      }

      if (formData) {
        if (formData.byLawRestrictions) setByLawRestrictions(formData.byLawRestrictions);
        if (formData.maintenanceFees) setMaintenanceFees(formData.maintenanceFees);
        if (formData.maintenanceFeesInclude) setMaintenanceFeesInclude(formData.maintenanceFeesInclude);
        if (formData.featuresIncluded) setFeaturesIncluded(formData.featuresIncluded);
        if (formData.siteInfluences) setSiteInfluences(formData.siteInfluences);
        if (formData.amenities) setAmenities(formData.amenities);
        if (formData.view) setView(formData.view);
        if (formData.description) setDescription(formData.description);
        if (formData.fullName) setFullName(formData.fullName);
        if (formData.email) setEmail(formData.email);
        if (formData.propertyName) setPropertyName(formData.propertyName);
        if (formData.amount) setAmount(formData.amount);
        if (formData.number) setNumber(formData.number);
        if (formData.addressCode) setAddressCode(formData.addressCode);
        if (formData.roadName) setRoadName(formData.roadName);
        if (formData.cityLine) setCityLine(formData.cityLine);
        if (formData.bedroom) setBedroom(formData.bedroom);
        if (formData.bathroom) setBathroom(formData.bathroom);
        if (formData.sqft) setSqft(formData.sqft);
        if (formData.builtYear) setBuiltYear(formData.builtYear);
        if (formData.images) setImages((prev) => ({ ...prev, ...(formData.images as typeof images) }));
        if (formData.imageScales) setScale((prev) => ({ ...prev, ...(formData.imageScales as typeof scale) }));
        if (formData.imagePositions) setPosition((prev) => ({ ...prev, ...(formData.imagePositions as typeof position) }));
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Sync state changes to context
    useEffect(() => {
      updateFormData({
        byLawRestrictions,
        maintenanceFees,
        maintenanceFeesInclude,
        featuresIncluded,
        siteInfluences,
        amenities,
        view,
        description,
        fullName,
        email,
        propertyName,
        amount,
        number,
        addressCode,
        roadName,
        cityLine,
        bedroom,
        bathroom,
        sqft,
        builtYear,
      });
    }, [
      byLawRestrictions,
      maintenanceFees,
      maintenanceFeesInclude,
      featuresIncluded,
      siteInfluences,
      amenities,
      view,
      description,
      fullName,
      email,
      propertyName,
      amount,
      number,
      addressCode,
      roadName,
      cityLine,
      bedroom,
      bathroom,
      sqft,
      builtYear,
      updateFormData,
    ]);

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
      setRotation((prev) => ({ ...prev, [key]: 0 }));
      if (ref.current) ref.current.value = "";
    };

    const handleZoom = (key: keyof typeof images, direction: "in" | "out") => {
      setScale((prev) => {
        const newScale = direction === "in" ? prev[key] + 0.1 : prev[key] - 0.1;
        const bounded = Math.min(Math.max(newScale, 0.1), 5);
        return { ...prev, [key]: bounded };
      });
    };

    const handleRotate = (key: keyof typeof images) => {
      setRotation((prev) => ({ ...prev, [key]: (prev[key] + 90) % 360 }));
    };

    const handleMouseDown = (key: keyof typeof images, e: React.MouseEvent) => {
      setDragging((prev) => ({ ...prev, [key]: true }));
      lastPosition.current[key] = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (key: keyof typeof images, e: React.MouseEvent) => {
      if (!dragging[key]) return;
      let dx = e.clientX - lastPosition.current[key].x;
      let dy = e.clientY - lastPosition.current[key].y;

      const angle = ((rotation[key] % 360) + 360) % 360;
      if (angle === 90) {
        const temp = dx;
        dx = dy;
        dy = -temp;
      } else if (angle === 180) {
        dx = -dx;
        dy = -dy;
      } else if (angle === 270) {
        const temp = dx;
        dx = -dy;
        dy = temp;
      }

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
      if (source === "local" && currentImageSlot) {
        const ref = getFileInputRef(currentImageSlot);
        ref.current?.click();
      } else if (source === "gallery") {
        setShowGallery(true);
      }
    };

    const handleGalleryImageSelect = (imageUrl: string) => {
      if (currentImageSlot) {
        setImages((prev) => ({ ...prev, [currentImageSlot]: imageUrl }));
      }
      setShowGallery(false);
      setCurrentImageSlot(null);
    };

    const openImageSourceModal = (imageSlot: string) => {
      setCurrentImageSlot(imageSlot);
      setShowImageSourceModal(true);
    };

    // Helper to render an image slot container with controls UI and ImageEditor
    const renderImageSlot = (
      key: keyof typeof images,
      containerClassName: string,
      placeholderText = "Select Image"
    ) => {
      const inputRef = getFileInputRef(key);
      const hasImage = !!images[key];

      return (
        <div
          className={`relative overflow-hidden group select-none ${containerClassName}`}
          onMouseDown={(e) => handleMouseDown(key, e)}
          onMouseMove={(e) => handleMouseMove(key, e)}
          onMouseUp={() => handleMouseUp(key)}
          onMouseLeave={() => handleMouseLeave(key)}
          style={{ cursor: dragging[key] ? "grabbing" : hasImage ? "grab" : "pointer" }}
        >
          {hasImage ? (
            <>
              <ImageEditor
                src={images[key]!}
                scale={scale[key]}
                position={position[key]}
                rotation={rotation[key]}
              />

              {/* Hover Controls */}
              <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto z-20">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleZoom(key, "in"); }}
                  className="bg-white p-1.5 rounded-full shadow hover:bg-gray-100"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5 text-gray-700" />
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleZoom(key, "out"); }}
                  className="bg-white p-1.5 rounded-full shadow hover:bg-gray-100"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5 text-gray-700" />
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleRotate(key); }}
                  className="bg-white p-1.5 rounded-full shadow hover:bg-gray-100"
                  title="Rotate"
                >
                  <RotateCw className="w-3.5 h-3.5 text-gray-700" />
                </button>
              </div>

              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); openImageSourceModal(key); }}
                className="absolute top-2 right-9 bg-white p-1.5 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto z-20"
                title="Change Image"
              >
                <Pencil className="w-3.5 h-3.5 text-gray-700" />
              </button>

              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleDelete(key, inputRef); }}
                className="absolute top-2 right-2 bg-white p-1.5 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto z-20"
                title="Delete Image"
              >
                <Trash className="w-3.5 h-3.5 text-red-500" />
              </button>
            </>
          ) : (
            <div
              onClick={() => openImageSourceModal(key)}
              className="w-full h-full bg-gray-100 hover:bg-gray-200 text-gray-500 text-xs font-medium flex items-center justify-center cursor-pointer border border-dashed border-gray-300 transition-colors"
            >
              {placeholderText}
            </div>
          )}

          <input
            type="file"
            accept="image/*"
            ref={inputRef}
            onChange={(e) => handleImageChange(key, e)}
            className="hidden"
          />
        </div>
      );
    };

    return (
      <div className="flex flex-col items-center justify-center font-sans">
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

        {/* --- PAGE 1 DIVIDER --- */}
        <div className="w-[8.5in] flex items-center justify-center pb-6 pt-10 print:hidden select-none">
          <div className="h-[1px] bg-gray-300 flex-1"></div>
          <span className="text-gray-400 font-medium tracking-widest text-sm px-4">PAGE 1</span>
          <div className="h-[1px] bg-gray-300 flex-1"></div>
        </div>

        {/* --- PAGE 1 WRAPPER --- */}
        <div className="pdf-page w-[8.5in] h-[11in] relative overflow-hidden flex flex-col bg-white">
          {/* Background SVG graphics */}
          <svg
            viewBox="0 0 816 1056"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="absolute inset-0 w-full h-full pointer-events-none z-0"
            preserveAspectRatio="none"
          >
            {/* Top Navy Banner Header */}
            <path d="M0 0 H816 V150 C816 150 550 155 0 140 Z" fill="#1B435E" />

            {/* Right Taupe Curve Background */}
            <path d="M816 135 C816 135 710 260 720 490 C730 710 816 780 816 780 Z" fill="#C2BB98" opacity="0.65" />

            {/* Bottom Taupe Sweep Curve */}
            <path d="M0 970 Q 420 900 816 750 V1056 H0 Z" fill="#C2BB98" opacity="0.75" />

            {/* Bottom Navy Footer & Contact Swoop */}
            <path d="M0 1056 H816 V780 C816 780 730 990 0 1015 V1056 Z" fill="#1B435E" />
          </svg>

          {/* PAGE 1 CONTENT */}
          <div className="relative z-10 w-full h-full flex flex-col justify-between px-7 py-5">
            {/* Header Section */}
            <div className="flex justify-between items-start pt-1 pb-3 text-white">
              {/* Logo Slot */}
              <div className="flex items-center gap-2">
                <div className="flex flex-col items-center">
                  <div className="border border-white/60 p-2 rounded text-center">
                    <div className="text-[17px] font-serif tracking-widest leading-none">MACDONALD</div>
                    <div className="text-[15px] font-serif tracking-widest leading-none mt-1">REALTY</div>
                  </div>
                </div>
              </div>

              {/* Address Header */}
              <div className="flex flex-col items-end text-right">
                <div className="flex items-baseline text-white text-[25px] font-light tracking-wide uppercase">
                  <span>#</span>
                  <StyledInput
                    value={addressCode}
                    onChange={(e) => setAddressCode(e.target.value)}
                    inputStyle={fieldStyles["addressCode"]}
                    onChangeStyle={(s) => updateFieldStyle("addressCode", s)}
                    className="font-light text-[25px] h-[30px] w-[140px] bg-transparent text-white text-right focus:outline-none border-none placeholder-white/80"
                    placeholder="0000-0000"
                  />
                  <StyledInput
                    value={roadName}
                    onChange={(e) => setRoadName(e.target.value)}
                    inputStyle={fieldStyles["roadName"]}
                    onChangeStyle={(s) => updateFieldStyle("roadName", s)}
                    className="font-light text-[25px] h-[30px] w-[210px] bg-transparent text-white text-left ml-2 focus:outline-none border-none placeholder-white/80 uppercase"
                    placeholder="NUMBER 0 ROAD"
                  />
                </div>
                <StyledInput
                  value={cityLine}
                  onChange={(e) => setCityLine(e.target.value)}
                  inputStyle={fieldStyles["cityLine"]}
                  onChangeStyle={(s) => updateFieldStyle("cityLine", s)}
                  className="font-normal text-[11px] h-[18px] bg-transparent text-white/90 text-right w-[280px] tracking-widest focus:outline-none border-none uppercase placeholder-white/70"
                  placeholder="BRIGHOUSE SOUTH, RICHMOND"
                />
              </div>
            </div>

            {/* Main Body (2 Columns) */}
            <div className="flex gap-4 flex-1 my-2">
              {/* LEFT COLUMN */}
              <div className="w-[34%] flex flex-col gap-2.5">
                {/* Image 1 Slot */}
                {renderImageSlot(
                  "image1",
                  "w-full h-[145px] p-1 bg-white shadow-sm border border-gray-200",
                  "Select Image 1"
                )}

                {/* Description */}
                <div className="bg-white/70 p-1.5 rounded">
                  <StyledInput
                    value={description}
                    rows={8}
                    onChange={(e) => setDescription(e.target.value)}
                    inputStyle={fieldStyles["description"]}
                    onChangeStyle={(s) => updateFieldStyle("description", s)}
                    className="text-[10px] text-gray-700 leading-tight text-justify bg-transparent w-full focus:outline-none border-none placeholder-gray-500"
                    placeholder="This centrally located 2 bedroom, 2 bathroom home boasts incredible, totally unobstructed VIEWS overlooking Brighouse Park & to the South and South West providing unhindered privacy. The perfect floorplan with open concept living and cross unit bedrooms..."
                  />
                </div>

                {/* Property Feature Specs */}
                <div className="flex flex-col gap-1 text-[9.5px] leading-tight text-gray-800 font-sans">
                  <div>
                    <span className="font-bold text-[#1B435E] uppercase block">BY-LAW RESTRICTIONS:</span>
                    <StyledInput
                      value={byLawRestrictions}
                      onChange={(e) => setByLawRestrictions(e.target.value)}
                      inputStyle={fieldStyles["byLawRestrictions"]}
                      onChangeStyle={(s) => updateFieldStyle("byLawRestrictions", s)}
                      className="text-[9.5px] text-gray-700 bg-transparent w-full focus:outline-none border-none placeholder-gray-400"
                      placeholder="Pets Allowed w/Rest., Rentals Allowed"
                    />
                  </div>

                  <div>
                    <span className="font-bold text-[#1B435E] uppercase block">MAINT. FEES:</span>
                    <StyledInput
                      value={maintenanceFees}
                      onChange={(e) => setMaintenanceFees(e.target.value)}
                      inputStyle={fieldStyles["maintenanceFees"]}
                      onChangeStyle={(s) => updateFieldStyle("maintenanceFees", s)}
                      className="text-[9.5px] text-gray-700 bg-transparent w-full focus:outline-none border-none placeholder-gray-400"
                      placeholder="$000.00"
                    />
                  </div>

                  <div>
                    <span className="font-bold text-[#1B435E] uppercase block">MAINT. FEES INCLUDE:</span>
                    <StyledInput
                      value={maintenanceFeesInclude}
                      onChange={(e) => setMaintenanceFeesInclude(e.target.value)}
                      inputStyle={fieldStyles["maintenanceFeesInclude"]}
                      onChangeStyle={(s) => updateFieldStyle("maintenanceFeesInclude", s)}
                      className="text-[9.5px] text-gray-700 bg-transparent w-full focus:outline-none border-none placeholder-gray-400"
                      placeholder="Gardening, Garbage Pickup, Gas, Hot Water, Management, Recreation Facility, Other"
                    />
                  </div>

                  <div>
                    <span className="font-bold text-[#1B435E] uppercase block">FEATURES INCLUDED:</span>
                    <StyledInput
                      value={featuresIncluded}
                      onChange={(e) => setFeaturesIncluded(e.target.value)}
                      inputStyle={fieldStyles["featuresIncluded"]}
                      onChangeStyle={(s) => updateFieldStyle("featuresIncluded", s)}
                      className="text-[9.5px] text-gray-700 bg-transparent w-full focus:outline-none border-none placeholder-gray-400"
                      placeholder="Clothes Washer/Dryer/Fridge/Stove/DW, Drapes/Window Coverings"
                    />
                  </div>

                  <div>
                    <span className="font-bold text-[#1B435E] uppercase block">SITE INFLUENCES:</span>
                    <StyledInput
                      value={siteInfluences}
                      onChange={(e) => setSiteInfluences(e.target.value)}
                      inputStyle={fieldStyles["siteInfluences"]}
                      onChangeStyle={(s) => updateFieldStyle("siteInfluences", s)}
                      className="text-[9.5px] text-gray-700 bg-transparent w-full focus:outline-none border-none placeholder-gray-400"
                      placeholder="Central Location, Golf Course Nearby, Recreation Nearby, Shopping Nearby"
                    />
                  </div>

                  <div>
                    <span className="font-bold text-[#1B435E] uppercase block">AMENITIES:</span>
                    <StyledInput
                      value={amenities}
                      onChange={(e) => setAmenities(e.target.value)}
                      inputStyle={fieldStyles["amenities"]}
                      onChangeStyle={(s) => updateFieldStyle("amenities", s)}
                      className="text-[9.5px] text-gray-700 bg-transparent w-full focus:outline-none border-none placeholder-gray-400"
                      placeholder="Exercise Centre, Garden, In Suite Laundry, Sauna/Steam Room"
                    />
                  </div>

                  <div>
                    <span className="font-bold text-[#1B435E] uppercase block">VIEW:</span>
                    <StyledInput
                      value={view}
                      onChange={(e) => setView(e.target.value)}
                      inputStyle={fieldStyles["view"]}
                      onChangeStyle={(s) => updateFieldStyle("view", s)}
                      className="text-[9.5px] text-gray-700 bg-transparent w-full focus:outline-none border-none placeholder-gray-400"
                      placeholder="South & SW - Van Isl."
                    />
                  </div>
                </div>

                {/* Price Display */}
                <div className="mt-auto pt-2">
                  <StyledInput
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    inputStyle={fieldStyles["amount"]}
                    onChangeStyle={(s) => updateFieldStyle("amount", s)}
                    className="font-bold text-[32px] text-[#1B435E] leading-none bg-transparent w-full focus:outline-none border-none placeholder-[#1B435E]"
                    placeholder="$000,000"
                  />
                </div>
              </div>

              {/* RIGHT COLUMN */}
              <div className="w-[66%] flex flex-col gap-2.5">
                {/* Main Hero Photo (Image 2) */}
                {renderImageSlot(
                  "image2",
                  "w-full h-[270px] p-1.5 bg-white shadow-md border border-gray-200",
                  "Select Main Photo (Image 2)"
                )}

                {/* Headline Text */}
                <div className="text-center px-2 py-0.5">
                  <StyledInput
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    inputStyle={fieldStyles["headline"]}
                    onChangeStyle={(s) => updateFieldStyle("headline", s)}
                    className="font-medium text-[11.5px] text-[#1B435E] uppercase tracking-wide text-center bg-transparent w-full focus:outline-none border-none placeholder-gray-600"
                    placeholder="ON TOP OF IT ALL! BEAUTIFUL SUB-PENTHOUSE IN THE WELL APPOINTED CENTRO BUILDING."
                  />
                </div>

                {/* Specs Summary Row */}
                <div className="flex items-center justify-center gap-2 text-[12px] font-medium text-gray-800 uppercase text-center bg-gray-50/80 py-1 px-3 border border-gray-200/60 rounded">
                  <div className="flex items-center gap-1">
                    <StyledInput
                      value={bedroom}
                      onChange={(e) => setBedroom(e.target.value)}
                      inputStyle={fieldStyles["bedroom"]}
                      onChangeStyle={(s) => updateFieldStyle("bedroom", s)}
                      className="font-semibold text-[12px] text-[#1B435E] w-[18px] text-right bg-transparent focus:outline-none border-none placeholder-gray-700"
                      placeholder="0"
                    />
                    <span>BEDROOM</span>
                  </div>
                  <span className="text-gray-400">|</span>
                  <div className="flex items-center gap-1">
                    <StyledInput
                      value={bathroom}
                      onChange={(e) => setBathroom(e.target.value)}
                      inputStyle={fieldStyles["bathroom"]}
                      onChangeStyle={(s) => updateFieldStyle("bathroom", s)}
                      className="font-semibold text-[12px] text-[#1B435E] w-[18px] text-right bg-transparent focus:outline-none border-none placeholder-gray-700"
                      placeholder="0"
                    />
                    <span>BATHROOM</span>
                  </div>
                  <span className="text-gray-400">|</span>
                  <div className="flex items-center gap-1">
                    <StyledInput
                      value={sqft}
                      onChange={(e) => setSqft(e.target.value)}
                      inputStyle={fieldStyles["sqft"]}
                      onChangeStyle={(s) => updateFieldStyle("sqft", s)}
                      className="font-semibold text-[12px] text-[#1B435E] w-[45px] text-right bg-transparent focus:outline-none border-none placeholder-gray-700"
                      placeholder="000"
                    />
                    <span>SQ FT</span>
                  </div>
                  <span className="text-gray-400">|</span>
                  <div className="flex items-center gap-1">
                    <span>BUILT IN</span>
                    <StyledInput
                      value={builtYear}
                      onChange={(e) => setBuiltYear(e.target.value)}
                      inputStyle={fieldStyles["builtYear"]}
                      onChangeStyle={(s) => updateFieldStyle("builtYear", s)}
                      className="font-semibold text-[12px] text-[#1B435E] w-[42px] text-left bg-transparent focus:outline-none border-none placeholder-gray-700"
                      placeholder="0000"
                    />
                  </div>
                </div>

                {/* 2x2 Photo Grid */}
                <div className="grid grid-cols-2 gap-2 flex-1 mt-1">
                  {renderImageSlot("image3", "w-full h-[155px] p-1 bg-white shadow-sm border border-gray-200", "Image 3")}
                  {renderImageSlot("image4", "w-full h-[155px] p-1 bg-white shadow-sm border border-gray-200", "Image 4")}
                  {renderImageSlot("image5", "w-full h-[155px] p-1 bg-white shadow-sm border border-gray-200", "Image 5")}
                  {renderImageSlot("image6", "w-full h-[155px] p-1 bg-white shadow-sm border border-gray-200", "Image 6")}
                </div>
              </div>
            </div>

            {/* Bottom Contact & Disclaimer Container */}
            <div className="relative mt-2 flex flex-col">
              {/* Contact Box overlay on bottom right */}
              <div className="self-end flex flex-col text-right text-white pr-2 pb-2">
                <span className="text-[11px] font-bold tracking-wider uppercase text-white/90">CONTACT:</span>
                <StyledInput
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  inputStyle={fieldStyles["fullName"]}
                  onChangeStyle={(s) => updateFieldStyle("fullName", s)}
                  className="font-bold text-[18px] h-[22px] bg-transparent text-white text-right focus:outline-none border-none uppercase placeholder-white"
                  placeholder="FIRSTNAME LASTNAME"
                />
                <StyledInput
                  value={propertyName}
                  onChange={(e) => setPropertyName(e.target.value)}
                  inputStyle={fieldStyles["propertyName"]}
                  onChangeStyle={(s) => updateFieldStyle("propertyName", s)}
                  className="font-normal text-[12px] h-[18px] bg-transparent text-white/90 text-right focus:outline-none border-none placeholder-white/80"
                  placeholder="Macdonald Realty"
                />
                <div className="flex items-center justify-end gap-1 text-[11px] text-white">
                  <span className="font-bold">Phone:</span>
                  <StyledInput
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    inputStyle={fieldStyles["number"]}
                    onChangeStyle={(s) => updateFieldStyle("number", s)}
                    className="font-bold text-[11px] h-[16px] w-[110px] bg-transparent text-white text-right focus:outline-none border-none placeholder-white"
                    placeholder="604.000.0000"
                  />
                </div>
                <div className="flex items-center justify-end gap-1 text-[11px] text-white">
                  <span className="font-bold">Email:</span>
                  <StyledInput
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    inputStyle={fieldStyles["email"]}
                    onChangeStyle={(s) => updateFieldStyle("email", s)}
                    className="font-normal text-[11px] h-[16px] w-[170px] bg-transparent text-white text-right focus:outline-none border-none placeholder-white/80"
                    placeholder="agent@example.com"
                  />
                </div>
                <div className="flex items-center justify-end gap-1 text-[11px] text-white">
                  <span className="font-bold">MLS #</span>
                  <StyledInput
                    value={mlsNumber}
                    onChange={(e) => setMlsNumber(e.target.value)}
                    inputStyle={fieldStyles["mlsNumber"]}
                    onChangeStyle={(s) => updateFieldStyle("mlsNumber", s)}
                    className="font-bold text-[11px] h-[16px] w-[80px] bg-transparent text-white text-right focus:outline-none border-none placeholder-white"
                    placeholder="00000"
                  />
                </div>
              </div>

              {/* Disclaimer Bar */}
              <div className="flex items-center gap-2 pt-2 border-t border-white/20 text-white/90 text-[8px] leading-tight">
                <House className="w-4 h-4 shrink-0" />
                <p className="flex-1">
                  All information deemed reliable but not guaranteed and should be independently verified. All properties are subject to prior sale, change or withdrawal. Neither listing broker(s) nor BC Floor Plans shall be responsible for any typographical errors, misinformation, misprints and shall be held totally harmless.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* --- PAGE 2 DIVIDER --- */}
        <div className="w-[8.5in] flex items-center justify-center pb-6 pt-10 print:hidden select-none">
          <div className="h-[1px] bg-gray-300 flex-1"></div>
          <span className="text-gray-400 font-medium tracking-widest text-sm px-4">PAGE 2</span>
          <div className="h-[1px] bg-gray-300 flex-1"></div>
        </div>

        {/* --- PAGE 2 WRAPPER --- */}
        <div className="pdf-page w-[8.5in] h-[11in] relative overflow-hidden flex flex-col bg-white">
          {/* Background SVG graphics */}
          <svg
            viewBox="0 0 816 1056"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="absolute inset-0 w-full h-full pointer-events-none z-0"
            preserveAspectRatio="none"
          >
            {/* Top Taupe & Navy Background Swoop */}
            <path d="M0 0 H816 V110 C816 110 500 150 0 90 Z" fill="#C2BB98" opacity="0.75" />
            <path d="M0 0 H816 V75 C816 75 520 130 0 60 Z" fill="#1B435E" />

            {/* Bottom Taupe Accent & Dark Navy Footer Banner */}
            <path d="M0 970 C0 970 450 930 816 990 V1056 H0 Z" fill="#C2BB98" opacity="0.6" />
            <path d="M0 1010 H816 V1056 H0 Z" fill="#1B435E" />
          </svg>

          {/* PAGE 2 CONTENT */}
          <div className="relative z-10 w-full h-full flex flex-col justify-between p-8">
            {/* Header info area (Address & Totals) */}
            <div className="flex justify-between items-start pt-2">
              <div className="flex flex-col">
                <StyledInput
                  value={roadName}
                  onChange={(e) => setRoadName(e.target.value)}
                  inputStyle={fieldStyles["roadName"]}
                  onChangeStyle={(s) => updateFieldStyle("roadName", s)}
                  className="font-bold text-[22px] text-gray-900 bg-transparent focus:outline-none border-none placeholder-gray-700"
                  placeholder="000-0000 Address Avenue,"
                />
                <StyledInput
                  value={cityLine}
                  onChange={(e) => setCityLine(e.target.value)}
                  inputStyle={fieldStyles["cityLine"]}
                  onChangeStyle={(s) => updateFieldStyle("cityLine", s)}
                  className="font-bold text-[18px] text-gray-900 bg-transparent focus:outline-none border-none placeholder-gray-700"
                  placeholder="Langley"
                />

                {/* Specs Table */}
                <div className="mt-3 flex flex-col gap-1 text-[13px] text-gray-800">
                  <div className="font-semibold text-gray-900">Total**</div>
                  <div className="flex items-center gap-2">
                    <span className="w-24 font-medium text-gray-700">Main Level:</span>
                    <StyledInput
                      value={sqft}
                      onChange={(e) => setSqft(e.target.value)}
                      inputStyle={fieldStyles["sqft"]}
                      onChangeStyle={(s) => updateFieldStyle("sqft", s)}
                      className="font-semibold text-[13px] text-gray-900 w-[55px] text-right bg-transparent focus:outline-none border-none placeholder-gray-500"
                      placeholder="000"
                    />
                    <span>sq.ft.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-24 font-medium text-gray-700">Patio:</span>
                    <StyledInput
                      value={patioSqft}
                      onChange={(e) => setPatioSqft(e.target.value)}
                      inputStyle={fieldStyles["patioSqft"]}
                      onChangeStyle={(s) => updateFieldStyle("patioSqft", s)}
                      className="font-semibold text-[13px] text-gray-900 w-[55px] text-right bg-transparent focus:outline-none border-none placeholder-gray-500"
                      placeholder="00"
                    />
                    <span>sq.ft.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Floor Plan Main Container (Image 7) */}
            <div className="my-auto w-full h-[620px] flex items-center justify-center p-2 bg-white/90 rounded shadow-sm border border-gray-200">
              {renderImageSlot(
                "image7",
                "w-full h-full border border-gray-200",
                "Select Floor Plan Image (Image 7)"
              )}
            </div>

            {/* Floor Plan Specs & Disclaimer Footer */}
            <div className="flex flex-col gap-2 pb-6">
              <div className="flex justify-between items-end">
                {/* Room Info */}
                <div className="flex flex-col">
                  <div className="font-bold text-[14px] uppercase text-gray-900">MAIN LEVEL</div>
                  <div className="flex items-center gap-1 text-[11px] text-gray-700">
                    <span>Floor Area:</span>
                    <StyledInput
                      value={sqft}
                      onChange={(e) => setSqft(e.target.value)}
                      inputStyle={fieldStyles["sqft"]}
                      onChangeStyle={(s) => updateFieldStyle("sqft", s)}
                      className="font-medium text-[11px] text-gray-900 w-[35px] bg-transparent focus:outline-none border-none placeholder-gray-600"
                      placeholder="000"
                    />
                    <span>Sq. Ft.</span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-gray-700">
                    <span>Ceiling Height:</span>
                    <StyledInput
                      value={ceilingHeight}
                      onChange={(e) => setCeilingHeight(e.target.value)}
                      inputStyle={fieldStyles["ceilingHeight"]}
                      onChangeStyle={(s) => updateFieldStyle("ceilingHeight", s)}
                      className="font-medium text-[11px] text-gray-900 w-[45px] bg-transparent focus:outline-none border-none placeholder-gray-600"
                      placeholder="0' 0&quot;"
                    />
                  </div>
                </div>

                {/* Compass & Scale Graphic */}
                <div className="flex flex-col items-center">
                  <div className="w-7 h-7 rounded-full border border-gray-800 flex items-center justify-center text-[10px] font-bold relative mb-1">
                    N
                    <div className="absolute bottom-0 w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-b-[6px] border-b-gray-800"></div>
                  </div>
                  <div className="flex items-center gap-2 text-[9px] text-gray-600 border-t border-gray-800 pt-0.5 w-32 justify-between">
                    <span>0 ft</span>
                    <span>3 ft</span>
                    <span>5 ft</span>
                    <span>10 ft</span>
                  </div>
                </div>
              </div>

              {/* Disclaimer text */}
              <p className="text-[7.5px] text-gray-500 leading-tight text-center mt-1">
                **While all reasonable attempts have been made to ensure accuracy and the square footage and room dimensions are believed to be correct to ANSI Standards, due to the possibility of human error the information cannot be guaranteed. E&O Insured for $1,000,000
              </p>
            </div>

            {/* Bottom Page 2 Footer Banner */}
            <div className="absolute bottom-2 left-0 w-full text-center text-white text-[11px] font-semibold tracking-wider">
              DESIGNED AND PRINTED BY BC FLOOR PLANS
            </div>
          </div>
        </div>
      </div>
    );
  }
);

BcfpStandard21.displayName = "BcfpStandard21";

export default BcfpStandard21;
