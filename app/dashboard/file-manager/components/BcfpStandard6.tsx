import { House, Pencil, Trash, ZoomIn, ZoomOut } from "lucide-react";
import Image from "next/image";
import React, { forwardRef, useImperativeHandle, useRef, useState, useEffect } from "react";
import { Order } from "../../orders/page";
import { featureSheetService } from "../file-manager";
import { FeatureSheetResponse, FeatureSheetPayload, TextStyle, StyledTextField } from "../types/featureSheetTypes";
import "../../../globals.css";
import StyledInput from "./StyledInput";
import ImageSourceModal from "./ImageSourceModal";
import FileManagerGallery from "./fileManagerGallery";
import { useFileManagerContext } from "../FileManagerContext";

export interface BcfpStandard6Ref {
  exportToPayload: () => Promise<FeatureSheetPayload>;
  importFromPayload: (payload: FeatureSheetResponse) => void;
}

interface BcfpStandard6Props {
  orderData: Order | null;
}

const BcfpStandard6 = forwardRef<BcfpStandard6Ref, BcfpStandard6Props>(({ orderData }, ref) => {
  const [byLawRestrictions, setByLawRestrictions] = useState("");
  const [maintFees, setMaintFees] = useState("");
  const [maintFeesInclude, setMaintFeesInclude] = useState("");
  const [featuresIncluded, setFeaturesIncluded] = useState("");
  const [siteInfluences, setSiteInfluences] = useState("");
  const [amenities, setAmenities] = useState("");
  const [view, setView] = useState("");
  const [bedroom, setBedroom] = useState("");
  const [bathroom, setBathroom] = useState("");
  const [sqft, setSqft] = useState("");
  const [builtYear, setBuiltYear] = useState("");
  const [description, setDescription] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [propertyName, setPropertyName] = useState("");
  const [amount, setAmount] = useState("");
  const [number, setNumber] = useState("");
  const [addressCode, setAddressCode] = useState("");
  const [roadName, setRoadName] = useState("");
  const [cityLine, setCityLine] = useState("");
  const [fieldStyles, setFieldStyles] = useState<Record<string, TextStyle>>({});

  const updateFieldStyle = (field: string, style: TextStyle) =>
    setFieldStyles((prev) => ({ ...prev, [field]: style }));

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


  // Expose methods to parent component via ref
  useImperativeHandle(ref, () => ({
    exportToPayload: async () => {
      const payload = await featureSheetService.buildPayload({
        orderUuid: orderData?.uuid || "",
        templateKey: "BCFPStandard6",
        uploadedBy: "admin",
        type: "template",
        primaryColor: "#376173",
        offeredAtPrice: { value: amount, style: fieldStyles.amount || {} as TextStyle },
        realtorName: { value: fullName, style: fieldStyles.fullName || {} as TextStyle },
        emailLink: { value: email, style: fieldStyles.email || {} as TextStyle },
        companyName: { value: propertyName, style: fieldStyles.propertyName || {} as TextStyle },
        propertyNotesTitle: { value: roadName, style: fieldStyles.roadName || {} as TextStyle },
        propertyNotesDescription: { value: description, style: fieldStyles.description || {} as TextStyle },
        expandedDetail1Title: "By-law Restrictions",
        expandedDetail1Description: { value: byLawRestrictions, style: fieldStyles.byLawRestrictions || {} as TextStyle },
        expandedDetail2Title: "Maint. Fees",
        expandedDetail2Description: { value: maintFees, style: fieldStyles.maintFees || {} as TextStyle },
        expandedDetail3Title: "Maint. Fees Include",
        expandedDetail3Description: { value: maintFeesInclude, style: fieldStyles.maintFeesInclude || {} as TextStyle },
        expandedDetail4Title: "Features Included",
        expandedDetail4Description: { value: featuresIncluded, style: fieldStyles.featuresIncluded || {} as TextStyle },
        keyHighlightLabel: "Site Influences",
        keyHighlights: siteInfluences ? siteInfluences.split("\n").filter(Boolean) : [],
        otherDetails: {
          amenities: { value: amenities, style: fieldStyles.amenities || {} as TextStyle },
          view: { value: view, style: fieldStyles.view || {} as TextStyle },
          bedroom: { value: bedroom, style: fieldStyles.bedroom || {} as TextStyle },
          bathroom: { value: bathroom, style: fieldStyles.bathroom || {} as TextStyle },
          sqft: { value: sqft, style: fieldStyles.sqft || {} as TextStyle },
          builtYear: { value: builtYear, style: fieldStyles.builtYear || {} as TextStyle },
          number: { value: number, style: fieldStyles.number || {} as TextStyle },
          addressCode: { value: addressCode, style: fieldStyles.addressCode || {} as TextStyle },
          cityLine: { value: cityLine, style: fieldStyles.cityLine || {} as TextStyle }
        },
        images,
        imageScales: scale,
        imagePositions: position,
      });
      return payload;
    },

    importFromPayload: (payload: FeatureSheetResponse) => {
      const state = featureSheetService.parsePayloadToState(payload);
      const s = (val: any) => (typeof val === 'string' ? val : (val?.value || ''));

      if (state.offeredAtPrice) setAmount(s(state.offeredAtPrice));
      if (state.realtorName) setFullName(s(state.realtorName));
      if (state.emailLink) setEmail(s(state.emailLink));
      if (state.companyName) setPropertyName(s(state.companyName));
      if (state.propertyNotesTitle) setRoadName(s(state.propertyNotesTitle));
      if (state.propertyNotesDescription) setDescription(s(state.propertyNotesDescription));

      if (state.expandedDetail1Description) setByLawRestrictions(s(state.expandedDetail1Description));
      if (state.expandedDetail2Description) setMaintFees(s(state.expandedDetail2Description));
      if (state.expandedDetail3Description) setMaintFeesInclude(s(state.expandedDetail3Description));
      if (state.expandedDetail4Description) setFeaturesIncluded(s(state.expandedDetail4Description));

      if (state.keyHighlights) {
        setSiteInfluences(Array.isArray(state.keyHighlights)
          ? state.keyHighlights.map(h => s(h)).join("\n")
          : s(state.keyHighlights));
      }

      if (state.otherDetails) {
        const details = state.otherDetails as Record<string, any>;
        if (details.amenities) setAmenities(s(details.amenities));
        if (details.view) setView(s(details.view));
        if (details.bedroom) setBedroom(s(details.bedroom));
        if (details.bathroom) setBathroom(s(details.bathroom));
        if (details.sqft) setSqft(s(details.sqft));
        if (details.builtYear) setBuiltYear(s(details.builtYear));
        if (details.number) setNumber(s(details.number));
        if (details.addressCode) setAddressCode(s(details.addressCode));
        if (details.cityLine) setCityLine(s(details.cityLine));
      }

      // Restore saved styles from server payload
      const styles: Record<string, TextStyle> = {};
      const c = payload.content;
      const st = (f: any) => (f as StyledTextField)?.style;

      if (st(c.offeredAtPrice)) styles.amount = st(c.offeredAtPrice);
      if (st(c.realtorName)) styles.fullName = st(c.realtorName);
      if (st(c.emailLink)) styles.email = st(c.emailLink);
      if (st(c.companyName)) styles.propertyName = st(c.companyName);
      if (st(c.propertyNotesTitle)) styles.roadName = st(c.propertyNotesTitle);
      if (st(c.propertyNotesDescription)) styles.description = st(c.propertyNotesDescription);
      if (st(c.expandedDetail1Description)) styles.byLawRestrictions = st(c.expandedDetail1Description);
      if (st(c.expandedDetail2Description)) styles.maintFees = st(c.expandedDetail2Description);
      if (st(c.expandedDetail3Description)) styles.maintFeesInclude = st(c.expandedDetail3Description);
      if (st(c.expandedDetail4Description)) styles.featuresIncluded = st(c.expandedDetail4Description);

      const od = c.otherDetails as Record<string, any>;
      if (od) {
        if (st(od.amenities)) styles.amenities = st(od.amenities);
        if (st(od.view)) styles.view = st(od.view);
        if (st(od.bedroom)) styles.bedroom = st(od.bedroom);
        if (st(od.bathroom)) styles.bathroom = st(od.bathroom);
        if (st(od.sqft)) styles.sqft = st(od.sqft);
        if (st(od.builtYear)) styles.builtYear = st(od.builtYear);
        if (st(od.number)) styles.number = st(od.number);
        if (st(od.addressCode)) styles.addressCode = st(od.addressCode);
        if (st(od.cityLine)) styles.cityLine = st(od.cityLine);
      }

      setFieldStyles(styles);

      if (state.images) setImages((prev) => ({ ...prev, ...(state.images as unknown as typeof images) }));
      if (state.imageScales) setScale((prev) => ({ ...prev, ...(state.imageScales as unknown as typeof scale) }));
      if (state.imagePositions) setPosition((prev) => ({ ...prev, ...(state.imagePositions as unknown as typeof position) }));
    },
  }));


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
      if (formData.bedroom) setBedroom(formData.bedroom);
      if (formData.bathroom) setBathroom(formData.bathroom);
      if (formData.sqft) setSqft(formData.sqft);
      if (formData.builtYear) setBuiltYear(formData.builtYear);
      if (formData.description) setDescription(formData.description);
      if (formData.fullName) setFullName(formData.fullName);
      if (formData.email) setEmail(formData.email);
      if (formData.propertyName) setPropertyName(formData.propertyName);
      if (formData.amount) setAmount(formData.amount);
      if (formData.number) setNumber(formData.number);
      if (formData.addressCode) setAddressCode(formData.addressCode);
      if (formData.roadName) setRoadName(formData.roadName);
      if (formData.cityLine) setCityLine(formData.cityLine);

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
      bedroom,
      bathroom,
      sqft,
      builtYear,
      description,
      fullName,
      email,
      propertyName,
      amount,
      number,
      addressCode,
      roadName,
      cityLine,
      images,
      imageScales: scale,
      imagePositions: position
    });
  }, [
    byLawRestrictions, maintFees, maintFeesInclude, featuresIncluded, siteInfluences,
    amenities, view, bedroom, bathroom, sqft, builtYear, description, fullName,
    email, propertyName, amount, number, addressCode, roadName, cityLine,
    images, scale, position, updateFormData
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
      <div className="pdf-page">
        <div className="w-full flex  justify-center font-alexandria">
          <div className="w-1/2 bg-white flex flex-col relative">
            <div
              className="w-full h-full bg-white place-self-center relative overflow-hidden flex items-center justify-center group"
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
                    className="absolute top-24 right-10 z-10 bg-white p-1 rounded-full hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                    title="Edit image"
                  >
                    <Pencil className="w-4 h-4 text-gray-700" />
                  </button>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => handleDelete("image1", fileInputRef1)}
                    className="absolute top-24 right-2 z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
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
          </div>
          <div className="w-1/2 bg-[#376173] flex flex-col relative">
            <div className="flex w-full flex-col justify-center relative z-[19] items-center pt-[50px]">
              <div className="text-[28px] font-light leading-none mt-0 text-[#00B9F2] flex">
                <span className="inline">
                  <StyledInput
                    value={addressCode}
                    onChange={(e) => setAddressCode(e.target.value)}
                    onChangeStyle={(s) => updateFieldStyle("addressCode", s)}
                    inputStyle={fieldStyles.addressCode}
                    className="font-light text-[28px] h-[30px] w-[150px] leading-none mt-0 bg-transparent text-[#00B9F2] text-left focus:outline-none border-none placeholder-[#00B9F2] placeholder:font-[200]"
                    placeholder="0000-0000"
                  />
                </span>
                <span className="text-[#226292] flex">
                  Number
                  <StyledInput
                    value={roadName}
                    onChange={(e) => setRoadName(e.target.value)}
                    onChangeStyle={(s) => updateFieldStyle("roadName", s)}
                    inputStyle={fieldStyles.roadName}
                    className="font-light text-[28px] h-[30px] leading-none mt-0 bg-transparent text-[#226292] text-center w-[65px] focus:outline-none border-none placeholder-gray-300 placeholder:font-[200]"
                    placeholder="0"
                  />
                  Road
                </span>
              </div>
              <div className="text-[#2C2E35] text-[10px]">
                <StyledInput
                  value={cityLine}
                  onChange={(e) => setCityLine(e.target.value)}
                  onChangeStyle={(s) => updateFieldStyle("cityLine", s)}
                  inputStyle={fieldStyles.cityLine}
                  className="text-[#2C2E35] text-[10px] bg-transparent text-center w-[250px] focus:outline-none border-none placeholder-gray-300 placeholder:font-[200]"
                  placeholder="BRIGHOUSE SOUTH, RICHMOND"
                />
              </div>
              <div className="absolute bottom-[-145px] left-[50px] group z-10">
                <div
                  className="w-[200px] h-[110px] relative bg-white shadow-md group"
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
                        alt="selected"
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

                      {/* Zoom Controls */}
                      <div className="absolute bottom-1 left-1 flex gap-1 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
                        <button
                          type="button"
                          onClick={() => handleZoom("image7", "in")}
                          className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                          title="Zoom In"
                        >
                          <ZoomIn className="w-4 h-4 text-gray-700" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleZoom("image7", "out")}
                          className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                          title="Zoom Out"
                        >
                          <ZoomOut className="w-4 h-4 text-gray-700" />
                        </button>
                      </div>

                      {/* Edit Button */}
                      <button
                        type="button"
                        onClick={() => openImageSourceModal("image7")}
                        className="absolute top-2 right-10 z-8 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                        title="Edit image"
                      >
                        <Pencil className="w-4 h-4 text-gray-700" />
                      </button>

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={() => handleDelete("image7", fileInputRef7)}
                        className="absolute top-2 right-2 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                        title="Delete image"
                      >
                        <Trash className="w-4 h-4 text-red-500" />
                      </button>
                    </>
                  ) : (
                    <div
                      onClick={() => openImageSourceModal("image7")}
                      className="w-[200px] h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
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
            </div>
            <svg
              className="absolute top-0 left-0 w-full z-[18]"
              height="193"
              viewBox="0 0 648 193"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              preserveAspectRatio="none"
            >
              <mask
                id="mask0_125_1511"
                className="absolute top-0 right-0 left-0"
                maskUnits="userSpaceOnUse"
                x="0"
                y="70"
                width="648"
                height="123"
              >
                <path
                  d="M0 128.56V152.86C7.9 161.46 75.7 226.86 284.2 169.96C507.1 109.16 647.2 160.66 647.2 160.66V159.36L648 136.96V88.2596L2 70.5596L0 128.56Z"
                  fill="white"
                />
              </mask>
              <g mask="url(#mask0_125_1511)">
                <path
                  d="M673.274 40.7318L0.604411 20.1799L-25.274 867.187L647.396 887.739L673.274 40.7318Z"
                  fill="url(#paint0_linear_125_1511)"
                />
              </g>
              <path
                d="M648 141.354C648 141.354 506.181 93.772 285.49 160.644C64.8 227.517 0 150.356 0 150.356V1.52588e-05H648V140.068"
                fill="white"
              />
              <defs>
                <linearGradient
                  id="paint0_linear_125_1511"
                  x1="645.986"
                  y1="208.835"
                  x2="-1.93693"
                  y2="189.039"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="#00B9F2" />
                  <stop offset="0.391667" stopColor="#0097C9" />
                  <stop offset="0.515476" stopColor="#028DBD" />
                  <stop offset="0.892857" stopColor="#1B6C9B" />
                  <stop offset="1" stopColor="#226392" />
                </linearGradient>
              </defs>
            </svg>
            <div
              className="w-full h-[730px] mt-[25px] place-self-center relative overflow-hidden flex items-center justify-center group"
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
                  <div className="absolute bottom-1 left-1 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
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
                    className="absolute top-24 right-10 z-10 bg-white p-1 rounded-full hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                    title="Edit image"
                  >
                    <Pencil className="w-4 h-4 text-gray-700" />
                  </button>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => handleDelete("image2", fileInputRef2)}
                    className="absolute top-24 right-2 z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
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
            <div className="grid grid-cols-4">
              <div
                className="h-[170px] relative group"
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

                    {/* Zoom Controls */}
                    <div className="absolute bottom-1 left-1 flex gap-1 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
                      <button
                        type="button"
                        onClick={() => handleZoom("image3", "in")}
                        className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                        title="Zoom In"
                      >
                        <ZoomIn className="w-4 h-4 text-gray-700" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleZoom("image3", "out")}
                        className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                        title="Zoom Out"
                      >
                        <ZoomOut className="w-4 h-4 text-gray-700" />
                      </button>
                    </div>

                    {/* Edit Button */}
                    <button
                      type="button"
                      onClick={() => openImageSourceModal("image3")}
                      className="absolute top-2 right-10 z-10 bg-white p-1 rounded-full hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
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
                className="h-[170px] relative group"
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

                    {/* Zoom Controls */}
                    <div className="absolute bottom-1 left-1 flex gap-1 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
                      <button
                        type="button"
                        onClick={() => handleZoom("image4", "in")}
                        className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                        title="Zoom In"
                      >
                        <ZoomIn className="w-4 h-4 text-gray-700" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleZoom("image4", "out")}
                        className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                        title="Zoom Out"
                      >
                        <ZoomOut className="w-4 h-4 text-gray-700" />
                      </button>
                    </div>

                    {/* Edit Button */}
                    <button
                      type="button"
                      onClick={() => openImageSourceModal("image4")}
                      className="absolute top-2 right-10 z-10 bg-white p-1 rounded-full hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                      title="Edit image"
                    >
                      <Pencil className="w-4 h-4 text-gray-700" />
                    </button>

                    {/* Delete Button */}
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
              <div
                className="h-[170px] relative group"
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

                    {/* Zoom Controls */}
                    <div className="absolute bottom-1 left-1 flex gap-1 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
                      <button
                        type="button"
                        onClick={() => handleZoom("image5", "in")}
                        className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                        title="Zoom In"
                      >
                        <ZoomIn className="w-4 h-4 text-gray-700" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleZoom("image5", "out")}
                        className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                        title="Zoom Out"
                      >
                        <ZoomOut className="w-4 h-4 text-gray-700" />
                      </button>
                    </div>

                    {/* Edit Button */}
                    <button
                      type="button"
                      onClick={() => openImageSourceModal("image5")}
                      className="absolute top-2 right-10 z-10 bg-white p-1 rounded-full hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                      title="Edit image"
                    >
                      <Pencil className="w-4 h-4 text-gray-700" />
                    </button>

                    {/* Delete Button */}
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
              <div
                className="h-[170px] relative group"
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

                    {/* Zoom Controls */}
                    <div className="absolute bottom-1 left-1 flex gap-1 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
                      <button
                        type="button"
                        onClick={() => handleZoom("image6", "in")}
                        className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                        title="Zoom In"
                      >
                        <ZoomIn className="w-4 h-4 text-gray-700" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleZoom("image6", "out")}
                        className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                        title="Zoom Out"
                      >
                        <ZoomOut className="w-4 h-4 text-gray-700" />
                      </button>
                    </div>

                    {/* Edit Button */}
                    <button
                      type="button"
                      onClick={() => openImageSourceModal("image6")}
                      className="absolute top-2 right-10 z-10 bg-white p-1 rounded-full hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                      title="Edit image"
                    >
                      <Pencil className="w-4 h-4 text-gray-700" />
                    </button>

                    {/* Delete Button */}
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
            </div>
          </div>
        </div>
        <div
          className="flex h-[130px] px-[40px]"
          style={{
            background:
              "linear-gradient(90deg, #00B9F2 0%, #0097C9 39%, #028DBD 52%, #186C9B 89%, #226392 100%)",
          }}
        >
          <div className="w-1/2 py-[10px] relative">
            <div className="absolute top-[-40px] right-[45px] group">
              <div
                className="w-[200px] h-[110px] relative bg-white shadow-md group"
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
                      alt="selected"
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

                    {/* Zoom Controls */}
                    <div className="absolute bottom-1 left-1 flex gap-1 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
                      <button
                        type="button"
                        onClick={() => handleZoom("image7", "in")}
                        className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                        title="Zoom In"
                      >
                        <ZoomIn className="w-4 h-4 text-gray-700" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleZoom("image7", "out")}
                        className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                        title="Zoom Out"
                      >
                        <ZoomOut className="w-4 h-4 text-gray-700" />
                      </button>
                    </div>

                    {/* Edit Button */}
                    <button
                      type="button"
                      onClick={() => openImageSourceModal("image7")}
                      className="absolute top-2 right-10 z-8 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                      title="Edit image"
                    >
                      <Pencil className="w-4 h-4 text-gray-700" />
                    </button>

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={() => handleDelete("image7", fileInputRef7)}
                      className="absolute top-2 right-2 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                      title="Delete image"
                    >
                      <Trash className="w-4 h-4 text-red-500" />
                    </button>
                  </>
                ) : (
                  <div
                    onClick={() => openImageSourceModal("image7")}
                    className="w-[200px] h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
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
            <div className=" text-white leading-none text-left ">
              <div>
                <div className="font-semibold text-[20px] flex gap-3 w-[70%]">
                  <StyledInput
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    onChangeStyle={(s) => updateFieldStyle("fullName", s)}
                    inputStyle={fieldStyles.fullName}
                    className=" text-[20px] h-[22px] bg-transparent text-left w-full focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
                    placeholder="FIRSTNAME LASTNAME"
                  />
                  <StyledInput
                    value={propertyName}
                    onChange={(e) => setPropertyName(e.target.value)}
                    onChangeStyle={(s) => updateFieldStyle("propertyName", s)}
                    inputStyle={fieldStyles.propertyName}
                    className=" text-[20px] h-[22px] font- bg-transparent text-left w-full focus:outline-none border-none placeholder-gray-300 placeholder:font-[200]"
                    placeholder="MACDONALD  Realty"
                  />
                </div>
                <div className="font-semibold text-[20px] flex gap-3 w-[70%]">
                  <StyledInput
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    onChangeStyle={(s) => updateFieldStyle("number", s)}
                    inputStyle={fieldStyles.number}
                    className="font-semibold text-[20px] h-[22px] bg-transparent text-left w-full focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
                    placeholder="604.000.0000"
                  />
                  <StyledInput
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onChangeStyle={(s) => updateFieldStyle("email", s)}
                    inputStyle={fieldStyles.email}
                    className="font-thin text-[20px] h-[22px] bg-transparent text-left w-full focus:outline-none border-none placeholder-gray-300 placeholder:font-[200]"
                    placeholder="Enter email here"
                  />
                </div>
              </div>
              <div className="text-start mt-3  font-thin flex w-[60%]">
                <span className="text-[8px]">
                  All information deemed reliable but not guaranteed and should
                  be independently verified. All properties are subject to prior
                  sale, change or withdrawal. Neither listing broker(s) nor BC
                  Floor Plans shall be responsible for any typographical errors,
                  misinformation, misprints and shall be held totally harmless.
                </span>
                <span className="flex mt-2">
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
          </div>
          <div className="w-1/2 text-center text-[30px] text-white content-center">
            <StyledInput
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onChangeStyle={(s) => updateFieldStyle("amount", s)}
              inputStyle={fieldStyles.amount}
              className="font-semibold text-center text-[30px] h-[30px] bg-transparent w-full focus:outline-none border-none placeholder-white placeholder:font-[500]"
              placeholder="$000,000"
            />
          </div>
        </div>
      </div>
      <div className="pdf-page">
        <div className="w-full flex flex-col justify-center font-alexandria relative p-[50px] pb-[20px]">
          <div className="flex gap-4">
            <div className="w-1/2 flex flex-col gap-4">
              <div
                className="w-full h-[420px] place-self-center z-10 relative overflow-hidden flex items-center justify-center group"
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

                    {/* Zoom Controls */}
                    <div className="absolute bottom-1 left-1 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
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

                    {/* Edit Button */}
                    <button
                      type="button"
                      onClick={() => openImageSourceModal("image8")}
                      className="absolute top-24 right-10 z-10 bg-white p-1 rounded-full hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                      title="Edit image"
                    >
                      <Pencil className="w-4 h-4 text-gray-700" />
                    </button>

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={() => handleDelete("image8", fileInputRef8)}
                      className="absolute top-24 right-2 z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                      title="Delete image"
                    >
                      <Trash className="w-4 h-4 text-red-500" />
                    </button>
                  </>
                ) : (
                  <div
                    onClick={() => openImageSourceModal("image8")}
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
              <StyledInput
                value={description}
                rows={6}
                onChange={(e) => setDescription(e.target.value)}
                onChangeStyle={(s) => updateFieldStyle("description", s)}
                inputStyle={fieldStyles.description}
                className="font-normal text-[10px] h-[80px] z-20 text-black leading-[1.8] italic bg-transparent text-left focus:outline-none border-none placeholder-black placeholder:font-[500]"
                placeholder="On top of it all! Beautiful sub-penthouse in the well appointed CENTRO building. This centrally located 2 bedroom, 2 bathroom home
                  boasts incredible, totally unobstructed VIEWS overlooking Brighouse Park & to the South and South Westproviding unhindered privacy.
                  The perfect floorplan with open concept living and cross unit bedrooms. Dark laminate flooring, S/S appliances, Gas range and a large
                  open ‘den/nook’ area perfect for the home office. Huge private balcony, great building amenities including exercise room, sauna, roof top
                  courtyard and outdoor kids playground. With parking, and storage locker and balance of the the 5-10 warranty, this home provides
                  nothing but exceptional value. Call today to set up your viewing."
              />
              <div className="grid grid-cols-2 gap-4">
                <div
                  className="h-[180px] relative z-10 group"
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

                      {/* Zoom Controls */}
                      <div className="absolute bottom-1 left-1 flex gap-1 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
                        <button
                          type="button"
                          onClick={() => handleZoom("image9", "in")}
                          className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                          title="Zoom In"
                        >
                          <ZoomIn className="w-4 h-4 text-gray-700" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleZoom("image9", "out")}
                          className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                          title="Zoom Out"
                        >
                          <ZoomOut className="w-4 h-4 text-gray-700" />
                        </button>
                      </div>

                      {/* Edit Button */}
                      <button
                        type="button"
                        onClick={() => openImageSourceModal("image9")}
                        className="absolute top-2 right-10 z-10 bg-white p-1 rounded-full hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                        title="Edit image"
                      >
                        <Pencil className="w-4 h-4 text-gray-700" />
                      </button>

                      {/* Delete Button */}
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
                <div
                  className="h-[180px] relative z-10 group"
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

                      {/* Zoom Controls */}
                      <div className="absolute bottom-1 left-1 flex gap-1 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
                        <button
                          type="button"
                          onClick={() => handleZoom("image10", "in")}
                          className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                          title="Zoom In"
                        >
                          <ZoomIn className="w-4 h-4 text-gray-700" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleZoom("image10", "out")}
                          className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                          title="Zoom Out"
                        >
                          <ZoomOut className="w-4 h-4 text-gray-700" />
                        </button>
                      </div>

                      {/* Edit Button */}
                      <button
                        type="button"
                        onClick={() => openImageSourceModal("image10")}
                        className="absolute top-2 right-10 z-10 bg-white p-1 rounded-full hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                        title="Edit image"
                      >
                        <Pencil className="w-4 h-4 text-gray-700" />
                      </button>

                      {/* Delete Button */}
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
              <div className="font-bold text-white text-[18px] flex flex-wrap gap-2">
                <div className="inline">
                  <StyledInput
                    value={bedroom}
                    onChange={(e) => setBedroom(e.target.value)}
                    onChangeStyle={(s) => updateFieldStyle("bedroom", s)}
                    inputStyle={fieldStyles.bedroom}
                    className="font-semibold text-[13px] bg-transparent text-left w-[20px] h-[20px] focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
                    placeholder="0"
                  />
                </div>
                BEDROOM •
                <div className="inline">
                  <StyledInput
                    value={bathroom}
                    onChange={(e) => setBathroom(e.target.value)}
                    onChangeStyle={(s) => updateFieldStyle("bathroom", s)}
                    inputStyle={fieldStyles.bathroom}
                    className="font-semibold text-[13px] bg-transparent text-left w-[20px] h-[20px]  focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
                    placeholder="0"
                  />
                </div>
                BATHROOM •
                <div className="inline">
                  <StyledInput
                    value={sqft}
                    onChange={(e) => setSqft(e.target.value)}
                    onChangeStyle={(s) => updateFieldStyle("sqft", s)}
                    inputStyle={fieldStyles.sqft}
                    className="font-semibold text-[13px] bg-transparent text-left h-[20px] w-[32px] focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
                    placeholder="000"
                  />
                </div>
                SQ FT • BUILT IN
                <div className="inline">
                  <StyledInput
                    value={builtYear}
                    onChange={(e) => setBuiltYear(e.target.value)}
                    onChangeStyle={(s) => updateFieldStyle("builtYear", s)}
                    inputStyle={fieldStyles.builtYear}
                    className="font-semibold text-[13px] bg-transparent text-left h-[30px] w-[80px] focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
                    placeholder="0000"
                  />
                </div>
              </div>
            </div>
            <div className="w-1/2 flex gap-4">
              <div className="w-[40%]">
                <div className="grid grid-cols-1 gap-4">
                  <div
                    className="h-[165px] relative z-10 group"
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

                        {/* Zoom Controls */}
                        <div className="absolute bottom-1 left-1 flex gap-1 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
                          <button
                            type="button"
                            onClick={() => handleZoom("image11", "in")}
                            className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                            title="Zoom In"
                          >
                            <ZoomIn className="w-4 h-4 text-gray-700" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleZoom("image11", "out")}
                            className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                            title="Zoom Out"
                          >
                            <ZoomOut className="w-4 h-4 text-gray-700" />
                          </button>
                        </div>

                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={() => openImageSourceModal("image11")}
                          className="absolute top-2 right-10 z-10 bg-white p-1 rounded-full hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                          title="Edit image"
                        >
                          <Pencil className="w-4 h-4 text-gray-700" />
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() =>
                            handleDelete("image11", fileInputRef11)
                          }
                          className="absolute top-2 right-2 z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
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
                  <div
                    className="h-[165px] relative z-10 group"
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

                        {/* Zoom Controls */}
                        <div className="absolute bottom-1 left-1 flex gap-1 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
                          <button
                            type="button"
                            onClick={() => handleZoom("image12", "in")}
                            className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                            title="Zoom In"
                          >
                            <ZoomIn className="w-4 h-4 text-gray-700" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleZoom("image12", "out")}
                            className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                            title="Zoom Out"
                          >
                            <ZoomOut className="w-4 h-4 text-gray-700" />
                          </button>
                        </div>

                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={() => openImageSourceModal("image12")}
                          className="absolute top-2 right-10 z-10 bg-white p-1 rounded-full hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                          title="Edit image"
                        >
                          <Pencil className="w-4 h-4 text-gray-700" />
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() =>
                            handleDelete("image12", fileInputRef12)
                          }
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
                    className="h-[165px] relative z-10 group"
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

                        {/* Zoom Controls */}
                        <div className="absolute bottom-1 left-1 flex gap-1 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
                          <button
                            type="button"
                            onClick={() => handleZoom("image13", "in")}
                            className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                            title="Zoom In"
                          >
                            <ZoomIn className="w-4 h-4 text-gray-700" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleZoom("image13", "out")}
                            className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                            title="Zoom Out"
                          >
                            <ZoomOut className="w-4 h-4 text-gray-700" />
                          </button>
                        </div>

                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={() => openImageSourceModal("image13")}
                          className="absolute top-2 right-10 z-10 bg-white p-1 rounded-full hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                          title="Edit image"
                        >
                          <Pencil className="w-4 h-4 text-gray-700" />
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() =>
                            handleDelete("image13", fileInputRef13)
                          }
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
                  <div
                    className="h-[165px] relative z-10 group"
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

                        {/* Zoom Controls */}
                        <div className="absolute bottom-1 left-1 flex gap-1 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
                          <button
                            type="button"
                            onClick={() => handleZoom("image14", "in")}
                            className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                            title="Zoom In"
                          >
                            <ZoomIn className="w-4 h-4 text-gray-700" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleZoom("image14", "out")}
                            className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                            title="Zoom Out"
                          >
                            <ZoomOut className="w-4 h-4 text-gray-700" />
                          </button>
                        </div>

                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={() => openImageSourceModal("image14")}
                          className="absolute top-2 right-10 z-10 bg-white p-1 rounded-full hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                          title="Edit image"
                        >
                          <Pencil className="w-4 h-4 text-gray-700" />
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() =>
                            handleDelete("image14", fileInputRef14)
                          }
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
                </div>
              </div>
              <div className="w-[60%] flex flex-col gap-4 justify-between">
                <div
                  className="w-full h-[550px] place-self-center border-2 z-10 border-[#fff] relative overflow-hidden flex items-center justify-center group"
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

                      {/* Zoom Controls */}
                      <div className="absolute bottom-1 left-1 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
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

                      {/* Edit Button */}
                      <button
                        type="button"
                        onClick={() => openImageSourceModal("image15")}
                        className="absolute top-2 right-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                        title="Edit image"
                      >
                        <Pencil className="w-4 h-4 text-gray-700" />
                      </button>

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={() => handleDelete("image15", fileInputRef15)}
                        className="absolute top-2 right-2 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
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
                <div className="flex gap-4 text-white text-[12px] leading-relaxed pt-[20px]">
                  <div className="space-y-2 text-[8px] w-1/2">
                    <div>
                      <p className="font-bold text-[#00B9F2] text-[10px]">
                        BY-LAW RESTRICTIONS:
                      </p>
                      <StyledInput
                        value={byLawRestrictions}
                        onChange={(e) => setByLawRestrictions(e.target.value)}
                        onChangeStyle={(s) => updateFieldStyle("byLawRestrictions", s)}
                        inputStyle={fieldStyles.byLawRestrictions}
                        className="text-[9px] w-full border-none focus:outline-none placeholder-gray-300 placeholder:font-[200]"
                        placeholder="Enter details here"
                      />
                    </div>
                    <div>
                      <p className="font-bold text-[#00B9F2] text-[10px]">
                        MAINT. FEES:
                      </p>
                      <StyledInput
                        value={maintFees}
                        onChange={(e) => setMaintFees(e.target.value)}
                        onChangeStyle={(s) => updateFieldStyle("maintFees", s)}
                        inputStyle={fieldStyles.maintFees}
                        className="text-[9px] w-full border-none focus:outline-none placeholder-gray-300 placeholder:font-[200]"
                        placeholder="Enter fees here"
                      />
                    </div>
                    <div>
                      <p className="font-bold text-[#00B9F2] text-[10px]">
                        MAINT. FEES INCLUDE:
                      </p>
                      <StyledInput
                        value={maintFeesInclude}
                        onChange={(e) => setMaintFeesInclude(e.target.value)}
                        onChangeStyle={(s) => updateFieldStyle("maintFeesInclude", s)}
                        inputStyle={fieldStyles.maintFeesInclude}
                        className="text-[9px] w-full border-none focus:outline-none placeholder-gray-300 placeholder:font-[200]"
                        placeholder="Gardening, Garbage Pickup, Gas, Hot Water, Management, Recreation Facility, Other, Caretaker"
                      />
                    </div>
                    <div>
                      <p className="font-bold text-[#00B9F2] text-[10px]">
                        FEATURES INCLUDED:
                      </p>
                      <StyledInput
                        value={featuresIncluded}
                        onChange={(e) => setFeaturesIncluded(e.target.value)}
                        onChangeStyle={(s) => updateFieldStyle("featuresIncluded", s)}
                        inputStyle={fieldStyles.featuresIncluded}
                        className="text-[9px] w-full border-none focus:outline-none placeholder-gray-300 placeholder:font-[200]"
                        placeholder="Clothes Washer/Dryer/ Fridge/Stove/DW, Drapes/ Window Coverings"
                      />
                    </div>
                  </div>
                  <div className="space-y-2 text-[8px] w-1/2">
                    <div>
                      <span className="font-bold text-[#00B9F2]">
                        SITE INFLUENCES:
                      </span>
                      <StyledInput
                        value={siteInfluences}
                        onChange={(e) => setSiteInfluences(e.target.value)}
                        onChangeStyle={(s) => updateFieldStyle("siteInfluences", s)}
                        inputStyle={fieldStyles.siteInfluences}
                        className="font-semibold text-[8px] bg-transparent text-left w-full focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
                        placeholder="Central Location, Golf Course Nearby, Recreation Nearby, Shopping Nearby"
                      />
                    </div>
                    <div>
                      <span className="font-bold text-[#00B9F2]">
                        AMENITIES:
                      </span>
                      <StyledInput
                        value={amenities}
                        onChange={(e) => setAmenities(e.target.value)}
                        onChangeStyle={(s) => updateFieldStyle("amenities", s)}
                        inputStyle={fieldStyles.amenities}
                        className="font-semibold text-[8px] bg-transparent text-left w-full focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
                        placeholder="Exercise Centre, Garden, In Suite Laundry, Sauna/Steam Room"
                      />
                    </div>
                    <div>
                      <span className="font-bold text-[#00B9F2]">VIEW:</span>
                      <StyledInput
                        value={view}
                        onChange={(e) => setView(e.target.value)}
                        onChangeStyle={(s) => updateFieldStyle("view", s)}
                        inputStyle={fieldStyles.view}
                        className="font-semibold text-[8px] bg-transparent text-left w-full focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
                        placeholder="South & SW - Van Isl."
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute top-20 left-0 right-0 h-[123px]">
            <svg
              width="100%"
              height="100%"
              viewBox="0 0 648 123"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              preserveAspectRatio="none"
              className=""
            >
              <mask
                id="mask0_146_14"
                maskUnits="userSpaceOnUse"
                x="0"
                y="0"
                width="648"
                height="123"
              >
                <path
                  d="M0 58.5596V82.8596C7.9 91.4596 75.7 156.86 284.2 99.9596C507.1 39.1596 647.2 90.6596 647.2 90.6596V89.3596L648 66.9596V18.2596L2 0.559631L0 58.5596Z"
                  fill="white"
                />
              </mask>
              <g mask="url(#mask0_146_14)">
                <path
                  d="M656 95C656 95 540 19.5 291.5 77.5001C43.0002 135.5 1.90296 53.7173 1.90296 53.7173L1.90295 85C1.90295 85 79.2658 175.406 306.5 95C371.5 72 656 95 656 95Z"
                  fill="url(#paint0_linear_146_14)"
                />
              </g>
              <defs>
                <linearGradient
                  id="paint0_linear_146_14"
                  x1="629.705"
                  y1="29.4826"
                  x2="7.43761"
                  y2="10.4706"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="#00B9F2" />
                  <stop offset="0.391667" stopColor="#0097C9" />
                  <stop offset="0.515476" stopColor="#028DBD" />
                  <stop offset="0.892857" stopColor="#1B6C9B" />
                  <stop offset="1" stopColor="#226392" />
                </linearGradient>
              </defs>
            </svg></div>
          <div className="w-full absolute bottom-0 left-0 right-0 z-[-1] h-[325px]">
            <svg
              width="100%"
              height="100%"
              viewBox="0 0 1242 255"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              preserveAspectRatio="none"
              className=""
            >
              <mask
                id="mask0_146_3734"
                maskUnits="userSpaceOnUse"
                x="0"
                y="0"
                width="1242"
                height="255"
              >
                <path
                  d="M694.6 58.8C271.7 203.1 0 100.4 0 100.4V103.2V254.5H1241.6V81C1241.6 81 1181.2 0 1001 0C923 0 822.4 15.2 694.6 58.8Z"
                  fill="white"
                />
              </mask>
              <g mask="url(#mask0_146_3734)">
                <path
                  d="M0 254.5H1242V-555.5H0V254.5Z"
                  fill="url(#paint0_linear_146_3734)"
                />
              </g>
              <defs>
                <linearGradient
                  id="paint0_linear_146_3734"
                  x1="0"
                  y1="-0.0199854"
                  x2="1241.58"
                  y2="-0.0199854"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="#00B9F2" />
                  <stop offset="0.391667" stopColor="#0097C9" />
                  <stop offset="0.515476" stopColor="#028DBD" />
                  <stop offset="0.892857" stopColor="#1B6C9B" />
                  <stop offset="1" stopColor="#226392" />
                </linearGradient>
              </defs>
            </svg></div>
        </div>
      </div>
    </>
  );
});

BcfpStandard6.displayName = "BcfpStandard6";

export default BcfpStandard6;
