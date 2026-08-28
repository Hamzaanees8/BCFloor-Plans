import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  House,
  Pencil,
  Trash,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Lock,
  Unlock,
  Loader2,
} from "lucide-react";
import ImageEditor from "./ImageEditor";
import { Order } from "../../orders/page";
import { featureSheetService } from "../file-manager";
import {
  FeatureSheetResponse,
  FeatureSheetPayload,
  TextStyle,
} from "../types/featureSheetTypes";
import "../../../globals.css";
import StyledInput from "./StyledInput";
import FileManagerGallery from "./fileManagerGallery";
import { useFileManagerContext } from "../FileManagerContext";
import SafeZoneWrapper from "./SafeZoneWrapper";
import DraggableBox from "./DraggableBox";
import { DeletedDetailFieldItem } from "./DeletedFieldsPanel";

export interface BcfpStandard18Ref {
  exportToPayload: () => Promise<FeatureSheetPayload>;
  importFromPayload: (payload: FeatureSheetResponse) => void;
}

interface BcfpStandard18Props {
  orderData: Order | null;
  showBleed?: boolean;
  showGuide?: boolean;
}

// ─── BoxIndicator ─────────────────────────────────────────────────────────────
interface BoxIndicatorProps {
  isVisible: boolean;
}

const BoxIndicator: React.FC<BoxIndicatorProps> = ({ isVisible }) => {
  if (!isVisible) return null;

  return (
    <div
      data-html2canvas-ignore="true"
      className="absolute inset-0 border-[3.5px] border-[#8B3DFF] pointer-events-none z-30 transition-all duration-100"
      style={{
        boxShadow:
          "0 0 0 1.5px rgba(255, 255, 255, 0.9), 0 0 8px rgba(139, 61, 255, 0.4)",
      }}
    />
  );
};

