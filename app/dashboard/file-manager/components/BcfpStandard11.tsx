import { Pencil, Trash, ZoomIn, ZoomOut } from "lucide-react";
import Image from "next/image";
import React, { forwardRef, useImperativeHandle, useRef, useState, useEffect } from "react";
import { Order } from "../../orders/page";
import "../../../globals.css";
import StyledInput from "./StyledInput";
import ImageSourceModal from "./ImageSourceModal";
import FileManagerGallery from "./fileManagerGallery";
import { featureSheetService } from "../file-manager";
import { FeatureSheetResponse, FeatureSheetPayload } from "../types/featureSheetTypes";
import { useFileManagerContext } from "../FileManagerContext";

export interface BcfpStandard11Ref {
  exportToPayload: () => Promise<FeatureSheetPayload>;
  importFromPayload: (payload: FeatureSheetResponse) => void;
}

interface BcfpStandard11Props {
  orderData: Order | null;
}

const BcfpStandard11 = forwardRef<BcfpStandard11Ref, BcfpStandard11Props>(({ orderData }, ref) => {
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
  const [mlsNumber, setMlsNumber] = useState("");
  const [bedroom, setBedroom] = useState("");
  const [bathroom, setBathroom] = useState("");
  const [sqft, setSqft] = useState("");
  const [builtYear, setBuiltYear] = useState("");
  const [fieldStyles, setFieldStyles] = useState<Record<string, any>>({});

  const updateFieldStyle = (fieldName: string, style: any) => {
    setFieldStyles((prev) => ({
      ...prev,
      [fieldName]: style,
    }));
  };

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
    image1: 1, image2: 1, image3: 1, image4: 1, image5: 1, image6: 1, image7: 1, image8: 1, image9: 1,
    image10: 1, image11: 1, image12: 1, image13: 1, image14: 1, image15: 1, image16: 1, image17: 1, image18: 1,
  });

  const [position, setPosition] = useState({
    image1: { x: 0, y: 0 }, image2: { x: 0, y: 0 }, image3: { x: 0, y: 0 }, image4: { x: 0, y: 0 }, image5: { x: 0, y: 0 }, image6: { x: 0, y: 0 }, image7: { x: 0, y: 0 }, image8: { x: 0, y: 0 }, image9: { x: 0, y: 0 },
    image10: { x: 0, y: 0 }, image11: { x: 0, y: 0 }, image12: { x: 0, y: 0 }, image13: { x: 0, y: 0 }, image14: { x: 0, y: 0 }, image15: { x: 0, y: 0 }, image16: { x: 0, y: 0 }, image17: { x: 0, y: 0 }, image18: { x: 0, y: 0 },
  });

  const [dragging, setDragging] = useState({
    image1: false, image2: false, image3: false, image4: false, image5: false, image6: false, image7: false, image8: false, image9: false,
    image10: false, image11: false, image12: false, image13: false, image14: false, image15: false, image16: false, image17: false, image18: false,
  });

  const lastPosition = useRef({
    image1: { x: 0, y: 0 }, image2: { x: 0, y: 0 }, image3: { x: 0, y: 0 }, image4: { x: 0, y: 0 }, image5: { x: 0, y: 0 }, image6: { x: 0, y: 0 }, image7: { x: 0, y: 0 }, image8: { x: 0, y: 0 }, image9: { x: 0, y: 0 },
    image10: { x: 0, y: 0 }, image11: { x: 0, y: 0 }, image12: { x: 0, y: 0 }, image13: { x: 0, y: 0 }, image14: { x: 0, y: 0 }, image15: { x: 0, y: 0 }, image16: { x: 0, y: 0 }, image17: { x: 0, y: 0 }, image18: { x: 0, y: 0 },
  });

  const [showImageSourceModal, setShowImageSourceModal] = useState(false);
  const [currentImageSlot, setCurrentImageSlot] = useState<string | null>(null);
  const [showGallery, setShowGallery] = useState(false);

  const openImageSourceModal = (slot: string | null) => {
    setCurrentImageSlot(slot);
    setShowImageSourceModal(true);
  };
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

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    exportToPayload: async () => {
      const payload = await featureSheetService.buildPayload({
        orderUuid: orderData?.uuid || "",
        templateKey: "BCFPStandard11",
        uploadedBy: "admin",
        type: "template",
        primaryColor: "#376173",
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
          addressCode,
          cityLine,
          mlsNumber,
          propertyName
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
      const s = (val: any) => (typeof val === 'string' ? val : (val?.value || ''));

      if (state.offeredAtPrice) setAmount(s(state.offeredAtPrice));
      if (state.realtorName) setFullName(s(state.realtorName));
      if (state.emailLink) setEmail(s(state.emailLink));
      if (state.propertyNotesTitle) setRoadName(s(state.propertyNotesTitle));
      if (state.propertyNotesDescription) setDescription(s(state.propertyNotesDescription));

      if (state.expandedDetail1Description) setByLawRestrictions(s(state.expandedDetail1Description));
      if (state.expandedDetail2Description) setMaintFees(s(state.expandedDetail2Description));
      if (state.expandedDetail3Description) setMaintFeesInclude(s(state.expandedDetail3Description));
      if (state.expandedDetail4Description) setFeaturesIncluded(s(state.expandedDetail4Description));

      if (state.keyHighlights) setSiteInfluences(state.keyHighlights.join("\n"));

      if (state.otherDetails) {
        const details = state.otherDetails as Record<string, unknown>;
        if (details.amenities) setAmenities(s(details.amenities));
        if (details.view) setView(s(details.view));
        if (details.bedroom) setBedroom(s(details.bedroom));
        if (details.bathroom) setBathroom(s(details.bathroom));
        if (details.sqft) setSqft(s(details.sqft));
        if (details.builtYear) setBuiltYear(s(details.builtYear));
        if (details.number) setNumber(s(details.number));
        if (details.addressCode) setAddressCode(s(details.addressCode));
        if (details.cityLine) setCityLine(s(details.cityLine));
        if (details.mlsNumber) setMlsNumber(s(details.mlsNumber));
        if (details.propertyName) setPropertyName(s(details.propertyName));
      }

      if (state.fieldStyles) setFieldStyles(state.fieldStyles);
      if (state.images) setImages((prev) => ({ ...prev, ...(state.images as unknown as typeof images) }));
      if (state.imageScales) setScale((prev) => ({ ...prev, ...(state.imageScales as unknown as typeof scale) }));
      if (state.imagePositions) setPosition((prev) => ({ ...prev, ...(state.imagePositions as unknown as typeof position) }));
    },
  }));
  console.log("orderData", orderData);
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
      if (formData.propertyName) setPropertyName(formData.propertyName);
      if (formData.amount) setAmount(formData.amount);
      if (formData.number) setNumber(formData.number);
      if (formData.addressCode) setAddressCode(formData.addressCode);
      if (formData.roadName) setRoadName(formData.roadName);
      if (formData.cityLine) setCityLine(formData.cityLine);
      if (formData.mlsNumber) setMlsNumber(formData.mlsNumber);
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
      propertyName,
      amount,
      number,
      addressCode,
      roadName,
      cityLine,
      mlsNumber,
      bedroom,
      bathroom,
      sqft,
      builtYear
    });
  }, [
    byLawRestrictions,
    maintFees,
    maintFeesInclude,
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
    mlsNumber,
    bedroom,
    bathroom,
    sqft,
    builtYear,
    updateFormData
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
      <div className="w-full flex  justify-center font-alexandria">
        <div className="w-1/2 flex flex-col bg-[#43454B]">
          <div className="relative z-10">
            <svg
              viewBox="163 83 631 114"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className=""
            >
              <g opacity={0.350006} filter="url(#filter0_d_20_1415)">
                <path
                  d="M794 141C794 141 678.203 92.031 463 154C223 244 164.5 149 164.5 149V83H794V144.5"
                  fill="black"
                />
              </g>
              <path
                d="M793.592 137.865C793.592 137.865 655.583 84.5849 440.821 159.465C226.06 234.345 163 147.945 163 147.945V83H477.5H794L793.592 136.425"
                fill="white"
              />
              <path
                opacity={0.350006}
                d="M794 160.5C794 160.5 656.323 102.81 441.12 171.096C225.916 239.382 166 151.064 166 151.064L167.5 83.5H794V158.5"
                fill="white"
              />
              <defs>
                <filter
                  id="filter0_d_20_1415"
                  x={0.5}
                  y={0}
                  width={953.5}
                  height={433.744}
                  filterUnits="userSpaceOnUse"
                  colorInterpolationFilters="sRGB"
                >
                  <feFlood floodOpacity={0} result="BackgroundImageFix" />
                  <feColorMatrix
                    in="SourceAlpha"
                    type="matrix"
                    values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                    result="hardAlpha"
                  />
                  <feOffset dx={-2} dy={79} />
                  <feGaussianBlur stdDeviation={81} />
                  <feComposite in2="hardAlpha" operator="out" />
                  <feColorMatrix
                    type="matrix"
                    values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"
                  />
                  <feBlend
                    mode="normal"
                    in2="BackgroundImageFix"
                    result="effect1_dropShadow_20_1415"
                  />
                  <feBlend
                    mode="normal"
                    in="SourceGraphic"
                    in2="effect1_dropShadow_20_1415"
                    result="shape"
                  />
                </filter>
              </defs>
            </svg>
            <div className="absolute top-[18px] right-[68px] group">
              <div
                className="w-[200px] h-[94px] relative bg-white shadow-md overflow-hidden group"
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
                      alt="selected"
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

                    {/* Zoom Controls */}
                    <div className="absolute bottom-1 left-1 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
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
                      className="absolute top-2 right-10 z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                      title="Edit image"
                    >
                      <Pencil className="w-4 h-4 text-gray-700" />
                    </button>

                    {/* Delete Button */}
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
                    className="w-[200px] h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
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
            </div>
            <div className="absolute top-[15px] left-[35px] z-2 text-black ">
              <div className="font-bold text-[11px] flex gap-2">
                <span className="font-normal">CONTACT:</span>
                <StyledInput
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  inputStyle={fieldStyles.fullName}
                  onChangeStyle={(style) => updateFieldStyle("fullName", style)}
                  rows={1}
                  className=" text-[11px] text-[#B3B394] h-[18px] bg-transparent text-left w-full focus:outline-none border-none placeholder-black placeholder:font-[500]"
                  placeholder="FIRSTNAME LASTNAME"
                />
              </div>
              <StyledInput
                value={propertyName}
                rows={1}
                onChange={(e) => setPropertyName(e.target.value)}
                inputStyle={fieldStyles.propertyName}
                onChangeStyle={(style) => updateFieldStyle("propertyName", style)}
                className=" text-[11px] font-thin h-[18px] font- bg-transparent text-left text-black w-full focus:outline-none border-none placeholder-black placeholder:font-[200]"
                placeholder="MACDONALD  Realty"
              />
              <div className="flex gap-2">
                <div className="flex gap-2 text-black text-[11px]">
                  PHONE:
                  <StyledInput
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    inputStyle={fieldStyles.number}
                    onChangeStyle={(style) => updateFieldStyle("number", style)}
                    rows={1}
                    className="font-thin inline text-[11px] h-[22px] bg-transparent text-left w-full focus:outline-none border-none placeholder-black placeholder:font-[500]"
                    placeholder="604.000.0000"
                  />
                </div>
                <div className="flex gap-2 text-black text-[11px]">
                  EMAIL:
                  <StyledInput
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    inputStyle={fieldStyles.email}
                    onChangeStyle={(style) => updateFieldStyle("email", style)}
                    rows={1}
                    className="font-thin inline text-[11px] h-[22px] bg-transparent text-left w-[180px] focus:outline-none border-none placeholder-black placeholder:font-[500]"
                    placeholder="FIRST@LAST.COM"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="px-[50px] pt-[50px] ">
            <div
              className="w-[658px] h-[700px] place-self-center border-2 border-[#fff] relative overflow-hidden flex items-center justify-center group"
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

                  {/* Zoom Controls */}
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

                  {/* Edit Button */}
                  <button
                    type="button"
                    onClick={() => openImageSourceModal("image2")}
                    className="absolute top-2 right-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                    title="Edit image"
                  >
                    <Pencil className="w-4 h-4 text-gray-700" />
                  </button>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => handleDelete("image2", fileInputRef2)}
                    className="absolute top-2 right-2 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
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
          <div className=" relative px-[30px] py-[10px]">
            <div className="relative px-6 py-2 z-2 text-white">
              <p className="text-[6px] w-[67%] leading-tight">
                All information deemed reliable but not guaranteed and should be
                independently verified. All properties are subject to prior
                sale, change or withdrawal. Neither listing broker(s) nor BC
                Floor Plans shall be responsible for any typographical errors,
                misinformation, misprints and shall be held totally harmless.
              </p>
              <p className="font-bold text-[10px]">
                DESIGNED AND PRINTED BY BC FLOOR PLANS
              </p>
            </div>
          </div>
        </div>
        <div className="w-1/2 bg-[#43454B] flex flex-col relative ">
          <div className="absolute top-[115px]  z-10 flex justify-center self-center">
            <div
              className="w-[200px] h-[94px] relative bg-white shadow-md group overflow-hidden"
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
                    alt="selected"
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

                  {/* Zoom Controls */}
                  <div className="absolute bottom-2 right-2 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
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

                  {/* Edit Button */}
                  <button
                    type="button"
                    onClick={() => openImageSourceModal("image3")}
                    className="absolute top-2 right-10 z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                    title="Edit image"
                  >
                    <Pencil className="w-4 h-4 text-gray-700" />
                  </button>

                  {/* Delete Button */}
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
                  className="w-[200px] h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
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
          </div>
          <div className="grid grid-cols-4 mt-[35px]">
            {/* Image 4 */}
            <div
              className="h-[116px] relative group border-2 border-[#ffffff] overflow-hidden"
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

                  <div className="absolute bottom-2 right-2 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
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
                    onClick={() => openImageSourceModal("image4")}
                    className="absolute top-2 right-10 z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                    title="Edit image"
                  >
                    <Pencil className="w-4 h-4 text-gray-700" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete("image4", fileInputRef4)}
                    className="absolute top-2 right-2 z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
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
              className="h-[116px] relative group border-2 border-[#ffffff] overflow-hidden"
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

                  <div className="absolute bottom-2 left-2 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
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
                    className="absolute top-2 right-10 z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                    title="Edit image"
                  >
                    <Pencil className="w-4 h-4 text-gray-700" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete("image5", fileInputRef5)}
                    className="absolute top-2 right-2 z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
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
              className="h-[116px] relative group border-2 border-[#ffffff] overflow-hidden"
              onMouseDown={(e) => handleMouseDown("image6", e)}
              onMouseMove={(e) => handleMouseMove("image6", e)}
              onMouseUp={() => handleMouseUp("image6")}
              onMouseLeave={() => handleMouseLeave("image6")}
            >
              {images.image6 ? (
                <>
                  <Image
                    unoptimized
                    src={images.image6}
                    alt="uploaded"
                    width={200}
                    height={300}
                    className="w-full h-full object-cover transition-transform duration-150"
                    style={{
                      transform: `scale(${scale.image6}) translate(${position.image6.x}px, ${position.image6.y}px)`,
                      cursor: dragging.image6
                        ? "grabbing"
                        : scale.image6 > 1
                          ? "grab"
                          : "default",
                    }}
                  />

                  <div className="absolute bottom-2 right-2 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
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
                    className="absolute top-2 right-10 z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                    title="Edit image"
                  >
                    <Pencil className="w-4 h-4 text-gray-700" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete("image6", fileInputRef6)}
                    className="absolute top-2 right-2 z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
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
              className="h-[116px] relative group border-2 border-[#ffffff] overflow-hidden"
              onMouseDown={(e) => handleMouseDown("image7", e)}
              onMouseMove={(e) => handleMouseMove("image7", e)}
              onMouseUp={() => handleMouseUp("image7")}
              onMouseLeave={() => handleMouseLeave("image7")}
            >
              {images.image7 ? (
                <>
                  <Image
                    unoptimized
                    src={images.image7}
                    alt="uploaded"
                    width={200}
                    height={300}
                    className="w-full h-full object-cover transition-transform duration-150"
                    style={{
                      transform: `scale(${scale.image7}) translate(${position.image7.x}px, ${position.image7.y}px)`,
                      cursor: dragging.image7
                        ? "grabbing"
                        : scale.image7 > 1
                          ? "grab"
                          : "default",
                    }}
                  />

                  <div className="absolute bottom-2 right-2 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
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
                    className="absolute top-2 right-10 z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                    title="Edit image"
                  >
                    <Pencil className="w-4 h-4 text-gray-700" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete("image7", fileInputRef7)}
                    className="absolute top-2 right-2 z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
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
          <div className="relative">
            <div
              className="w-full h-[420px] place-self-center border-2 border-[#ffffff] relative overflow-hidden flex items-center justify-center group"
              onMouseDown={(e) => handleMouseDown("image8", e)}
              onMouseMove={(e) => handleMouseMove("image8", e)}
              onMouseUp={() => handleMouseUp("image8")}
              onMouseLeave={() => handleMouseLeave("image8")}
            >
              {images.image8 ? (
                <>
                  <Image
                    unoptimized
                    src={images.image8}
                    alt="uploaded"
                    width={200}
                    height={300}
                    className="w-full h-full object-cover transition-transform duration-150"
                    style={{
                      transform: `scale(${scale.image8}) translate(${position.image8.x}px, ${position.image8.y}px)`,
                      cursor: dragging.image8
                        ? "grabbing"
                        : scale.image8 > 1
                          ? "grab"
                          : "default",
                    }}
                  />

                  <div className="absolute bottom-14 right-2 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
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

                  <button
                    type="button"
                    onClick={() => openImageSourceModal("image8")}
                    className="absolute top-12 right-10 z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                    title="Edit image"
                  >
                    <Pencil className="w-4 h-4 text-gray-700" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete("image8", fileInputRef8)}
                    className="absolute top-12 right-2 z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                    title="Delete image"
                  >
                    <Trash className="w-4 h-4 text-red-500" />
                  </button>
                </>
              ) : (
                <div
                  onClick={() => fileInputRef8.current?.click()}
                  className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
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
            {/* Overlay Inputs */}
            <div className="absolute bottom-0 right-0 left-0 w-full py-2 place-items-center place-self-center bg-white/75 z-20">
              <div className="font-bold text-[14px] text-[#2C2E35] flex flex-wrap items-center gap-2">
                <div className="inline">
                  <StyledInput
                    value={bedroom}
                    onChange={(e) => setBedroom(e.target.value)}
                    inputStyle={fieldStyles.bedroom}
                    onChangeStyle={(style) => updateFieldStyle("bedroom", style)}
                    className="font-semibold text-[13px] bg-transparent text-left w-[20px] h-[20px] focus:outline-none border-none placeholder-black placeholder:font-[500]"
                    placeholder="0"
                  />
                </div>
                BEDROOM •
                <div className="inline">
                  <StyledInput
                    value={bathroom}
                    onChange={(e) => setBathroom(e.target.value)}
                    inputStyle={fieldStyles.bathroom}
                    onChangeStyle={(style) => updateFieldStyle("bathroom", style)}
                    className="font-semibold text-[13px] bg-transparent text-left w-[20px] h-[20px] focus:outline-none border-none placeholder-black placeholder:font-[500]"
                    placeholder="0"
                  />
                </div>
                BATHROOM •
                <div className="inline">
                  <StyledInput
                    value={sqft}
                    onChange={(e) => setSqft(e.target.value)}
                    inputStyle={fieldStyles.sqft}
                    onChangeStyle={(style) => updateFieldStyle("sqft", style)}
                    className="font-semibold text-[13px] bg-transparent text-left h-[20px] w-[45px] focus:outline-none border-none placeholder-black placeholder:font-[500]"
                    placeholder="000"
                  />
                </div>
                SQ FT • BUILT IN
                <div className="inline">
                  <StyledInput
                    value={builtYear}
                    onChange={(e) => setBuiltYear(e.target.value)}
                    inputStyle={fieldStyles.builtYear}
                    onChangeStyle={(style) => updateFieldStyle("builtYear", style)}
                    className="font-semibold text-[13px] bg-transparent text-left h-[20px] w-[45px] focus:outline-none border-none placeholder-black placeholder:font-[500]"
                    placeholder="0000"
                  />
                </div>
                •
                <div className="inline">
                  <StyledInput
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    inputStyle={fieldStyles.amount}
                    onChangeStyle={(style) => updateFieldStyle("amount", style)}
                    className="font-semibold text-[13px] bg-transparent text-left h-[20px] w-[80px] focus:outline-none border-none placeholder-black placeholder:font-[500]"
                    placeholder="$000,000"
                  />
                </div>
              </div>
            </div>

          </div>
          <div className="text-white flex flex-col items-center justify-center py-10 space-y-2">
            <div className="tracking-wide mt-0 flex">
              #
              <StyledInput
                value={addressCode}
                onChange={(e) => setAddressCode(e.target.value)}
                inputStyle={fieldStyles.addressCode}
                onChangeStyle={(style) => updateFieldStyle("addressCode", style)}
                className="font-light text-[30px] h-[30px] w-[250px] leading-none mt-0 bg-transparent text-[#FFF] text-left focus:outline-none border-none placeholder-[#FFF] placeholder:font-[200]"
                placeholder="0000-0000"
              />
            </div>
            <div className="text-[60px] font-light leading-none mt-0 flex">
              Number
              <StyledInput
                value={roadName}
                onChange={(e) => setRoadName(e.target.value)}
                inputStyle={fieldStyles.roadName}
                onChangeStyle={(style) => updateFieldStyle("roadName", style)}
                className="font-light text-[30px] h-[30px] leading-none mt-0 bg-transparent text-[#fff] text-center w-[65px] focus:outline-none border-none placeholder-[#fff] placeholder:font-[200]"
                placeholder="0"
              />
              Road
            </div>
            <div className=" tracking-[2px] uppercase mt-0 flex justify-center">
              <StyledInput
                value={cityLine}
                onChange={(e) => setCityLine(e.target.value)}
                inputStyle={fieldStyles.cityLine}
                onChangeStyle={(style) => updateFieldStyle("cityLine", style)}
                className="text-white text-[13px] h-[20px] bg-transparent text-center w-[300px] focus:outline-none border-none placeholder-[#FFF] placeholder:font-[200]"
                placeholder="BRIGHOUSE SOUTH, RICHMOND"
              />
            </div>
            <div className="text-[30px] font-light mt-0">
              <StyledInput
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                inputStyle={fieldStyles.amount}
                onChangeStyle={(style) => updateFieldStyle("amount", style)}
                className="font-semibold text-center text-[#fff] text-[30px] h-[40px] bg-transparent w-[200px] focus:outline-none border-none placeholder-[#fff] placeholder:font-[500]"
                placeholder="$000,000"
              />
            </div>
          </div>
          <svg
            viewBox="163 79 631 114"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className=""
          >
            <g opacity={0.350006} filter="url(#filter0_d_20_1415)">
              <path
                d="M794 135C794 135 678.203 183.969 463 122C223 32 164.5 127 164.5 127V193H794V131.5"
                fill="black"
              />
            </g>
            <path
              d="M793.592 138.135C793.592 138.135 655.583 191.415 440.821 116.535C226.06 41.6551 163 128.055 163 128.055V193H477.5H794L793.592 139.575"
              fill="white"
            />
            <path
              opacity={0.350006}
              d="M794 115.5C794 115.5 656.323 173.19 441.12 104.904C225.916 36.6177 166 124.936 166 124.936L167.5 192.5H794V117.5"
              fill="white"
            />
            <defs>
              <filter
                id="filter0_d_20_1415"
                x={0.5}
                y={0.256348}
                width={953.5}
                height={433.744}
                filterUnits="userSpaceOnUse"
                colorInterpolationFilters="sRGB"
              >
                <feFlood floodOpacity={0} result="BackgroundImageFix" />
                <feColorMatrix
                  in="SourceAlpha"
                  type="matrix"
                  values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                  result="hardAlpha"
                />
                <feOffset dx={-2} dy={79} />
                <feGaussianBlur stdDeviation={81} />
                <feComposite in2="hardAlpha" operator="out" />
                <feColorMatrix
                  type="matrix"
                  values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"
                />
                <feBlend
                  mode="normal"
                  in2="BackgroundImageFix"
                  result="effect1_dropShadow_20_1415"
                />
                <feBlend
                  mode="normal"
                  in="SourceGraphic"
                  in2="effect1_dropShadow_20_1415"
                  result="shape"
                />
              </filter>
            </defs>
          </svg>
        </div>
      </div>
      <div className="w-full flex flex-col bg-[#43454B] justify-center font-alexandria relative">
        <div className="flex gap-4 relative z-[1]">
          <div className="w-1/2 flex flex-col gap-4 pl-[50px] py-[50px]">
            <div className="flex gap-4">
              <div className="grid grid-cols-1 gap-4 w-[50%]">
                {/* Image 9 */}
                <div
                  className="h-[200px] relative group border-2 border-[#ffffff] overflow-hidden"
                  onMouseDown={(e) => handleMouseDown("image9", e)}
                  onMouseMove={(e) => handleMouseMove("image9", e)}
                  onMouseUp={() => handleMouseUp("image9")}
                  onMouseLeave={() => handleMouseLeave("image9")}
                >
                  {images.image9 ? (
                    <>
                      <Image
                        unoptimized
                        src={images.image9}
                        alt="uploaded"
                        width={200}
                        height={300}
                        className="w-full h-full object-cover transition-transform duration-150"
                        style={{
                          transform: `scale(${scale.image9}) translate(${position.image9.x}px, ${position.image9.y}px)`,
                          cursor: dragging.image9
                            ? "grabbing"
                            : scale.image9 > 1
                              ? "grab"
                              : "default",
                        }}
                      />

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
                  className="h-[200px] relative group border-2 border-[#ffffff] overflow-hidden"
                  onMouseDown={(e) => handleMouseDown("image10", e)}
                  onMouseMove={(e) => handleMouseMove("image10", e)}
                  onMouseUp={() => handleMouseUp("image10")}
                  onMouseLeave={() => handleMouseLeave("image10")}
                >
                  {images.image10 ? (
                    <>
                      <Image
                        unoptimized
                        src={images.image10}
                        alt="uploaded"
                        width={200}
                        height={300}
                        className="w-full h-full object-cover transition-transform duration-150"
                        style={{
                          transform: `scale(${scale.image10}) translate(${position.image10.x}px, ${position.image10.y}px)`,
                          cursor: dragging.image10
                            ? "grabbing"
                            : scale.image10 > 1
                              ? "grab"
                              : "default",
                        }}
                      />

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
              <div className="text-[10px] w-[50%] flex flex-col font-normal text-white italic relative z-10 leading-[1.6]">
                <h2 className="text-[22px] tracking-[-1px] font-bold">
                  ON TOP OF IT ALL! BEAUTIFUL SUB-PENTHOUSE IN THE WELL
                  APPOINTED CENTRO BUILDING.
                </h2>
                <StyledInput
                  value={description}
                  rows={10}
                  onChange={(e) => setDescription(e.target.value)}
                  inputStyle={fieldStyles.description}
                  onChangeStyle={(style) => updateFieldStyle("description", style)}
                  className="font-normal text-[10px] h-[200px] z-20 text-white leading-[1.6] italic bg-transparent text-left focus:outline-none border-none placeholder-white placeholder:font-[500]"
                  placeholder="This centrally located 2 bedroom, 2 bathroom home boasts incredible, totally unobstructed VIEWS overlooking Brighouse Park & to the South
              and South Westproviding unhindered privacy. The perfect floorplan with open concept living and cross unit bedrooms. Dark laminate flooring,
              S/S appliances, Gas range and a large open ‘den/nook’ area perfect for the home office. Huge private balcony, great building amenities
              including exercise room, sauna, roof top courtyard and outdoor kids playground. With parking, and storage locker and balance of the the 5-10
              warranty, this home provides nothing but exceptional value. Call today to set up your viewing.
              This centrally located 2 bedroom, 2 bathroom home boasts incredible, totally unobstructed VIEWS overlooking Brighouse Park & to the South
              and South Westproviding unhindered privacy. The perfect floorplan with open concept living and cross unit bedrooms. Dark laminate flooring,
              S/S appliances, Gas range and a large open ‘den/nook’ area perfect for the home office. Huge private balcony, great building amenities
              including exercise room, sauna, roof top courtyard and outdoor kids playground. With parking, and storage locker and balance of the the 5-10
              warranty, this home provides nothing but exceptional value. Call today to set up your viewing."
                />
              </div>
            </div>

            <div
              className="w-full h-[420px] place-self-center z-10 relative border-2 border-[#ffffff] overflow-hidden flex items-center justify-center group"
              onMouseDown={(e) => handleMouseDown("image11", e)}
              onMouseMove={(e) => handleMouseMove("image11", e)}
              onMouseUp={() => handleMouseUp("image11")}
              onMouseLeave={() => handleMouseLeave("image11")}
            >
              {images.image11 ? (
                <>
                  <Image
                    unoptimized
                    src={images.image11}
                    alt="uploaded"
                    width={200}
                    height={300}
                    className="w-full h-full object-cover transition-transform duration-150"
                    style={{
                      transform: `scale(${scale.image11}) translate(${position.image11.x}px, ${position.image11.y}px)`,
                      cursor: dragging.image11
                        ? "grabbing"
                        : scale.image11 > 1
                          ? "grab"
                          : "default",
                    }}
                  />

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

                  <button
                    type="button"
                    onClick={() => openImageSourceModal("image11")}
                    className="absolute top-10 right-10 z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                    title="Edit image"
                  >
                    <Pencil className="w-4 h-4 text-gray-700" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete("image11", fileInputRef11)}
                    className="absolute top-10 right-2 z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
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
            <div className="w-[45%] py-[50px]">
              <div className="grid grid-cols-1 gap-4">
                {/* Image 12 */}
                <div
                  className="h-[200px] relative z-10 group border-2 border-[#ffffff] overflow-hidden"
                  onMouseDown={(e) => handleMouseDown("image12", e)}
                  onMouseMove={(e) => handleMouseMove("image12", e)}
                  onMouseUp={() => handleMouseUp("image12")}
                  onMouseLeave={() => handleMouseLeave("image12")}
                >
                  {images.image12 ? (
                    <>
                      <Image
                        unoptimized
                        src={images.image12}
                        alt="uploaded"
                        width={200}
                        height={300}
                        className="w-full h-full object-cover transition-transform duration-150"
                        style={{
                          transform: `scale(${scale.image12}) translate(${position.image12.x}px, ${position.image12.y}px)`,
                          cursor: dragging.image12
                            ? "grabbing"
                            : scale.image12 > 1
                              ? "grab"
                              : "default",
                        }}
                      />
                      <div className="absolute bottom-2 right-2 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
                        <button
                          onClick={() => handleZoom("image12", "in")}
                          className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                          title="Zoom In"
                        >
                          <ZoomIn className="w-4 h-4 text-gray-700" />
                        </button>
                        <button
                          onClick={() => handleZoom("image12", "out")}
                          className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                          title="Zoom Out"
                        >
                          <ZoomOut className="w-4 h-4 text-gray-700" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => openImageSourceModal("image12")}
                        className="absolute top-2 right-10 z-10 bg-white p-1 rounded-full hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
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

                {/* Image 13 */}
                <div
                  className="h-[200px] relative z-10 group border-2 border-[#ffffff] overflow-hidden"
                  onMouseDown={(e) => handleMouseDown("image13", e)}
                  onMouseMove={(e) => handleMouseMove("image13", e)}
                  onMouseUp={() => handleMouseUp("image13")}
                  onMouseLeave={() => handleMouseLeave("image13")}
                >
                  {images.image13 ? (
                    <>
                      <Image
                        unoptimized
                        src={images.image13}
                        alt="uploaded"
                        width={200}
                        height={300}
                        className="w-full h-full object-cover transition-transform duration-150"
                        style={{
                          transform: `scale(${scale.image13}) translate(${position.image13.x}px, ${position.image13.y}px)`,
                          cursor: dragging.image13
                            ? "grabbing"
                            : scale.image13 > 1
                              ? "grab"
                              : "default",
                        }}
                      />
                      <div className="absolute bottom-2 right-2 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
                        <button
                          onClick={() => handleZoom("image13", "in")}
                          className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                          title="Zoom In"
                        >
                          <ZoomIn className="w-4 h-4 text-gray-700" />
                        </button>
                        <button
                          onClick={() => handleZoom("image13", "out")}
                          className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                          title="Zoom Out"
                        >
                          <ZoomOut className="w-4 h-4 text-gray-700" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => openImageSourceModal("image13")}
                        className="absolute top-2 right-10 z-10 bg-white p-1 rounded-full hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
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

                {/* Image 14 */}
                <div
                  className="h-[200px] relative z-10 group border-2 border-[#ffffff] overflow-hidden"
                  onMouseDown={(e) => handleMouseDown("image14", e)}
                  onMouseMove={(e) => handleMouseMove("image14", e)}
                  onMouseUp={() => handleMouseUp("image14")}
                  onMouseLeave={() => handleMouseLeave("image14")}
                >
                  {images.image14 ? (
                    <>
                      <Image
                        unoptimized
                        src={images.image14}
                        alt="uploaded"
                        width={200}
                        height={300}
                        className="w-full h-full object-cover transition-transform duration-150"
                        style={{
                          transform: `scale(${scale.image14}) translate(${position.image14.x}px, ${position.image14.y}px)`,
                          cursor: dragging.image14
                            ? "grabbing"
                            : scale.image14 > 1
                              ? "grab"
                              : "default",
                        }}
                      />
                      <div className="absolute bottom-2 right-2 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
                        <button
                          onClick={() => handleZoom("image14", "in")}
                          className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                          title="Zoom In"
                        >
                          <ZoomIn className="w-4 h-4 text-gray-700" />
                        </button>
                        <button
                          onClick={() => handleZoom("image14", "out")}
                          className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                          title="Zoom Out"
                        >
                          <ZoomOut className="w-4 h-4 text-gray-700" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => openImageSourceModal("image14")}
                        className="absolute top-2 right-10 z-10 bg-white p-1 rounded-full hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
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

                {/* Image 15 */}
                <div
                  className="h-[200px] relative z-10 group border-2 border-[#ffffff] overflow-hidden"
                  onMouseDown={(e) => handleMouseDown("image15", e)}
                  onMouseMove={(e) => handleMouseMove("image15", e)}
                  onMouseUp={() => handleMouseUp("image15")}
                  onMouseLeave={() => handleMouseLeave("image15")}
                >
                  {images.image15 ? (
                    <>
                      <Image
                        unoptimized
                        src={images.image15}
                        alt="uploaded"
                        width={200}
                        height={300}
                        className="w-full h-full object-cover transition-transform duration-150"
                        style={{
                          transform: `scale(${scale.image15}) translate(${position.image15.x}px, ${position.image15.y}px)`,
                          cursor: dragging.image15
                            ? "grabbing"
                            : scale.image15 > 1
                              ? "grab"
                              : "default",
                        }}
                      />
                      <div className="absolute bottom-2 right-2 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
                        <button
                          onClick={() => handleZoom("image15", "in")}
                          className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                          title="Zoom In"
                        >
                          <ZoomIn className="w-4 h-4 text-gray-700" />
                        </button>
                        <button
                          onClick={() => handleZoom("image15", "out")}
                          className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                          title="Zoom Out"
                        >
                          <ZoomOut className="w-4 h-4 text-gray-700" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => openImageSourceModal("image15")}
                        className="absolute top-2 right-10 z-10 bg-white p-1 rounded-full hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
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
            </div>
            <div className="w-[55%] flex flex-col gap-4 bg-white/50 pr-[50px] py-[50px] pl-[20px]">
              <div
                className="h-[200px] relative z-10 group border-2 border-[#ffffff] overflow-hidden"
                onMouseDown={(e) => handleMouseDown("image17", e)}
                onMouseMove={(e) => handleMouseMove("image17", e)}
                onMouseUp={() => handleMouseUp("image17")}
                onMouseLeave={() => handleMouseLeave("image17")}
              >
                {images.image17 ? (
                  <>
                    <Image
                      unoptimized
                      src={images.image17}
                      alt="uploaded"
                      width={200}
                      height={300}
                      className="w-full h-full object-cover transition-transform duration-150"
                      style={{
                        transform: `scale(${scale.image17}) translate(${position.image17.x}px, ${position.image17.y}px)`,
                        cursor: dragging.image17
                          ? "grabbing"
                          : scale.image17 > 1
                            ? "grab"
                            : "default",
                      }}
                    />

                    <div className="absolute bottom-2 right-2 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
                      <button
                        onClick={() => handleZoom("image17", "in")}
                        className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                        title="Zoom In"
                      >
                        <ZoomIn className="w-4 h-4 text-gray-700" />
                      </button>
                      <button
                        onClick={() => handleZoom("image17", "out")}
                        className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                        title="Zoom Out"
                      >
                        <ZoomOut className="w-4 h-4 text-gray-700" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => openImageSourceModal("image17")}
                      className="absolute top-2 right-10 z-10 bg-white p-1 rounded-full hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                      title="Edit image"
                    >
                      <Pencil className="w-4 h-4 text-gray-700" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete("image17", fileInputRef17)}
                      className="absolute top-2 right-2 z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                      title="Delete image"
                    >
                      <Trash className="w-4 h-4 text-red-500" />
                    </button>
                  </>
                ) : (
                  <div
                    onClick={() => openImageSourceModal("image17")}
                    className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
                  >
                    Select Image
                  </div>
                )}

                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef17}
                  onChange={(e) => handleImageChange("image17", e)}
                  className="hidden"
                />
              </div>

              <div className="flex gap-4 text-[#595B61] text-[12px] leading-relaxed">
                <div className="w-1/2 space-y-2 text-[8px]">
                  <div>
                    <span className="font-bold">BY-LAW RESTRICTIONS:</span>{" "}
                    <StyledInput
                      value={byLawRestrictions}
                      rows={1}
                      onChange={(e) => setByLawRestrictions(e.target.value)}
                      inputStyle={fieldStyles.byLawRestrictions}
                      onChangeStyle={(style) => updateFieldStyle("byLawRestrictions", style)}
                      className="font-semibold text-[8px] bg-transparent text-left w-full focus:outline-none border-none placeholder-[#595B61] placeholder:font-[500]"
                      placeholder="Pets Allowed w/Rest., Rentals Allowed"
                    />
                  </div>
                  <div>
                    <span className="font-bold">MAINT. FEES:</span>{" "}
                    <StyledInput
                      value={maintFees}
                      rows={1}
                      onChange={(e) => setMaintFees(e.target.value)}
                      inputStyle={fieldStyles.maintFees}
                      onChangeStyle={(style) => updateFieldStyle("maintFees", style)}
                      className="font-semibold text-[8px] bg-transparent text-left w-full focus:outline-none border-none placeholder-[#595B61] placeholder:font-[500]"
                      placeholder="$000.00"
                    />
                  </div>
                  <div>
                    <span className="font-bold">MAINT. FEES INCLUDE:</span>
                    <StyledInput
                      value={maintFeesInclude}
                      onChange={(e) => setMaintFeesInclude(e.target.value)}
                      inputStyle={fieldStyles.maintFeesInclude}
                      onChangeStyle={(style) => updateFieldStyle("maintFeesInclude", style)}
                      className="font-semibold text-[8px] bg-transparent text-left w-full focus:outline-none border-none placeholder-[#595B61] placeholder:font-[500]"
                      placeholder="Gardening, Garbage Pickup, Gas, Hot Water, Management, Recreation Facility, Other, Caretaker"
                    />
                  </div>
                  <div>
                    <span className="font-bold">FEATURES INCLUDED:</span>
                    <StyledInput
                      value={featuresIncluded}
                      onChange={(e) => setFeaturesIncluded(e.target.value)}
                      inputStyle={fieldStyles.featuresIncluded}
                      onChangeStyle={(style) => updateFieldStyle("featuresIncluded", style)}
                      className="font-semibold text-[8px] bg-transparent text-left w-full focus:outline-none border-none placeholder-[#595B61] placeholder:font-[500]"
                      placeholder="Clothes Washer/Dryer/ Fridge/Stove/DW, Drapes/ Window Coverings"
                    />
                  </div>
                </div>
                <div className="w-1/2 space-y-2 text-[8px]">
                  <div>
                    <span className="font-bold">SITE INFLUENCES:</span>
                    <StyledInput
                      value={siteInfluences}
                      onChange={(e) => setSiteInfluences(e.target.value)}
                      inputStyle={fieldStyles.siteInfluences}
                      onChangeStyle={(style) => updateFieldStyle("siteInfluences", style)}
                      className="font-semibold text-[8px] bg-transparent text-left w-full focus:outline-none border-none placeholder-[#595B61] placeholder:font-[500]"
                      placeholder="Central Location, Golf Course Nearby, Recreation Nearby, Shopping Nearby"
                    />
                  </div>
                  <div>
                    <span className="font-bold">AMENITIES:</span>
                    <StyledInput
                      value={amenities}
                      onChange={(e) => setAmenities(e.target.value)}
                      inputStyle={fieldStyles.amenities}
                      onChangeStyle={(style) => updateFieldStyle("amenities", style)}
                      className="font-semibold text-[8px] bg-transparent text-left w-full focus:outline-none border-none placeholder-[#595B61] placeholder:font-[500]"
                      placeholder="Exercise Centre, Garden, In Suite Laundry, Sauna/Steam Room"
                    />
                  </div>
                  <div>
                    <span className="font-bold">VIEW:</span>{" "}
                    <StyledInput
                      value={view}
                      rows={1}
                      onChange={(e) => setView(e.target.value)}
                      inputStyle={fieldStyles.view}
                      onChangeStyle={(style) => updateFieldStyle("view", style)}
                      className="font-semibold text-[8px] bg-transparent text-left w-full focus:outline-none border-none placeholder-[#595B61] placeholder:font-[500]"
                      placeholder="South & SW - Van Isl."
                    />
                  </div>
                  <div className="mt-0">
                    <StyledInput
                      value={mlsNumber}
                      onChange={(e) => setMlsNumber(e.target.value)}
                      inputStyle={fieldStyles.mlsNumber}
                      onChangeStyle={(style) => updateFieldStyle("mlsNumber", style)}
                      className="font-semibold text-[8px] bg-transparent text-left w-full focus:outline-none border-none placeholder-[#595B61] placeholder:font-[500]"
                      placeholder="Enter MLS here"
                    />
                  </div>
                </div>
              </div>
              <div
                className="w-full h-[430px] place-self-center border-2 z-10 border-[#fff] relative overflow-hidden flex items-center justify-center group"
                onMouseDown={(e) => handleMouseDown("image18", e)}
                onMouseMove={(e) => handleMouseMove("image18", e)}
                onMouseUp={() => handleMouseUp("image18")}
                onMouseLeave={() => handleMouseLeave("image18")}
              >
                {images.image18 ? (
                  <>
                    <Image
                      unoptimized
                      src={images.image18}
                      alt="uploaded"
                      width={200}
                      height={300}
                      className="w-full h-full object-cover transition-transform duration-150"
                      style={{
                        transform: `scale(${scale.image18}) translate(${position.image18.x}px, ${position.image18.y}px)`,
                        cursor:
                          dragging.image18
                            ? "grabbing"
                            : scale.image18 > 1
                              ? "grab"
                              : "default",
                      }}
                    />

                    <div className="absolute bottom-2 right-2 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
                      <button
                        onClick={() => handleZoom("image18", "in")}
                        className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                        title="Zoom In"
                      >
                        <ZoomIn className="w-4 h-4 text-gray-700" />
                      </button>
                      <button
                        onClick={() => handleZoom("image18", "out")}
                        className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                        title="Zoom Out"
                      >
                        <ZoomOut className="w-4 h-4 text-gray-700" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => openImageSourceModal("image18")}
                      className="absolute top-2 right-10 bg-white p-1 rounded-full shadow opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                      title="Edit image"
                    >
                      <Pencil className="w-4 h-4 text-gray-700" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete("image18", fileInputRef18)}
                      className="absolute top-2 right-2 bg-white p-1 rounded-full shadow opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                      title="Delete image"
                    >
                      <Trash className="w-4 h-4 text-red-500" />
                    </button>
                  </>
                ) : (
                  <div
                    onClick={() => openImageSourceModal("image18")}
                    className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
                  >
                    Select Image
                  </div>
                )}

                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef18}
                  onChange={(e) => handleImageChange("image18", e)}
                  className="hidden"
                />
              </div>
            </div>
          </div>
        </div>
        <svg
          viewBox="164 80 628 81.73"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="absolute bottom-25 left-0 right-0"
        >
          <path
            opacity="0.350006"
            d="M792 116.5C792 116.5 654.323 174.19 439.12 105.904C223.916 37.6178 164 125.936 164 125.936C164 125.936 210.5 45.0673 441.5 123.5C656.5 196.5 792 142.5 792 142.5V118.5"
            fill="white"
          ></path>
          <g opacity="0.350006" filter="url(#filter0_d_36_1418)">
            <path
              d="M792 136.347C792 136.347 677.111 184.924 461.737 122.645C221.546 32.1944 164 126 164 126V128C164 128 218.35 46.7071 461.737 129C652.5 193.5 792 142.5 792 142.5V136.347Z"
              fill="black"
            ></path>
          </g>
          <defs>
            <filter
              id="filter0_d_36_1418"
              x="0"
              y="0.296387"
              width="952"
              height="402.344"
              filterUnits="userSpaceOnUse"
              colorInterpolationFilters="sRGB"
            >
              <feFlood floodOpacity="0" result="BackgroundImageFix"></feFlood>
              <feColorMatrix
                in="SourceAlpha"
                type="matrix"
                values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                result="hardAlpha"
              ></feColorMatrix>
              <feOffset dx="-2" dy="79"></feOffset>
              <feGaussianBlur stdDeviation="81"></feGaussianBlur>
              <feComposite in2="hardAlpha" operator="out"></feComposite>
              <feColorMatrix
                type="matrix"
                values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"
              ></feColorMatrix>
              <feBlend
                mode="normal"
                in2="BackgroundImageFix"
                result="effect1_dropShadow_36_1418"
              ></feBlend>
              <feBlend
                mode="normal"
                in="SourceGraphic"
                in2="effect1_dropShadow_36_1418"
                result="shape"
              ></feBlend>
            </filter>
          </defs>
        </svg>
      </div>
    </>
  );
});

BcfpStandard11.displayName = "BcfpStandard11";
export default BcfpStandard11;