const BcfpStandard18 = forwardRef<BcfpStandard18Ref, BcfpStandard18Props>(
  ({ orderData, showBleed: propShowBleed, showGuide: propShowGuide }, ref) => {
    const {
      formData,
      updateFormData,
      setRestoreDetailFieldHandler,
      setRestoreAllDetailFieldsHandler,
    } = useFileManagerContext();

    // ── 1. Deletion & Restoration State ──────────────────────────────────────
    const [deletedDetailFields, setDeletedDetailFields] = useState<any[]>(
      formData.deletedDetailFields || [],
    );
    const [deletedStandardFieldIds, setDeletedStandardFieldIds] = useState<
      string[]
    >(formData.deletedStandardFieldIds || []);

    const isFieldDeleted = (id: string) => deletedStandardFieldIds.includes(id);

    const removeStandardField = (
      id: string,
      title: string,
      value: string,
      section: string,
      style?: TextStyle,
    ) => {
      setDeletedStandardFieldIds((prevStandard) => {
        if (prevStandard.includes(id)) return prevStandard;
        const newDeletedStandard = [...prevStandard, id];
        const deletedItem: DeletedDetailFieldItem = {
          id,
          title,
          value: value || "",
          section,
          style,
          deletedAt: Date.now(),
        };
        setDeletedDetailFields((prevDetail) => {
          const newDeletedDetail = [
            ...prevDetail.filter((f) => f.id !== id),
            deletedItem,
          ];
          updateFormData({
            deletedStandardFieldIds: newDeletedStandard,
            deletedDetailFields: newDeletedDetail,
          });
          return newDeletedDetail;
        });
        return newDeletedStandard;
      });
    };

    const restoreDetailField = useCallback(
      (id: string) => {
        setDeletedStandardFieldIds((prevStandard) => {
          const updatedStandard = prevStandard.filter((fId) => fId !== id);
          setDeletedDetailFields((prevDetail) => {
            const updatedDeleted = prevDetail.filter((f) => f.id !== id);
            updateFormData({
              deletedStandardFieldIds: updatedStandard,
              deletedDetailFields: updatedDeleted,
            });
            return updatedDeleted;
          });
          return updatedStandard;
        });
      },
      [updateFormData],
    );

    const restoreAllDetailFields = useCallback(() => {
      setDeletedStandardFieldIds([]);
      setDeletedDetailFields([]);
      updateFormData({ deletedStandardFieldIds: [], deletedDetailFields: [] });
    }, [updateFormData]);

    useEffect(() => {
      if (setRestoreDetailFieldHandler)
        setRestoreDetailFieldHandler(() => restoreDetailField);
      if (setRestoreAllDetailFieldsHandler)
        setRestoreAllDetailFieldsHandler(() => restoreAllDetailFields);
      return () => {
        if (setRestoreDetailFieldHandler) setRestoreDetailFieldHandler(null);
        if (setRestoreAllDetailFieldsHandler)
          setRestoreAllDetailFieldsHandler(null);
      };
    }, [
      restoreDetailField,
      restoreAllDetailFields,
      setRestoreDetailFieldHandler,
      setRestoreAllDetailFieldsHandler,
    ]);

    // ── 2. Text Fields & Labels ────────────────────────────────────────────────
    const [fullName, setFullName] = useState("FIRSTNAME LASTNAME");
    const [email, setEmail] = useState("FIRSTNAME@LASTNAME.COM");
    const [propertyName, setPropertyName] = useState("MACDONALD REALTY");
    const [number, setNumber] = useState("604.000.0000");
    const [amount, setAmount] = useState("$000,000");
    const [byLawRestrictions, setByLawRestrictions] = useState(
      "Pets Allowed w/Rest., Rentals Allowed",
    );
    const [maintenanceFees, setMaintenanceFees] = useState("$000.00");
    const [maintenanceFeesInclude, setMaintenanceFeesInclude] = useState(
      "Gardening, Garbage Pickup, Gas, Hot Water, Management, Recreation Facility, Other, Caretaker",
    );
    const [featuresIncluded, setFeaturesIncluded] = useState(
      "Clothes Washer/Dryer/Fridge/Stove/DW, Drapes/Window Coverings",
    );
    const [siteInfluences, setSiteInfluences] = useState(
      "Central Location, Golf Course Nearby, Recreation Nearby, Shopping Nearby",
    );
    const [amenities, setAmenities] = useState(
      "Exercise Centre, Garden, In Suite Laundry, Sauna/Steam Room",
    );
    const [mlsNumber, setMlsNumber] = useState("0000000");
    const [view, setView] = useState("South & SW - Van Isl.");
    const [bedroom, setBedroom] = useState("0");
    const [bathroom, setBathroom] = useState("0");
    const [sqft, setSqft] = useState("000");
    const [builtYear, setBuiltYear] = useState("0000");
    const [description, setDescription] = useState(
      "On top of it all! Beautiful sub-penthouse in the well appointed CENTRO building. This centrally located 2 bedroom, 2 bathroom home boasts incredible, totally unobstructed VIEWS overlooking Brighouse Park & to the South and South Westproviding unhindered privacy. The perfect floorplan with open concept living and cross unit bedrooms. Dark laminate flooring, S/S appliances, Gas range and a large open 'den/nook' area perfect for the home office. Huge private balcony, great building amenities including exercise room, sauna, roof top courtyard and outdoor kids playground. With parking, and storage locker and balance of the the 5-10 warranty, this home provides nothing but exceptional value. Call today to set up your viewing.",
    );
    const [addressCode, setAddressCode] = useState("0000-0000");
    const [roadName, setRoadName] = useState("0 Road");
    const [cityLine, setCityLine] = useState("Brighouse South, Richmond");
    const [patioSqft, setPatioSqft] = useState("00");
    const [ceilingHeight, setCeilingHeight] = useState("0' 0\"");

    // Editable Labels
    const [contactLabel, setContactLabel] = useState("CONTACT:");
    const [phoneLabel, setPhoneLabel] = useState("PHONE:");
    const [emailLabel, setEmailLabel] = useState("EMAIL:");
    const [bedroomLabel, setBedroomLabel] = useState("BEDROOM");
    const [bathroomLabel, setBathroomLabel] = useState("BATHROOM");
    const [sqftLabel, setSqftLabel] = useState("SQ FT");
    const [builtYearLabel, setBuiltYearLabel] = useState("BUILT IN");
    const [numberLabel, setNumberLabel] = useState("Number");
    const [roadLabel, setRoadLabel] = useState("ROAD");
    const [byLawLabel, setByLawLabel] = useState("BY-LAW RESTRICTIONS:");
    const [maintFeesLabel, setMaintFeesLabel] = useState("MAINT. FEES:");
    const [maintFeesIncludeLabel, setMaintFeesIncludeLabel] = useState(
      "MAINT. FEES INCLUDE:",
    );
    const [featuresIncludedLabel, setFeaturesIncludedLabel] =
      useState("FEATURES INCLUDED:");
    const [siteInfluencesLabel, setSiteInfluencesLabel] =
      useState("SITE INFLUENCES:");
    const [amenitiesLabel, setAmenitiesLabel] = useState("AMENITIES:");
    const [viewLabel, setViewLabel] = useState("VIEW:");
    const [mlsLabel, setMlsLabel] = useState("MLS* ");
    const [disclaimerText, setDisclaimerText] = useState(
      "All information deemed reliable but not guaranteed and should be independently verified. All properties are subject to prior sale, change or withdrawal. Neither listing broker(s) nor BC Floor Plans shall be responsible for any typographical errors, misinformation, misprints and shall be held totally harmless.",
    );
    const [floorPlanDisclaimerText, setFloorPlanDisclaimerText] = useState(
      "**While all reasonable attempts have been made to ensure accuracy and the square footage and room dimensions are believed to be correct to ANSI Standards, due to the possibility of human error the information cannot be guaranteed. E&O Insured for $1,000,000",
    );
    const [footerCredit, setFooterCredit] = useState(
      "DESIGNED AND PRINTED BY BC FLOOR PLANS",
    );

    // ── 3. Bleed & Guide ─────────────────────────────────────────────────────
    const [showBleedState] = useState(true);
    const [showGuideState] = useState(true);
    const showBleed =
      propShowBleed !== undefined ? propShowBleed : showBleedState;
    const showGuide =
      propShowGuide !== undefined ? propShowGuide : showGuideState;

    // ── 4. Styles, Positions & Locks ──────────────────────────────────────────
    const [fieldStyles, setFieldStyles] = useState<Record<string, TextStyle>>(
      {},
    );
    const updateFieldStyle = (field: string, style: TextStyle) =>
      setFieldStyles((prev) => ({ ...prev, [field]: style }));

    const [fieldPositions, setFieldPositions] = useState<
      Record<string, { x: number; y: number }>
    >({});
    const updateFieldPosition = (id: string, pos: { x: number; y: number }) => {
      setFieldPositions((prev) => ({ ...prev, [id]: pos }));
    };

    const [lockedSections, setLockedSections] = useState<
      Record<string, boolean>
    >({
      headerBar: false,
      specsBar: false,
      description: false,
      specsCol1: false,
      specsCol2: false,
      contactCard: false,
      page2Header: false,
      page2FloorPlan: false,
      page2Footer: false,
    });
    const toggleSectionLock = (section: string) => {
      setLockedSections((prev) => ({ ...prev, [section]: !prev[section] }));
    };

    // ── 5. Image States ───────────────────────────────────────────────────────
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

    // ── 6. Modal & Slot States ────────────────────────────────────────────────
    const [currentImageSlot, setCurrentImageSlot] = useState<string | null>(
      null,
    );
    const [showGallery, setShowGallery] = useState(false);

    const [hoveredSlot, setHoveredSlot] = useState<string | null>(null);
    const [activeSlot, setActiveSlot] = useState<string | null>(null);

    const isSlotActive = (key: string) =>
      hoveredSlot === key ||
      activeSlot === key ||
      Boolean(dragging[key as keyof typeof dragging]);

    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (!target.closest('[data-image-slot="true"]')) {
          setActiveSlot(null);
        }
      };
      window.addEventListener("mousedown", handleClickOutside);
      return () => window.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // File inputs
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
        case "image1":
          return fileInputRef1;
        case "image2":
          return fileInputRef2;
        case "image3":
          return fileInputRef3;
        case "image4":
          return fileInputRef4;
        case "image5":
          return fileInputRef5;
        case "image6":
          return fileInputRef6;
        case "image7":
          return fileInputRef7;
        case "image8":
          return fileInputRef8;
        case "image9":
          return fileInputRef9;
        case "image10":
          return fileInputRef10;
        case "image11":
          return fileInputRef11;
        case "image12":
          return fileInputRef12;
        case "image13":
          return fileInputRef13;
        default:
          return fileInputRef1;
      }
    };

    // Auto populate agent logo if available
    useEffect(() => {
      if (orderData) {
        if (orderData.property) {
          if (orderData.property.listing_price)
            setAmount(orderData.property.listing_price.toString());
          if (orderData.property.bedrooms)
            setBedroom(orderData.property.bedrooms.toString());
          if (orderData.property.bathrooms)
            setBathroom(orderData.property.bathrooms.toString());
          if (orderData.property.square_footage)
            setSqft(orderData.property.square_footage.toString());
          if (orderData.property.year_constructed)
            setBuiltYear(orderData.property.year_constructed.toString());
          if (orderData.property.description)
            setDescription(orderData.property.description);
          if (orderData.property.mls_number)
            setMlsNumber(orderData.property.mls_number);
          if (orderData.property.suite) {
            setAddressCode(orderData.property.suite);
            setRoadName(orderData.property.suite);
          } else if (orderData.property.address) {
            setRoadName(orderData.property.address);
          }

          let cityString = "";
          if (orderData.property.city) cityString += orderData.property.city;
          if (orderData.property.province)
            cityString +=
              (cityString ? ", " : "") + orderData.property.province;
          if (orderData.property.postal_code)
            cityString +=
              (cityString ? " " : "") + orderData.property.postal_code;
          if (cityString) setCityLine(cityString);
        }
        if (orderData.agent) {
          const agent = orderData.agent;
          if (agent.first_name || agent.last_name)
            setFullName(
              `${agent.first_name || ""} ${agent.last_name || ""}`.trim(),
            );
          if (agent.email) setEmail(agent.email);
          if (agent.primary_phone) setNumber(agent.primary_phone);
          if (agent.company_name) setPropertyName(agent.company_name);

          const agentLogo =
            (agent as any)?.company_logo_url ||
            (agent as any)?.logo_url ||
            (agent as any)?.logo ||
            agent.avatar_url ||
            null;
          if (agentLogo) {
            setImages((prev) => ({
              ...prev,
              image7: prev.image7 || agentLogo,
            }));
          }
        }
      }
    }, [orderData]);

    // Image Handlers
    const handleImageChange = (
      key: keyof typeof images,
      e: React.ChangeEvent<HTMLInputElement>,
    ) => {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const url = URL.createObjectURL(file);
        setImages((prev) => ({ ...prev, [key]: url }));
      }
    };

    const handleDelete = (
      key: keyof typeof images,
      inputRef: React.RefObject<HTMLInputElement | null>,
    ) => {
      setImages((prev) => ({ ...prev, [key]: null }));
      setScale((prev) => ({ ...prev, [key]: 1 }));
      setPosition((prev) => ({ ...prev, [key]: { x: 0, y: 0 } }));
      setRotation((prev) => ({ ...prev, [key]: 0 }));
      if (inputRef.current) inputRef.current.value = "";
    };

    const handleZoom = (key: keyof typeof images, direction: "in" | "out") => {
      setScale((prev) => {
        const newScale = direction === "in" ? prev[key] + 0.1 : prev[key] - 0.1;
        const bounded = Math.min(Math.max(newScale, 0.1), 5);
        return { ...prev, [key]: bounded };
      });
    };

    const handleRotate = (key: keyof typeof images) => {
      setRotation((prev) => ({
        ...prev,
        [key]: (prev[key] + 90) % 360,
      }));
    };

    const handleMouseDown = (key: keyof typeof images, e: React.MouseEvent) => {
      if (e.altKey) return;
      setActiveSlot(key);
      setDragging((prev) => ({ ...prev, [key]: true }));
      lastPosition.current[key] = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (key: keyof typeof images, e: React.MouseEvent) => {
      if (!dragging[key]) return;
      const dx = (e.clientX - lastPosition.current[key].x) / 0.85;
      const dy = (e.clientY - lastPosition.current[key].y) / 0.85;
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

    const openImageSourceModal = (imageSlot: string, e?: React.MouseEvent) => {
      if (e?.altKey) return;
      setCurrentImageSlot(imageSlot);
      setShowGallery(true);
    };

    const handleGalleryImageSelect = (imageUrl: string) => {
      if (!currentImageSlot) return;
      setImages((prev) => ({ ...prev, [currentImageSlot]: imageUrl }));
      setShowGallery(false);
      setCurrentImageSlot(null);
    };

    // Helper renderer for image slot containers
    const renderImageSlot = (
      key: keyof typeof images,
      containerClassName: string,
      placeholderText = "Select Image",
      isLogoSlot = false,
    ) => {
      const inputRef = getFileInputRef(key);
      const hasImage = !!images[key];

      return (
        <div
          data-image-slot="true"
          {...(isLogoSlot
            ? {
                id: `agentLogo_${key}`,
                "data-slot-type": "logo",
                "data-logo-slot": "true",
              }
            : {})}
          className={`relative overflow-hidden group cursor-pointer ${containerClassName} ${
            isLogoSlot && !hasImage
              ? "bg-white border border-gray-200"
              : hasImage
                ? "bg-transparent"
                : ""
          }`}
          onMouseEnter={() => setHoveredSlot(key)}
          onMouseLeave={() => setHoveredSlot(null)}
          onClick={(e) => {
            if (e.altKey) return;
            e.stopPropagation();
            setActiveSlot(key);
          }}
        >
          <BoxIndicator isVisible={isSlotActive(key)} />

          <div
            className="w-full h-full relative overflow-hidden flex items-center justify-center"
            onMouseMove={(e) => handleMouseMove(key, e)}
            onMouseUp={() => handleMouseUp(key)}
            onMouseLeave={() => handleMouseLeave(key)}
          >
            {hasImage ? (
              images[key] === "processing" ||
              images[key]?.includes("processing") ? (
                <div
                  data-html2canvas-ignore="true"
                  className="w-full h-full bg-slate-900/90 text-white flex flex-col items-center justify-center p-2 text-center pointer-events-none z-10"
                >
                  <Loader2 className="w-5 h-5 animate-spin text-[#00B9F2] mb-1" />
                  <span className="text-xs font-semibold text-gray-200">
                    Processing...
                  </span>
                  <span className="text-[9px] text-gray-400 mt-0.5">
                    Auto-refreshing every 30s
                  </span>
                </div>
              ) : (
                <>
                  <div
                    className="w-full h-full cursor-grab active:cursor-grabbing"
                    onMouseDown={(e) => handleMouseDown(key, e)}
                  >
                    <ImageEditor
                      src={images[key]!}
                      scale={scale[key]}
                      position={position[key]}
                      rotation={rotation[key]}
                      objectFit={
                        isLogoSlot || key === "image6" ? "contain" : "cover"
                      }
                    />
                  </div>

                  {/* Zoom Controls */}
                  <div className="absolute bottom-1 left-1 flex gap-1.5 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto z-20">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleZoom(key, "in");
                      }}
                      className="bg-white p-1.5 rounded-full shadow hover:bg-gray-100"
                      title="Zoom In"
                    >
                      <ZoomIn className="w-3.5 h-3.5 text-gray-700" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleZoom(key, "out");
                      }}
                      className="bg-white p-1.5 rounded-full shadow hover:bg-gray-100"
                      title="Zoom Out"
                    >
                      <ZoomOut className="w-3.5 h-3.5 text-gray-700" />
                    </button>
                  </div>

                  {/* Rotate */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRotate(key);
                    }}
                    className="absolute top-2 right-[70px] z-20 bg-white p-1.5 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                    title="Rotate image"
                  >
                    <RotateCw className="w-3.5 h-3.5 text-gray-700" />
                  </button>

                  {/* Edit */}
                  <button
                    type="button"
                    onClick={(e) => openImageSourceModal(key, e)}
                    className="absolute top-2 right-9 z-20 bg-white p-1.5 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                    title="Edit image"
                  >
                    <Pencil className="w-3.5 h-3.5 text-gray-700" />
                  </button>

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(key, inputRef);
                    }}
                    className="absolute top-2 right-2 z-20 bg-white p-1.5 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                    title="Delete image"
                  >
                    <Trash className="w-3.5 h-3.5 text-red-500" />
                  </button>
                </>
              )
            ) : (
              <div
                data-html2canvas-ignore="true"
                onClick={(e) => openImageSourceModal(key, e)}
                className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400 font-medium text-xs hover:bg-gray-300 transition-colors p-2 text-center"
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
        </div>
      );
    };

    // ── 7. FormData Sync ─────────────────────────────────────────────────────
    useEffect(() => {
      updateFormData({
        deletedStandardFieldIds,
        deletedDetailFields,
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
        patioSqft,
        ceilingHeight,
        mlsNumber,
        contactLabel,
        phoneLabel,
        emailLabel,
        bedroomLabel,
        bathroomLabel,
        sqftLabel,
        builtYearLabel,
        numberLabel,
        roadLabel,
        byLawLabel,
        maintFeesLabel,
        maintFeesIncludeLabel,
        featuresIncludedLabel,
        siteInfluencesLabel,
        amenitiesLabel,
        viewLabel,
        mlsLabel,
        disclaimerText,
        floorPlanDisclaimerText,
        footerCredit,
        images,
        imageScales: scale,
        imagePositions: position,
        imageRotations: rotation,
        fieldPositions,
        fieldStyles,
      } as any);
    }, [
      deletedStandardFieldIds,
      deletedDetailFields,
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
      patioSqft,
      ceilingHeight,
      mlsNumber,
      contactLabel,
      phoneLabel,
      emailLabel,
      bedroomLabel,
      bathroomLabel,
      sqftLabel,
      builtYearLabel,
      numberLabel,
      roadLabel,
      byLawLabel,
      maintFeesLabel,
      maintFeesIncludeLabel,
      featuresIncludedLabel,
      siteInfluencesLabel,
      amenitiesLabel,
      viewLabel,
      mlsLabel,
      disclaimerText,
      floorPlanDisclaimerText,
      footerCredit,
      images,
      scale,
      position,
      rotation,
      fieldPositions,
      fieldStyles,
      updateFormData,
    ]);

    // ── 30s Background Media Polling Effect ─────────────────────────────
    useEffect(() => {
      if (!orderData?.uuid) return;

      const intervalId = setInterval(async () => {
        try {
          const sheets = await featureSheetService.getFeatureSheetsByOrder(
            orderData.uuid,
          );
          if (sheets && sheets.length > 0) {
            const currentSheet = sheets[0];
            if (currentSheet) {
              const state =
                featureSheetService.parsePayloadToState(currentSheet);
              if (state.images) {
                setImages((prev) => ({ ...prev, ...state.images }));
              }
            }
          }
        } catch (err) {
          console.error(
            "Silent background polling error for feature sheet media:",
            err,
          );
        }
      }, 30000);

      return () => clearInterval(intervalId);
    }, [orderData?.uuid]);

    // ── 8. Imperative Handle for Payload Export/Import ────────────────────────
    useImperativeHandle(ref, () => ({
      exportToPayload: async (): Promise<FeatureSheetPayload> => {
        const payload = await featureSheetService.buildPayload({
          orderUuid: orderData?.uuid || "",
          templateKey: "BCFPStandard18",
          uploadedBy: "admin",
          type: "template",
          primaryColor: "#404040",
          offeredAtPrice: {
            value: amount,
            style: {
              ...fieldStyles.amount,
              fontSize: fieldStyles.amount?.fontSize || "14.5px",
            },
          },
          realtorName: {
            value: fullName,
            style: {
              ...fieldStyles.fullName,
              fontSize: fieldStyles.fullName?.fontSize || "13px",
            },
          },
          emailLink: {
            value: email,
            style: {
              ...fieldStyles.email,
              fontSize: fieldStyles.email?.fontSize || "10px",
            },
          },
          companyName: {
            value: propertyName,
            style: {
              ...fieldStyles.propertyName,
              fontSize: fieldStyles.propertyName?.fontSize || "11px",
            },
          },
          propertyNotesTitle: {
            value: roadName,
            style: {
              ...fieldStyles.roadName,
              fontSize: fieldStyles.roadName?.fontSize || "17px",
            },
          },
          propertyNotesDescription: {
            value: description,
            style: {
              ...fieldStyles.description,
              fontSize: fieldStyles.description?.fontSize || "11.5px",
            },
          },
          expandedDetail1Title: {
            value: "By-law Restrictions",
            style: fieldStyles.byLawLabel,
          },
          expandedDetail1Description: {
            value: byLawRestrictions,
            style: {
              ...fieldStyles.byLawRestrictions,
              fontSize: fieldStyles.byLawRestrictions?.fontSize || "11.5px",
            },
          },
          expandedDetail2Title: {
            value: "Maint. Fees",
            style: fieldStyles.maintFeesLabel,
          },
          expandedDetail2Description: {
            value: maintenanceFees,
            style: {
              ...fieldStyles.maintenanceFees,
              fontSize: fieldStyles.maintenanceFees?.fontSize || "11.5px",
            },
          },
          expandedDetail3Title: {
            value: "Maint. Fees Include",
            style: fieldStyles.maintFeesIncludeLabel,
          },
          expandedDetail3Description: {
            value: maintenanceFeesInclude,
            style: {
              ...fieldStyles.maintenanceFeesInclude,
              fontSize:
                fieldStyles.maintenanceFeesInclude?.fontSize || "11.5px",
            },
          },
          expandedDetail4Title: {
            value: "Features Included",
            style: fieldStyles.featuresIncludedLabel,
          },
          expandedDetail4Description: {
            value: featuresIncluded,
            style: {
              ...fieldStyles.featuresIncluded,
              fontSize: fieldStyles.featuresIncluded?.fontSize || "11.5px",
            },
          },
          keyHighlightLabel: {
            value: "Site Influences",
            style: fieldStyles.siteInfluencesLabel,
          },
          keyHighlights: siteInfluences
            ? siteInfluences.split("\n").filter(Boolean)
            : [],
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
            roadName,
            cityLine,
            mlsNumber,
            patioSqft,
            ceilingHeight,
            contactLabel,
            phoneLabel,
            emailLabel,
            bedroomLabel,
            bathroomLabel,
            sqftLabel,
            builtYearLabel,
            numberLabel,
            roadLabel,
            byLawLabel,
            maintFeesLabel,
            maintFeesIncludeLabel,
            featuresIncludedLabel,
            siteInfluencesLabel,
            amenitiesLabel,
            viewLabel,
            mlsLabel,

            disclaimerText,
            floorPlanDisclaimerText,
            footerCredit,
          },
          images,
          imageScales: scale,
          imagePositions: position,
          imageRotations: rotation,
          fieldPositions,
          fieldStyles,
        });
        return payload;
      },
      importFromPayload: (payload: FeatureSheetResponse) => {
        if (!payload) return;
        const c = payload.content;
        const styles: Record<string, TextStyle> = {};
        const st = (field: any) => field?.style;

        const getValString = (val: any): string => {
          if (!val) return "";
          if (typeof val === "string") return val;
          if (Array.isArray(val)) return val.join("\n");
          return String(val);
        };

        if (c) {
          if (c.offeredAtPrice?.value !== undefined)
            setAmount(getValString(c.offeredAtPrice.value));
          if (st(c.offeredAtPrice)) styles.amount = st(c.offeredAtPrice);

          if (c.realtorName?.value !== undefined)
            setFullName(getValString(c.realtorName.value));
          if (st(c.realtorName)) styles.fullName = st(c.realtorName);

          if (c.companyName?.value !== undefined)
            setPropertyName(getValString(c.companyName.value));
          if (st(c.companyName)) styles.propertyName = st(c.companyName);

          if (c.emailLink?.value !== undefined)
            setEmail(getValString(c.emailLink.value));
          if (st(c.emailLink)) styles.email = st(c.emailLink);

          if (c.propertyNotesTitle?.value !== undefined)
            setRoadName(getValString(c.propertyNotesTitle.value));
          if (st(c.propertyNotesTitle))
            styles.roadName = st(c.propertyNotesTitle);

          if (c.propertyNotesDescription?.value !== undefined)
            setDescription(getValString(c.propertyNotesDescription.value));
          if (st(c.propertyNotesDescription))
            styles.description = st(c.propertyNotesDescription);

          if (c.expandedDetail1Description?.value !== undefined)
            setByLawRestrictions(
              getValString(c.expandedDetail1Description.value),
            );
          if (st(c.expandedDetail1Description))
            styles.byLawRestrictions = st(c.expandedDetail1Description);

          if (c.expandedDetail2Description?.value !== undefined)
            setMaintenanceFees(
              getValString(c.expandedDetail2Description.value),
            );
          if (st(c.expandedDetail2Description))
            styles.maintenanceFees = st(c.expandedDetail2Description);

          if (c.expandedDetail3Description?.value !== undefined)
            setMaintenanceFeesInclude(
              getValString(c.expandedDetail3Description.value),
            );
          if (st(c.expandedDetail3Description))
            styles.maintenanceFeesInclude = st(c.expandedDetail3Description);

          if (c.expandedDetail4Description?.value !== undefined)
            setFeaturesIncluded(
              getValString(c.expandedDetail4Description.value),
            );
          if (st(c.expandedDetail4Description))
            styles.featuresIncluded = st(c.expandedDetail4Description);

          if (c.keyHighlights) {
            const kh: any = c.keyHighlights;
            if (Array.isArray(kh)) {
              setSiteInfluences(kh.join("\n"));
            } else if (Array.isArray(kh.value)) {
              setSiteInfluences(kh.value.join("\n"));
            }
          }

          if (c.otherDetails) {
            const details = c.otherDetails as Record<string, any>;
            if (details.maintenanceFees !== undefined)
              setMaintenanceFees(details.maintenanceFees);
            if (details.maintenanceFeesInclude !== undefined)
              setMaintenanceFeesInclude(details.maintenanceFeesInclude);
            if (details.amenities !== undefined)
              setAmenities(details.amenities);
            if (details.view !== undefined) setView(details.view);
            if (details.bedroom !== undefined) setBedroom(details.bedroom);
            if (details.bathroom !== undefined) setBathroom(details.bathroom);
            if (details.sqft !== undefined) setSqft(details.sqft);
            if (details.builtYear !== undefined)
              setBuiltYear(details.builtYear);
            if (details.number !== undefined) setNumber(details.number);
            if (details.addressCode !== undefined)
              setAddressCode(details.addressCode);
            if (details.roadName !== undefined) setRoadName(details.roadName);
            if (details.cityLine !== undefined) setCityLine(details.cityLine);
            if (details.mlsNumber !== undefined)
              setMlsNumber(details.mlsNumber);
            if (details.patioSqft !== undefined)
              setPatioSqft(details.patioSqft);
            if (details.ceilingHeight !== undefined)
              setCeilingHeight(details.ceilingHeight);

            if (details.contactLabel !== undefined)
              setContactLabel(details.contactLabel);
            if (details.phoneLabel !== undefined)
              setPhoneLabel(details.phoneLabel);
            if (details.emailLabel !== undefined)
              setEmailLabel(details.emailLabel);
            if (details.bedroomLabel !== undefined)
              setBedroomLabel(details.bedroomLabel);
            if (details.bathroomLabel !== undefined)
              setBathroomLabel(details.bathroomLabel);
            if (details.sqftLabel !== undefined)
              setSqftLabel(details.sqftLabel);
            if (details.builtYearLabel !== undefined)
              setBuiltYearLabel(details.builtYearLabel);
            if (details.numberLabel !== undefined)
              setNumberLabel(details.numberLabel);
            if (details.roadLabel !== undefined)
              setRoadLabel(details.roadLabel);
            if (details.byLawLabel !== undefined)
              setByLawLabel(details.byLawLabel);
            if (details.maintFeesLabel !== undefined)
              setMaintFeesLabel(details.maintFeesLabel);
            if (details.maintFeesIncludeLabel !== undefined)
              setMaintFeesIncludeLabel(details.maintFeesIncludeLabel);
            if (details.featuresIncludedLabel !== undefined)
              setFeaturesIncludedLabel(details.featuresIncludedLabel);
            if (details.siteInfluencesLabel !== undefined)
              setSiteInfluencesLabel(details.siteInfluencesLabel);
            if (details.amenitiesLabel !== undefined)
              setAmenitiesLabel(details.amenitiesLabel);
            if (details.viewLabel !== undefined)
              setViewLabel(details.viewLabel);
            if (details.mlsLabel !== undefined) setMlsLabel(details.mlsLabel);
            if (details.disclaimerText !== undefined)
              setDisclaimerText(details.disclaimerText);
            if (details.floorPlanDisclaimerText !== undefined)
              setFloorPlanDisclaimerText(details.floorPlanDisclaimerText);
            if (details.footerCredit !== undefined)
              setFooterCredit(details.footerCredit);
          }
        }

        // Parse DB & gallery images using parsePayloadToState
        const state = featureSheetService.parsePayloadToState(payload);
        if (state.images) {
          setImages((prev) => ({ ...prev, ...state.images }));
        }
        if (state.imageScales) {
          setScale((prev) => ({ ...prev, ...state.imageScales }));
        }
        if (state.imagePositions) {
          setPosition((prev) => ({ ...prev, ...state.imagePositions }));
        }
        if (state.imageRotations) {
          setRotation((prev) => ({ ...prev, ...state.imageRotations }));
        }
        if ((state as any).fieldPositions) {
          setFieldPositions((state as any).fieldPositions);
        }
        if (Object.keys(styles).length > 0) {
          setFieldStyles((prev) => ({ ...prev, ...styles }));
        }
      },
    }));

    const bleedHorizontalStyle = {
      marginLeft: showBleed ? "-0.375in" : "-0.25in",
      marginRight: showBleed ? "-0.375in" : "-0.25in",
      width: showBleed ? "calc(100% + 0.75in)" : "calc(100% + 0.5in)",
    };

    const topBleedStyle = {
      marginLeft: showBleed ? "-0.375in" : "-0.25in",
      marginRight: showBleed ? "-0.375in" : "-0.25in",
      marginTop: showBleed ? "-0.375in" : "-0.25in",
      paddingTop: showBleed ? "0.375in" : "0.25in",
      width: showBleed ? "calc(100% + 0.75in)" : "calc(100% + 0.5in)",
      height: showBleed ? "calc(180px + 0.375in)" : "calc(180px + 0.25in)",
    };

    const bottomBleedStyle = {
      marginLeft: showBleed ? "-0.375in" : "-0.25in",
      marginRight: showBleed ? "-0.375in" : "-0.25in",
      marginBottom: showBleed ? "-0.375in" : "-0.25in",
      width: showBleed ? "calc(100% + 0.75in)" : "calc(100% + 0.5in)",
    };

    return (
      <div className="flex flex-col items-center justify-center font-sans">
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
          <span className="text-gray-400 font-medium tracking-widest text-sm px-4">
            PAGE 1
          </span>
          <div className="h-[1px] bg-gray-300 flex-1"></div>
        </div>

        {/* --- PAGE 1 WRAPPER --- */}
        <div
          className="pdf-page bg-[#3E3E3E] shadow-xl relative overflow-hidden flex flex-col justify-between"
          style={{
            width: showBleed ? "8.75in" : "8.5in",
            height: showBleed ? "11.25in" : "11.0in",
            zoom: 0.85,
          }}
        >
          <SafeZoneWrapper showBleed={showBleed} showGuide={showGuide}>
            <div
              data-safezone-container="true"
              className="relative w-full h-full flex flex-col justify-between z-10 select-none"
            >
              {/* Top 4-Photo Row with Top Dark Charcoal Band (Expanded to Bleed Edge) */}
              <div
                className="w-full grid grid-cols-4 bg-[#3E3E3E] shrink-0 relative z-10"
                style={topBleedStyle}
              >
                {renderImageSlot(
                  "image1",
                  "w-full h-full border-r border-[#3E3E3E]",
                  "Photo 1",
                )}
                {renderImageSlot(
                  "image2",
                  "w-full h-full border-r border-[#3E3E3E]",
                  "Photo 2",
                )}
                {renderImageSlot(
                  "image3",
                  "w-full h-full border-r border-[#3E3E3E]",
                  "Photo 3",
                )}
                {renderImageSlot("image4", "w-full h-full", "Photo 4")}
              </div>

              {/* Main Hero Photo Container with Overlay Title Header & Specs Summary Bars (Expanded to Bleed Edge) */}
              <div
                className="h-[460px] relative bg-[#3E3E3E] shrink-0 z-10"
                style={bleedHorizontalStyle}
              >
                {/* Main Hero Photo (Image 5) */}
                {renderImageSlot(
                  "image5",
                  "w-full h-full",
                  "Select Main Hero Photo (Image 5)",
                )}

                {/* Address & Logo Header Bar (Overlay on Top Edge of Main Image) */}
                <div
                  data-drag-container="true"
                  className={`absolute top-0 left-0 right-0 h-[42px] px-[36px] flex items-center justify-between z-20 shrink-0 border-b border-gray-300/60 font-serif transition-all duration-150 group/sec border border-transparent bg-[#DDD8D3]/85 backdrop-blur-sm ${
                    lockedSections.headerBar
                      ? "hover:border-amber-400 hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(245,158,11,0.4)]"
                      : "hover:border-[#8B3DFF] hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(139,61,255,0.4)]"
                  }`}
                >
                  <button
                    type="button"
                    data-html2canvas-ignore="true"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSectionLock("headerBar");
                    }}
                    className={`absolute top-1 right-1 z-40 p-1 rounded-md transition-all duration-150
                      shadow-sm flex items-center gap-1 text-[8px] font-medium cursor-pointer
                      opacity-0 group-hover/sec:opacity-100 ${
                        lockedSections.headerBar
                          ? "bg-amber-500 text-white shadow-amber-500/30 hover:bg-amber-600"
                          : "bg-white/90 text-gray-700 hover:bg-white border border-gray-200"
                      }`}
                    title={
                      lockedSections.headerBar
                        ? "Unlock Header Bar Section"
                        : "Lock Header Bar Section"
                    }
                  >
                    {lockedSections.headerBar ? (
                      <>
                        <Lock className="w-3 h-3" />
                        <span>Locked</span>
                      </>
                    ) : (
                      <>
                        <Unlock className="w-3 h-3" />
                        <span>Lock</span>
                      </>
                    )}
                  </button>

                  {/* Left Address Line with # 0000-0000 Number 0 Road */}
                  <div className="flex items-center gap-1 text-[17px] text-[#4A4A4A] font-serif tracking-wide z-20">
                    <span className="text-[#4A4A4A] font-serif leading-none">
                      #
                    </span>
                    {!isFieldDeleted("addressCode") && (
                      <DraggableBox
                        id="addressCode"
                        position={fieldPositions.addressCode}
                        onPositionChange={updateFieldPosition}
                        label="Suite / Unit"
                        zoom={0.85}
                        disabled={lockedSections.headerBar}
                        onDelete={() =>
                          removeStandardField(
                            "addressCode",
                            "Suite / Unit",
                            addressCode,
                            "Header Bar",
                            fieldStyles.addressCode,
                          )
                        }
                        deleteTitle="Remove Suite / Unit"
                      >
                        <StyledInput
                          value={addressCode}
                          onChange={(e) => setAddressCode(e.target.value)}
                          inputStyle={fieldStyles["addressCode"]}
                          onChangeStyle={(s) =>
                            updateFieldStyle("addressCode", s)
                          }
                          className="font-serif text-[17px] text-[#4A4A4A] bg-transparent focus:outline-none border-none placeholder-gray-600 leading-none whitespace-nowrap"
                          placeholder="0"
                          wrapperClassName="w-auto shrink-0"
                        />
                      </DraggableBox>
                    )}

                    <StyledInput
                      value={numberLabel}
                      onChange={(e) => setNumberLabel(e.target.value)}
                      inputStyle={fieldStyles["numberLabel"]}
                      onChangeStyle={(s) => updateFieldStyle("numberLabel", s)}
                      className="font-serif text-[17px] text-[#4A4A4A] leading-none bg-transparent border-none focus:outline-none whitespace-nowrap"
                      placeholder="Number"
                      wrapperClassName="w-auto shrink-0"
                    />

                    {!isFieldDeleted("roadName") && (
                      <DraggableBox
                        id="roadName"
                        position={fieldPositions.roadName}
                        onPositionChange={updateFieldPosition}
                        label="Road Address"
                        zoom={0.85}
                        disabled={lockedSections.headerBar}
                        onDelete={() =>
                          removeStandardField(
                            "roadName",
                            "Road Address",
                            roadName,
                            "Header Bar",
                            fieldStyles.roadName,
                          )
                        }
                        deleteTitle="Remove Road Address"
                      >
                        <StyledInput
                          value={roadName}
                          onChange={(e) => setRoadName(e.target.value)}
                          inputStyle={fieldStyles["roadName"]}
                          onChangeStyle={(s) => updateFieldStyle("roadName", s)}
                          className="font-serif text-[17px] text-[#4A4A4A] bg-transparent focus:outline-none border-none placeholder-gray-600 leading-none whitespace-nowrap"
                          placeholder="0"
                          wrapperClassName="w-auto shrink-0"
                        />
                      </DraggableBox>
                    )}

                    <StyledInput
                      value={roadLabel}
                      onChange={(e) => setRoadLabel(e.target.value)}
                      inputStyle={fieldStyles["roadLabel"]}
                      onChangeStyle={(s) => updateFieldStyle("roadLabel", s)}
                      className="font-serif text-[17px] text-[#4A4A4A] leading-none bg-transparent border-none focus:outline-none whitespace-nowrap"
                      placeholder="Road"
                      wrapperClassName="w-auto shrink-0"
                    />
                  </div>

                  {/* Center Macdonald Realty Logo Overlay Box (Height 90px) */}
                  <div className="absolute left-1/2 -translate-x-1/2 -top-[19px] z-30 shrink-0 overflow-hidden w-[185px] h-[90px] bg-white shadow-[0_4px_12px_rgba(0,0,0,0.25)] border border-gray-200 rounded-sm flex items-center justify-center">
                    {renderImageSlot(
                      "image7",
                      "w-full h-full",
                      "Logo Image",
                      true,
                    )}
                  </div>

                  {/* Right City Line Subtitle */}
                  <div className="flex justify-end z-20">
                    {!isFieldDeleted("cityLine") && (
                      <DraggableBox
                        id="cityLine"
                        position={fieldPositions.cityLine}
                        onPositionChange={updateFieldPosition}
                        label="City Subtitle"
                        zoom={0.85}
                        disabled={lockedSections.headerBar}
                        onDelete={() =>
                          removeStandardField(
                            "cityLine",
                            "City Subtitle",
                            cityLine,
                            "Header Bar",
                            fieldStyles.cityLine,
                          )
                        }
                        deleteTitle="Remove City Subtitle"
                      >
                        <StyledInput
                          value={cityLine}
                          onChange={(e) => setCityLine(e.target.value)}
                          inputStyle={fieldStyles["cityLine"]}
                          onChangeStyle={(s) => updateFieldStyle("cityLine", s)}
                          className="font-serif text-[17px] text-[#4A4A4A] text-right bg-transparent focus:outline-none border-none placeholder-gray-600 leading-none whitespace-nowrap"
                          placeholder="Brighouse South, Richmond"
                          wrapperClassName="w-auto shrink-0"
                        />
                      </DraggableBox>
                    )}
                  </div>
                </div>

                {/* Specs Summary Row (Overlay on Bottom Edge of Main Image) */}
                <div
                  data-drag-container="true"
                  className={`absolute bottom-0 left-0 right-0 py-2 px-[36px] text-nowrap flex items-center justify-between text-[14.5px] font-medium text-[#444444] tracking-wider uppercase z-20 border-t border-gray-300/60 transition-all duration-150 group/sec border border-transparent bg-[#DCD8D4]/85 backdrop-blur-sm ${
                    lockedSections.specsBar
                      ? "hover:border-amber-400 hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(245,158,11,0.4)]"
                      : "hover:border-[#8B3DFF] hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(139,61,255,0.4)]"
                  }`}
                >
                  <button
                    type="button"
                    data-html2canvas-ignore="true"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSectionLock("specsBar");
                    }}
                    className={`absolute top-0.5 right-1 z-40 p-1 rounded-md transition-all duration-150
                      shadow-sm flex items-center gap-1 text-[8px] font-medium cursor-pointer
                      opacity-0 group-hover/sec:opacity-100 ${
                        lockedSections.specsBar
                          ? "bg-amber-500 text-white shadow-amber-500/30 hover:bg-amber-600"
                          : "bg-white/90 text-gray-700 hover:bg-white border border-gray-200"
                      }`}
                    title={
                      lockedSections.specsBar
                        ? "Unlock Specs Bar Section"
                        : "Lock Specs Bar Section"
                    }
                  >
                    {lockedSections.specsBar ? (
                      <>
                        <Lock className="w-3 h-3" />
                        <span>Locked</span>
                      </>
                    ) : (
                      <>
                        <Unlock className="w-3 h-3" />
                        <span>Lock</span>
                      </>
                    )}
                  </button>

                  {!isFieldDeleted("specBedroom") && (
                    <DraggableBox
                      id="specBedroom"
                      position={fieldPositions.specBedroom}
                      onPositionChange={updateFieldPosition}
                      label="Bedrooms"
                      zoom={0.85}
                      disabled={lockedSections.specsBar}
                      onDelete={() =>
                        removeStandardField(
                          "specBedroom",
                          "Bedrooms",
                          bedroom,
                          "Specs Bar",
                          fieldStyles.bedroom,
                        )
                      }
                      deleteTitle="Remove Bedrooms"
                    >
                      <div className="flex items-center gap-1.5 whitespace-nowrap">
                        <StyledInput
                          value={bedroom}
                          onChange={(e) => setBedroom(e.target.value)}
                          inputStyle={fieldStyles["bedroom"]}
                          onChangeStyle={(s) => updateFieldStyle("bedroom", s)}
                          className="font-medium text-[14.5px] text-[#444444] text-right bg-transparent focus:outline-none border-none placeholder-gray-700 whitespace-nowrap"
                          placeholder="0"
                          wrapperClassName="w-auto shrink-0"
                        />
                        <StyledInput
                          value={bedroomLabel}
                          onChange={(e) => setBedroomLabel(e.target.value)}
                          inputStyle={fieldStyles["bedroomLabel"]}
                          onChangeStyle={(s) =>
                            updateFieldStyle("bedroomLabel", s)
                          }
                          className="font-medium text-[14.5px] text-[#444444] bg-transparent focus:outline-none border-none uppercase whitespace-nowrap"
                          placeholder="BEDROOM"
                          wrapperClassName="w-auto shrink-0"
                        />
                      </div>
                    </DraggableBox>
                  )}
                  <span className="text-gray-500 font-bold">•</span>

                  {!isFieldDeleted("specBathroom") && (
                    <DraggableBox
                      id="specBathroom"
                      position={fieldPositions.specBathroom}
                      onPositionChange={updateFieldPosition}
                      label="Bathrooms"
                      zoom={0.85}
                      disabled={lockedSections.specsBar}
                      onDelete={() =>
                        removeStandardField(
                          "specBathroom",
                          "Bathrooms",
                          bathroom,
                          "Specs Bar",
                          fieldStyles.bathroom,
                        )
                      }
                      deleteTitle="Remove Bathrooms"
                    >
                      <div className="flex items-center gap-1.5 whitespace-nowrap">
                        <StyledInput
                          value={bathroom}
                          onChange={(e) => setBathroom(e.target.value)}
                          inputStyle={fieldStyles["bathroom"]}
                          onChangeStyle={(s) => updateFieldStyle("bathroom", s)}
                          className="font-medium text-[14.5px] text-[#444444] text-right bg-transparent focus:outline-none border-none placeholder-gray-700 whitespace-nowrap"
                          placeholder="0"
                          wrapperClassName="w-auto shrink-0"
                        />
                        <StyledInput
                          value={bathroomLabel}
                          onChange={(e) => setBathroomLabel(e.target.value)}
                          inputStyle={fieldStyles["bathroomLabel"]}
                          onChangeStyle={(s) =>
                            updateFieldStyle("bathroomLabel", s)
                          }
                          className="font-medium text-[14.5px] text-[#444444] bg-transparent focus:outline-none border-none uppercase whitespace-nowrap"
                          placeholder="BATHROOM"
                          wrapperClassName="w-auto shrink-0"
                        />
                      </div>
                    </DraggableBox>
                  )}
                  <span className="text-gray-500 font-bold">•</span>

                  {!isFieldDeleted("specSqft") && (
                    <DraggableBox
                      id="specSqft"
                      position={fieldPositions.specSqft}
                      onPositionChange={updateFieldPosition}
                      label="Square Feet"
                      zoom={0.85}
                      disabled={lockedSections.specsBar}
                      onDelete={() =>
                        removeStandardField(
                          "specSqft",
                          "Square Feet",
                          sqft,
                          "Specs Bar",
                          fieldStyles.sqft,
                        )
                      }
                      deleteTitle="Remove Square Feet"
                    >
                      <div className="flex items-center gap-1.5 whitespace-nowrap">
                        <StyledInput
                          value={sqft}
                          onChange={(e) => setSqft(e.target.value)}
                          inputStyle={fieldStyles["sqft"]}
                          onChangeStyle={(s) => updateFieldStyle("sqft", s)}
                          className="font-medium text-[14.5px] text-[#444444] text-right bg-transparent focus:outline-none border-none placeholder-gray-700 whitespace-nowrap"
                          placeholder="000"
                          wrapperClassName="w-auto shrink-0"
                        />
                        <StyledInput
                          value={sqftLabel}
                          onChange={(e) => setSqftLabel(e.target.value)}
                          inputStyle={fieldStyles["sqftLabel"]}
                          onChangeStyle={(s) =>
                            updateFieldStyle("sqftLabel", s)
                          }
                          className="font-medium text-[14.5px] text-[#444444] bg-transparent focus:outline-none border-none uppercase whitespace-nowrap"
                          placeholder="SQ FT"
                          wrapperClassName="w-auto shrink-0"
                        />
                      </div>
                    </DraggableBox>
                  )}
                  <span className="text-gray-500 font-bold">•</span>

                  {!isFieldDeleted("specBuiltYear") && (
                    <DraggableBox
                      id="specBuiltYear"
                      position={fieldPositions.specBuiltYear}
                      onPositionChange={updateFieldPosition}
                      label="Built Year"
                      zoom={0.85}
                      disabled={lockedSections.specsBar}
                      onDelete={() =>
                        removeStandardField(
                          "specBuiltYear",
                          "Built Year",
                          builtYear,
                          "Specs Bar",
                          fieldStyles.builtYear,
                        )
                      }
                      deleteTitle="Remove Built Year"
                    >
                      <div className="flex items-center gap-1.5 whitespace-nowrap">
                        <StyledInput
                          value={builtYearLabel}
                          onChange={(e) => setBuiltYearLabel(e.target.value)}
                          inputStyle={fieldStyles["builtYearLabel"]}
                          onChangeStyle={(s) =>
                            updateFieldStyle("builtYearLabel", s)
                          }
                          className="font-medium text-[14.5px] text-[#444444] bg-transparent focus:outline-none border-none uppercase whitespace-nowrap"
                          placeholder="BUILT IN"
                          wrapperClassName="w-auto shrink-0"
                        />
                        <StyledInput
                          value={builtYear}
                          onChange={(e) => setBuiltYear(e.target.value)}
                          inputStyle={fieldStyles["builtYear"]}
                          onChangeStyle={(s) =>
                            updateFieldStyle("builtYear", s)
                          }
                          className="font-medium text-[14.5px] text-[#444444] text-left bg-transparent focus:outline-none border-none placeholder-gray-700 whitespace-nowrap"
                          placeholder="0000"
                          wrapperClassName="w-auto shrink-0"
                        />
                      </div>
                    </DraggableBox>
                  )}
                  <span className="text-gray-500 font-bold">•</span>

                  {!isFieldDeleted("priceAmount") && (
                    <DraggableBox
                      id="priceAmount"
                      position={fieldPositions.priceAmount}
                      onPositionChange={updateFieldPosition}
                      label="Price"
                      zoom={0.85}
                      disabled={lockedSections.specsBar}
                      onDelete={() =>
                        removeStandardField(
                          "priceAmount",
                          "Price",
                          amount,
                          "Specs Bar",
                          fieldStyles.amount,
                        )
                      }
                      deleteTitle="Remove Price"
                    >
                      <StyledInput
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        inputStyle={fieldStyles["amount"]}
                        onChangeStyle={(s) => updateFieldStyle("amount", s)}
                        className="font-medium text-[14.5px] text-[#444444] text-left bg-transparent focus:outline-none border-none placeholder-gray-700 whitespace-nowrap"
                        placeholder="$000,000"
                        wrapperClassName="w-auto shrink-0"
                      />
                    </DraggableBox>
                  )}
                </div>
              </div>

              {/* Lower Content Details Section (Dark Charcoal Background - Expanded to Bleed Edge) */}
              <div
                className="flex-1 bg-[#3E3E3E] text-white px-8 pt-4 pb-[125px] flex flex-col justify-start relative z-10"
                style={bottomBleedStyle}
              >
                <div className="grid grid-cols-12 gap-6 w-full h-full relative">
                  {/* Description Column (Left - 50% HALF OF SHEET SPACE) */}
                  <div
                    data-drag-container="true"
                    className={`col-span-6 pr-2 relative transition-all duration-150 group/sec border border-transparent ${
                      lockedSections.description
                        ? "hover:border-amber-400 hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(245,158,11,0.4)]"
                        : "hover:border-[#8B3DFF] hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(139,61,255,0.4)]"
                    }`}
                  >
                    <button
                      type="button"
                      data-html2canvas-ignore="true"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSectionLock("description");
                      }}
                      className={`absolute top-1 right-1 z-40 p-1 rounded-md transition-all duration-150
                        shadow-sm flex items-center gap-1 text-[8px] font-medium cursor-pointer
                        opacity-0 group-hover/sec:opacity-100 ${
                          lockedSections.description
                            ? "bg-amber-500 text-white shadow-amber-500/30 hover:bg-amber-600"
                            : "bg-white/90 text-gray-700 hover:bg-white border border-gray-200"
                        }`}
                      title={
                        lockedSections.description
                          ? "Unlock Description Section"
                          : "Lock Description Section"
                      }
                    >
                      {lockedSections.description ? (
                        <>
                          <Lock className="w-3 h-3" />
                          <span>Locked</span>
                        </>
                      ) : (
                        <>
                          <Unlock className="w-3 h-3" />
                          <span>Lock</span>
                        </>
                      )}
                    </button>

                    {!isFieldDeleted("propertyDescription") && (
                      <DraggableBox
                        id="propertyDescription"
                        position={fieldPositions.propertyDescription}
                        onPositionChange={updateFieldPosition}
                        label="Property Description"
                        zoom={0.85}
                        disabled={lockedSections.description}
                        onDelete={() =>
                          removeStandardField(
                            "propertyDescription",
                            "Property Description",
                            description,
                            "Description",
                            fieldStyles.description,
                          )
                        }
                        deleteTitle="Remove Description"
                      >
                        <StyledInput
                          value={description}
                          rows={10}
                          onChange={(e) => setDescription(e.target.value)}
                          inputStyle={fieldStyles["description"]}
                          onChangeStyle={(s) =>
                            updateFieldStyle("description", s)
                          }
                          className="text-[12px] text-left text-white/95 leading-snug italic bg-transparent w-full focus:outline-none border-none placeholder-white/80"
                          placeholder="On top of it all! Beautiful sub-penthouse in the well appointed CENTRO building."
                        />
                      </DraggableBox>
                    )}
                  </div>

                  {/* Specs Column 1 (Middle ~25%) */}
                  <div
                    data-drag-container="true"
                    className={`col-span-3 flex flex-col items-start text-left gap-1 text-[12px] relative transition-all duration-150 group/sec border border-transparent ${
                      lockedSections.specsCol1
                        ? "hover:border-amber-400 hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(245,158,11,0.4)]"
                        : "hover:border-[#8B3DFF] hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(139,61,255,0.4)]"
                    }`}
                  >
                    <button
                      type="button"
                      data-html2canvas-ignore="true"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSectionLock("specsCol1");
                      }}
                      className={`absolute top-1 right-1 z-40 p-1 rounded-md transition-all duration-150
                        shadow-sm flex items-center gap-1 text-[8px] font-medium cursor-pointer
                        opacity-0 group-hover/sec:opacity-100 ${
                          lockedSections.specsCol1
                            ? "bg-amber-500 text-white shadow-amber-500/30 hover:bg-amber-600"
                            : "bg-white/90 text-gray-700 hover:bg-white border border-gray-200"
                        }`}
                      title={
                        lockedSections.specsCol1
                          ? "Unlock Specs Column 1 Section"
                          : "Lock Specs Column 1 Section"
                      }
                    >
                      {lockedSections.specsCol1 ? (
                        <>
                          <Lock className="w-3 h-3" />
                          <span>Locked</span>
                        </>
                      ) : (
                        <>
                          <Unlock className="w-3 h-3" />
                          <span>Lock</span>
                        </>
                      )}
                    </button>

                    {!isFieldDeleted("byLawRestrictions") && (
                      <DraggableBox
                        id="byLawRestrictions"
                        position={fieldPositions.byLawRestrictions}
                        onPositionChange={updateFieldPosition}
                        label="By-law Restrictions"
                        zoom={0.85}
                        disabled={lockedSections.specsCol1}
                        onDelete={() =>
                          removeStandardField(
                            "byLawRestrictions",
                            "By-law Restrictions",
                            byLawRestrictions,
                            "Specs Column 1",
                            fieldStyles.byLawRestrictions,
                          )
                        }
                        deleteTitle="Remove By-law Restrictions"
                      >
                        <div className="text-left">
                          <StyledInput
                            value={byLawLabel}
                            onChange={(e) => setByLawLabel(e.target.value)}
                            inputStyle={fieldStyles["byLawLabel"]}
                            onChangeStyle={(s) =>
                              updateFieldStyle("byLawLabel", s)
                            }
                            className="font-semibold text-[12px] uppercase text-left block text-white bg-transparent border-none focus:outline-none whitespace-nowrap"
                            placeholder="BY-LAW RESTRICTIONS:"
                          />
                          <StyledInput
                            value={byLawRestrictions}
                            onChange={(e) =>
                              setByLawRestrictions(e.target.value)
                            }
                            inputStyle={fieldStyles["byLawRestrictions"]}
                            onChangeStyle={(s) =>
                              updateFieldStyle("byLawRestrictions", s)
                            }
                            className="text-[12px] text-left text-white/90 bg-transparent w-full focus:outline-none border-none placeholder-white/70"
                            placeholder="Pets Allowed w/Rest., Rentals Allowed"
                          />
                        </div>
                      </DraggableBox>
                    )}

                    {!isFieldDeleted("maintenanceFees") && (
                      <DraggableBox
                        id="maintenanceFees"
                        position={fieldPositions.maintenanceFees}
                        onPositionChange={updateFieldPosition}
                        label="Maintenance Fees"
                        zoom={0.85}
                        disabled={lockedSections.specsCol1}
                        onDelete={() =>
                          removeStandardField(
                            "maintenanceFees",
                            "Maintenance Fees",
                            maintenanceFees,
                            "Specs Column 1",
                            fieldStyles.maintenanceFees,
                          )
                        }
                        deleteTitle="Remove Maintenance Fees"
                      >
                        <div className="text-left">
                          <StyledInput
                            value={maintFeesLabel}
                            onChange={(e) => setMaintFeesLabel(e.target.value)}
                            inputStyle={fieldStyles["maintFeesLabel"]}
                            onChangeStyle={(s) =>
                              updateFieldStyle("maintFeesLabel", s)
                            }
                            className="font-semibold text-[12px] uppercase text-left block text-white bg-transparent border-none focus:outline-none whitespace-nowrap"
                            placeholder="MAINT. FEES:"
                          />
                          <StyledInput
                            value={maintenanceFees}
                            onChange={(e) => setMaintenanceFees(e.target.value)}
                            inputStyle={fieldStyles["maintenanceFees"]}
                            onChangeStyle={(s) =>
                              updateFieldStyle("maintenanceFees", s)
                            }
                            className="text-[12px] text-left text-white/90 bg-transparent w-full focus:outline-none border-none placeholder-white/70"
                            placeholder="$000.00"
                          />
                        </div>
                      </DraggableBox>
                    )}

                    {!isFieldDeleted("maintenanceFeesInclude") && (
                      <DraggableBox
                        id="maintenanceFeesInclude"
                        position={fieldPositions.maintenanceFeesInclude}
                        onPositionChange={updateFieldPosition}
                        label="Maintenance Fees Include"
                        zoom={0.85}
                        disabled={lockedSections.specsCol1}
                        onDelete={() =>
                          removeStandardField(
                            "maintenanceFeesInclude",
                            "Maintenance Fees Include",
                            maintenanceFeesInclude,
                            "Specs Column 1",
                            fieldStyles.maintenanceFeesInclude,
                          )
                        }
                        deleteTitle="Remove Maint. Fees Include"
                      >
                        <div className="text-left">
                          <StyledInput
                            value={maintFeesIncludeLabel}
                            onChange={(e) =>
                              setMaintFeesIncludeLabel(e.target.value)
                            }
                            inputStyle={fieldStyles["maintFeesIncludeLabel"]}
                            onChangeStyle={(s) =>
                              updateFieldStyle("maintFeesIncludeLabel", s)
                            }
                            className="font-semibold text-[12px] uppercase text-left block text-white bg-transparent border-none focus:outline-none whitespace-nowrap"
                            placeholder="MAINT. FEES INCLUDE:"
                          />
                          <StyledInput
                            value={maintenanceFeesInclude}
                            onChange={(e) =>
                              setMaintenanceFeesInclude(e.target.value)
                            }
                            inputStyle={fieldStyles["maintenanceFeesInclude"]}
                            onChangeStyle={(s) =>
                              updateFieldStyle("maintenanceFeesInclude", s)
                            }
                            className="text-[12px] text-left text-white/90 bg-transparent w-full focus:outline-none border-none placeholder-white/70"
                            placeholder="Gardening, Garbage Pickup..."
                          />
                        </div>
                      </DraggableBox>
                    )}

                    {!isFieldDeleted("featuresIncluded") && (
                      <DraggableBox
                        id="featuresIncluded"
                        position={fieldPositions.featuresIncluded}
                        onPositionChange={updateFieldPosition}
                        label="Features Included"
                        zoom={0.85}
                        disabled={lockedSections.specsCol1}
                        onDelete={() =>
                          removeStandardField(
                            "featuresIncluded",
                            "Features Included",
                            featuresIncluded,
                            "Specs Column 1",
                            fieldStyles.featuresIncluded,
                          )
                        }
                        deleteTitle="Remove Features Included"
                      >
                        <div className="text-left">
                          <StyledInput
                            value={featuresIncludedLabel}
                            onChange={(e) =>
                              setFeaturesIncludedLabel(e.target.value)
                            }
                            inputStyle={fieldStyles["featuresIncludedLabel"]}
                            onChangeStyle={(s) =>
                              updateFieldStyle("featuresIncludedLabel", s)
                            }
                            className="font-semibold text-[12px] uppercase text-left block text-white bg-transparent border-none focus:outline-none whitespace-nowrap"
                            placeholder="FEATURES INCLUDED:"
                          />
                          <StyledInput
                            value={featuresIncluded}
                            onChange={(e) =>
                              setFeaturesIncluded(e.target.value)
                            }
                            inputStyle={fieldStyles["featuresIncluded"]}
                            onChangeStyle={(s) =>
                              updateFieldStyle("featuresIncluded", s)
                            }
                            className="text-[12px] text-left text-white/90 bg-transparent w-full focus:outline-none border-none placeholder-white/70"
                            placeholder="Clothes Washer/Dryer/Fridge..."
                          />
                        </div>
                      </DraggableBox>
                    )}
                  </div>

                  {/* Specs Column 2 (Right ~25%) */}
                  <div
                    data-drag-container="true"
                    className={`col-span-3 flex flex-col items-start text-left gap-1 text-[12px] relative transition-all duration-150 group/sec border border-transparent ${
                      lockedSections.specsCol2
                        ? "hover:border-amber-400 hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(245,158,11,0.4)]"
                        : "hover:border-[#8B3DFF] hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(139,61,255,0.4)]"
                    }`}
                  >
                    <button
                      type="button"
                      data-html2canvas-ignore="true"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSectionLock("specsCol2");
                      }}
                      className={`absolute top-1 right-1 z-40 p-1 rounded-md transition-all duration-150
                        shadow-sm flex items-center gap-1 text-[8px] font-medium cursor-pointer
                        opacity-0 group-hover/sec:opacity-100 ${
                          lockedSections.specsCol2
                            ? "bg-amber-500 text-white shadow-amber-500/30 hover:bg-amber-600"
                            : "bg-white/90 text-gray-700 hover:bg-white border border-gray-200"
                        }`}
                      title={
                        lockedSections.specsCol2
                          ? "Unlock Specs Column 2 Section"
                          : "Lock Specs Column 2 Section"
                      }
                    >
                      {lockedSections.specsCol2 ? (
                        <>
                          <Lock className="w-3 h-3" />
                          <span>Locked</span>
                        </>
                      ) : (
                        <>
                          <Unlock className="w-3 h-3" />
                          <span>Lock</span>
                        </>
                      )}
                    </button>

                    {!isFieldDeleted("siteInfluences") && (
                      <DraggableBox
                        id="siteInfluences"
                        position={fieldPositions.siteInfluences}
                        onPositionChange={updateFieldPosition}
                        label="Site Influences"
                        zoom={0.85}
                        disabled={lockedSections.specsCol2}
                        onDelete={() =>
                          removeStandardField(
                            "siteInfluences",
                            "Site Influences",
                            siteInfluences,
                            "Specs Column 2",
                            fieldStyles.siteInfluences,
                          )
                        }
                        deleteTitle="Remove Site Influences"
                      >
                        <div className="text-left">
                          <StyledInput
                            value={siteInfluencesLabel}
                            onChange={(e) =>
                              setSiteInfluencesLabel(e.target.value)
                            }
                            inputStyle={fieldStyles["siteInfluencesLabel"]}
                            onChangeStyle={(s) =>
                              updateFieldStyle("siteInfluencesLabel", s)
                            }
                            className="font-semibold text-[12px] uppercase text-left block text-white bg-transparent border-none focus:outline-none whitespace-nowrap"
                            placeholder="SITE INFLUENCES:"
                          />
                          <StyledInput
                            value={siteInfluences}
                            onChange={(e) => setSiteInfluences(e.target.value)}
                            inputStyle={fieldStyles["siteInfluences"]}
                            onChangeStyle={(s) =>
                              updateFieldStyle("siteInfluences", s)
                            }
                            className="text-[12px] text-left text-white/90 bg-transparent w-full focus:outline-none border-none placeholder-white/70"
                            placeholder="Central Location, Golf Course..."
                          />
                        </div>
                      </DraggableBox>
                    )}

                    {!isFieldDeleted("amenities") && (
                      <DraggableBox
                        id="amenities"
                        position={fieldPositions.amenities}
                        onPositionChange={updateFieldPosition}
                        label="Amenities"
                        zoom={0.85}
                        disabled={lockedSections.specsCol2}
                        onDelete={() =>
                          removeStandardField(
                            "amenities",
                            "Amenities",
                            amenities,
                            "Specs Column 2",
                            fieldStyles.amenities,
                          )
                        }
                        deleteTitle="Remove Amenities"
                      >
                        <div className="text-left">
                          <StyledInput
                            value={amenitiesLabel}
                            onChange={(e) => setAmenitiesLabel(e.target.value)}
                            inputStyle={fieldStyles["amenitiesLabel"]}
                            onChangeStyle={(s) =>
                              updateFieldStyle("amenitiesLabel", s)
                            }
                            className="font-semibold text-[12px] uppercase text-left block text-white bg-transparent border-none focus:outline-none whitespace-nowrap"
                            placeholder="AMENITIES:"
                          />
                          <StyledInput
                            value={amenities}
                            onChange={(e) => setAmenities(e.target.value)}
                            inputStyle={fieldStyles["amenities"]}
                            onChangeStyle={(s) =>
                              updateFieldStyle("amenities", s)
                            }
                            className="text-[12px] text-left text-white/90 bg-transparent w-full focus:outline-none border-none placeholder-white/70"
                            placeholder="Exercise Centre, Garden..."
                          />
                        </div>
                      </DraggableBox>
                    )}

                    {!isFieldDeleted("view") && (
                      <DraggableBox
                        id="view"
                        position={fieldPositions.view}
                        onPositionChange={updateFieldPosition}
                        label="View"
                        zoom={0.85}
                        disabled={lockedSections.specsCol2}
                        onDelete={() =>
                          removeStandardField(
                            "view",
                            "View",
                            view,
                            "Specs Column 2",
                            fieldStyles.view,
                          )
                        }
                        deleteTitle="Remove View"
                      >
                        <div className="text-left">
                          <StyledInput
                            value={viewLabel}
                            onChange={(e) => setViewLabel(e.target.value)}
                            inputStyle={fieldStyles["viewLabel"]}
                            onChangeStyle={(s) =>
                              updateFieldStyle("viewLabel", s)
                            }
                            className="font-semibold text-[12px] uppercase text-left block text-white bg-transparent border-none focus:outline-none whitespace-nowrap"
                            placeholder="VIEW:"
                          />
                          <StyledInput
                            value={view}
                            onChange={(e) => setView(e.target.value)}
                            inputStyle={fieldStyles["view"]}
                            onChangeStyle={(s) => updateFieldStyle("view", s)}
                            className="text-[12px] text-left text-white/90 bg-transparent w-full focus:outline-none border-none placeholder-white/70"
                            placeholder="South & SW - Van Isl."
                          />
                        </div>
                      </DraggableBox>
                    )}

                    {!isFieldDeleted("mlsNumber") && (
                      <DraggableBox
                        id="mlsNumber"
                        position={fieldPositions.mlsNumber}
                        onPositionChange={updateFieldPosition}
                        label="MLS #"
                        zoom={0.85}
                        disabled={lockedSections.specsCol2}
                        onDelete={() =>
                          removeStandardField(
                            "mlsNumber",
                            "MLS #",
                            mlsNumber,
                            "Specs Column 2",
                            fieldStyles.mlsNumber,
                          )
                        }
                        deleteTitle="Remove MLS #"
                      >
                        <div className="flex items-center gap-1 mt-1 text-left">
                          <StyledInput
                            value={mlsLabel}
                            onChange={(e) => setMlsLabel(e.target.value)}
                            inputStyle={fieldStyles["mlsLabel"]}
                            onChangeStyle={(s) =>
                              updateFieldStyle("mlsLabel", s)
                            }
                            className="font-semibold text-[12px] uppercase text-left text-white bg-transparent border-none focus:outline-none whitespace-nowrap"
                            placeholder="MLS* "
                            wrapperClassName="w-auto shrink-0"
                          />
                          <StyledInput
                            value={mlsNumber}
                            onChange={(e) => setMlsNumber(e.target.value)}
                            inputStyle={fieldStyles["mlsNumber"]}
                            onChangeStyle={(s) =>
                              updateFieldStyle("mlsNumber", s)
                            }
                            className="font-bold text-left text-[12px] text-white bg-transparent focus:outline-none border-none placeholder-white whitespace-nowrap"
                            placeholder="0000000"
                            wrapperClassName="w-auto shrink-0"
                          />
                        </div>
                      </DraggableBox>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Swooping White Contact Card Footer (Expanded to Bleed Edge) */}
              <div
                data-drag-container="true"
                className={`absolute bottom-0 left-0 right-0 h-[175px] z-20 pointer-events-none flex flex-col justify-end transition-all duration-150 group/sec border border-transparent ${
                  lockedSections.contactCard
                    ? "hover:border-amber-400 hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(245,158,11,0.4)]"
                    : "hover:border-[#8B3DFF] hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(139,61,255,0.4)]"
                }`}
                style={bottomBleedStyle}
              >
                <button
                  type="button"
                  data-html2canvas-ignore="true"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSectionLock("contactCard");
                  }}
                  className={`absolute top-6 right-8 z-40 p-1 rounded-md transition-all duration-150
                    shadow-sm flex items-center gap-1 text-[8px] font-medium cursor-pointer pointer-events-auto
                    opacity-0 group-hover/sec:opacity-100 ${
                      lockedSections.contactCard
                        ? "bg-amber-500 text-white shadow-amber-500/30 hover:bg-amber-600"
                        : "bg-white/90 text-gray-700 hover:bg-white border border-gray-200"
                    }`}
                  title={
                    lockedSections.contactCard
                      ? "Unlock Contact Card Section"
                      : "Lock Contact Card Section"
                  }
                >
                  {lockedSections.contactCard ? (
                    <>
                      <Lock className="w-3 h-3" />
                      <span>Locked</span>
                    </>
                  ) : (
                    <>
                      <Unlock className="w-3 h-3" />
                      <span>Lock</span>
                    </>
                  )}
                </button>

                <svg
                  viewBox="0 0 816 230"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  preserveAspectRatio="none"
                >
                  {/* Metallic Accent Line Curve */}
                  <path
                    d="M0 40 Q 400 85 816 30 V230 H0 Z"
                    fill="#888888"
                    opacity="0.45"
                  />
                  {/* White Curve Card */}
                  <path d="M0 50 Q 400 95 816 40 V230 H0 Z" fill="#FFFFFF" />
                </svg>

                {/* Contact Info Overlay on White Curve */}
                <div className="relative z-10 px-10 pb-3 h-[120px] pt-0 flex justify-between items-start pointer-events-auto">
                  <div className="flex flex-col gap-0.5 text-gray-900 w-full">
                    <div className="flex items-baseline gap-1 text-[13px]">
                      <StyledInput
                        value={contactLabel}
                        onChange={(e) => setContactLabel(e.target.value)}
                        inputStyle={fieldStyles["contactLabel"]}
                        onChangeStyle={(s) =>
                          updateFieldStyle("contactLabel", s)
                        }
                        className="font-bold text-gray-800 bg-transparent border-none focus:outline-none whitespace-nowrap"
                        placeholder="CONTACT:"
                        wrapperClassName="w-auto shrink-0"
                      />
                      {!isFieldDeleted("contactName") && (
                        <DraggableBox
                          id="contactName"
                          position={fieldPositions.contactName}
                          onPositionChange={updateFieldPosition}
                          label="Agent Name"
                          zoom={0.85}
                          disabled={lockedSections.contactCard}
                          onDelete={() =>
                            removeStandardField(
                              "contactName",
                              "Agent Name",
                              fullName,
                              "Contact Card",
                              fieldStyles.fullName,
                            )
                          }
                          deleteTitle="Remove Agent Name"
                        >
                          <StyledInput
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            inputStyle={fieldStyles["fullName"]}
                            onChangeStyle={(s) =>
                              updateFieldStyle("fullName", s)
                            }
                            className="font-bold text-left text-[13px] text-gray-900 h-[18px] bg-transparent focus:outline-none border-none uppercase placeholder-gray-800 whitespace-nowrap"
                            placeholder="FIRSTNAME LASTNAME"
                            wrapperClassName="w-auto shrink-0"
                          />
                        </DraggableBox>
                      )}
                    </div>

                    {!isFieldDeleted("contactBrokerage") && (
                      <DraggableBox
                        id="contactBrokerage"
                        position={fieldPositions.contactBrokerage}
                        onPositionChange={updateFieldPosition}
                        label="Company Name"
                        zoom={0.85}
                        disabled={lockedSections.contactCard}
                        onDelete={() =>
                          removeStandardField(
                            "contactBrokerage",
                            "Company Name",
                            propertyName,
                            "Contact Card",
                            fieldStyles.propertyName,
                          )
                        }
                        deleteTitle="Remove Company Name"
                      >
                        <StyledInput
                          value={propertyName}
                          onChange={(e) => setPropertyName(e.target.value)}
                          inputStyle={fieldStyles["propertyName"]}
                          onChangeStyle={(s) =>
                            updateFieldStyle("propertyName", s)
                          }
                          className="font-normal text-left text-[11px] text-gray-800 h-[16px] bg-transparent focus:outline-none border-none uppercase placeholder-gray-700 whitespace-nowrap"
                          placeholder="MACDONALD REALTY"
                          wrapperClassName="w-auto shrink-0"
                        />
                      </DraggableBox>
                    )}

                    <div className="flex items-center gap-3 text-[10.5px] text-gray-900">
                      <div className="flex items-center gap-1">
                        <StyledInput
                          value={phoneLabel}
                          onChange={(e) => setPhoneLabel(e.target.value)}
                          inputStyle={fieldStyles["phoneLabel"]}
                          onChangeStyle={(s) =>
                            updateFieldStyle("phoneLabel", s)
                          }
                          className="font-bold bg-transparent border-none focus:outline-none whitespace-nowrap"
                          placeholder="PHONE:"
                          wrapperClassName="w-auto shrink-0"
                        />
                        {!isFieldDeleted("contactPhone") && (
                          <DraggableBox
                            id="contactPhone"
                            position={fieldPositions.contactPhone}
                            onPositionChange={updateFieldPosition}
                            label="Phone Number"
                            zoom={0.85}
                            disabled={lockedSections.contactCard}
                            onDelete={() =>
                              removeStandardField(
                                "contactPhone",
                                "Phone Number",
                                number,
                                "Contact Card",
                                fieldStyles.number,
                              )
                            }
                            deleteTitle="Remove Phone Number"
                          >
                            <StyledInput
                              value={number}
                              onChange={(e) => setNumber(e.target.value)}
                              inputStyle={fieldStyles["number"]}
                              onChangeStyle={(s) =>
                                updateFieldStyle("number", s)
                              }
                              className="font-normal text-left text-[11px] text-gray-900 h-[16px] bg-transparent focus:outline-none border-none placeholder-gray-800 whitespace-nowrap"
                              placeholder="604.000.0000"
                              wrapperClassName="w-auto shrink-0"
                            />
                          </DraggableBox>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <StyledInput
                          value={emailLabel}
                          onChange={(e) => setEmailLabel(e.target.value)}
                          inputStyle={fieldStyles["emailLabel"]}
                          onChangeStyle={(s) =>
                            updateFieldStyle("emailLabel", s)
                          }
                          className="font-bold bg-transparent border-none focus:outline-none whitespace-nowrap"
                          placeholder="EMAIL:"
                          wrapperClassName="w-auto shrink-0"
                        />
                        {!isFieldDeleted("contactEmail") && (
                          <DraggableBox
                            id="contactEmail"
                            position={fieldPositions.contactEmail}
                            onPositionChange={updateFieldPosition}
                            label="Email Link"
                            zoom={0.85}
                            disabled={lockedSections.contactCard}
                            onDelete={() =>
                              removeStandardField(
                                "contactEmail",
                                "Email Link",
                                email,
                                "Contact Card",
                                fieldStyles.email,
                              )
                            }
                            deleteTitle="Remove Email Link"
                          >
                            <StyledInput
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              inputStyle={fieldStyles["email"]}
                              onChangeStyle={(s) =>
                                updateFieldStyle("email", s)
                              }
                              className="font-normal text-left text-[10px] text-gray-900 h-[16px] bg-transparent focus:outline-none border-none uppercase placeholder-gray-800 whitespace-nowrap"
                              placeholder="FIRSTNAME@LASTNAME.COM"
                              wrapperClassName="w-auto shrink-0"
                            />
                          </DraggableBox>
                        )}
                      </div>
                    </div>

                    {/* Fine Print Disclaimer with Home & Equal Housing Opportunity icons */}
                    <div className="flex items-center gap-1.5 pt-1 text-[8px] text-gray-600 leading-tight">
                      <StyledInput
                        value={disclaimerText}
                        rows={2}
                        onChange={(e) => setDisclaimerText(e.target.value)}
                        inputStyle={fieldStyles["disclaimerText"]}
                        onChangeStyle={(s) =>
                          updateFieldStyle("disclaimerText", s)
                        }
                        className="text-[8px] text-gray-600 leading-tight bg-transparent border-none focus:outline-none w-full"
                        placeholder="All information deemed reliable..."
                      />
                      <div className="flex items-center gap-1 shrink-0 text-gray-700">
                        <House className="w-3.5 h-3.5" />
                        <span className="text-[9px] font-serif border border-gray-700 px-0.5 rounded-[1px] leading-none">
                          EHO
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </SafeZoneWrapper>
        </div>

        {/* --- PAGE 2 DIVIDER --- */}
        <div className="w-[8.5in] flex items-center justify-center pb-6 pt-10 print:hidden select-none">
          <div className="h-[1px] bg-gray-300 flex-1"></div>
          <span className="text-gray-400 font-medium tracking-widest text-sm px-4">
            PAGE 2
          </span>
          <div className="h-[1px] bg-gray-300 flex-1"></div>
        </div>

        {/* --- PAGE 2 WRAPPER --- */}
        <div
          className="pdf-page bg-[#404040] shadow-xl relative overflow-hidden flex flex-col justify-between"
          style={{
            width: showBleed ? "8.75in" : "8.5in",
            height: showBleed ? "11.25in" : "11.0in",
            zoom: 0.85,
          }}
        >
          <SafeZoneWrapper showBleed={showBleed} showGuide={showGuide}>
            <div
              data-safezone-container="true"
              className="relative w-full h-full flex flex-col justify-between z-10 select-none overflow-hidden"
            >
              {/* Background SVG graphics */}
              <svg
                viewBox="0 0 816 1056"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="absolute inset-0 w-full h-full pointer-events-none z-0"
                preserveAspectRatio="none"
              >
                {/* Metallic Curve Bottom Background */}
                <path
                  d="M0 940 C0 940 400 900 816 970 V1056 H0 Z"
                  fill="#888888"
                  opacity="0.4"
                />
                <path
                  d="M0 960 C0 960 400 920 816 990 V1056 H0 Z"
                  fill="#404040"
                />
              </svg>

              {/* PAGE 2 CONTENT (White Floor Plan Card inset on charcoal background) */}
              <div className="relative z-10 w-full h-full flex flex-col p-0">
                {/* Main Central White Card Container */}
                <div className="rounded-md shadow-2xl p-0 flex-1 flex flex-col justify-between">
                  {/* Floor Plan Slot (Image 6) */}
                  <div className="w-full h-full p-0 flex items-center justify-center">
                    {renderImageSlot(
                      "image6",
                      "w-full h-full ",
                      "Select Floor Plan Image (Image 6)",
                    )}
                  </div>
                </div>

                {/* Bottom Page 2 Footer Banner */}
                <StyledInput
                  value={footerCredit}
                  onChange={(e) => setFooterCredit(e.target.value)}
                  inputStyle={fieldStyles["footerCredit"]}
                  onChangeStyle={(s) => updateFieldStyle("footerCredit", s)}
                  className="w-full text-center text-white text-[11px] font-semibold tracking-wider pt-1 bg-transparent border-none focus:outline-none"
                  placeholder="DESIGNED AND PRINTED BY BC FLOOR PLANS"
                />
              </div>
            </div>
          </SafeZoneWrapper>
        </div>
      </div>
    );
  },
);

BcfpStandard18.displayName = "BcfpStandard18";

