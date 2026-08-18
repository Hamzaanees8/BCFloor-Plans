import {
  Pencil,
  Trash,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Lock,
  Unlock,
} from "lucide-react";
import ImageEditor from "./ImageEditor";
import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  useEffect,
  useCallback,
} from "react";
import { Order } from "../../orders/page";
import { featureSheetService } from "../file-manager";
import {
  FeatureSheetResponse,
  FeatureSheetPayload,
  TextStyle,
  StyledTextField,
} from "../types/featureSheetTypes";
import "../../../globals.css";
import StyledInput from "./StyledInput";
import FileManagerGallery from "./fileManagerGallery";
import { useFileManagerContext } from "../FileManagerContext";
import SafeZoneWrapper from "./SafeZoneWrapper";
import DraggableBox from "./DraggableBox";
import { DeletedDetailFieldItem } from "./DeletedFieldsPanel";

export interface BcfpStandard4Ref {
  exportToPayload: () => Promise<FeatureSheetPayload>;
  importFromPayload: (payload: FeatureSheetResponse) => void;
}

interface BcfpStandard4Props {
  orderData: Order | null;
  showBleed?: boolean;
  showGuide?: boolean;
}

// ─── BoxIndicator ─────────────────────────────────────────────────────────────
// Renders a Canva-style 3.5px colored border indicator to indicate the bounds
// of an image container on hover, click (active), or drag.
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
// ──────────────────────────────────────────────────────────────────────────────



const BcfpStandard4 = forwardRef<BcfpStandard4Ref, BcfpStandard4Props>(
  ({ orderData, showBleed: propShowBleed, showGuide: propShowGuide }, ref) => {
    const {
      formData,
      updateFormData,
      setRestoreDetailFieldHandler,
      setRestoreAllDetailFieldsHandler,
    } = useFileManagerContext();

    // ── Deletion & Restoration State ──────────────────────────────────────
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
          const newDeletedDetailFields = [
            ...prevDetail.filter((f) => f.id !== id),
            deletedItem,
          ];
          updateFormData({
            deletedStandardFieldIds: newDeletedStandard,
            deletedDetailFields: newDeletedDetailFields,
          });
          return newDeletedDetailFields;
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
      updateFormData({
        deletedStandardFieldIds: [],
        deletedDetailFields: [],
      });
    }, [updateFormData]);

    useEffect(() => {
      if (setRestoreDetailFieldHandler) {
        setRestoreDetailFieldHandler(() => restoreDetailField);
      }
      if (setRestoreAllDetailFieldsHandler) {
        setRestoreAllDetailFieldsHandler(() => restoreAllDetailFields);
      }
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

    // ── Field Value States ────────────────────────────────────────────────
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

    const [showBleedState] = useState(true);
    const [showGuideState] = useState(true);

    const showBleed =
      propShowBleed !== undefined ? propShowBleed : showBleedState;
    const showGuide =
      propShowGuide !== undefined ? propShowGuide : showGuideState;

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
      address: false,
      contact: false,
      price: false,
      description: false,
      specs: false,
      details: false,
    });

    const toggleSectionLock = (section: string) => {
      setLockedSections((prev) => ({ ...prev, [section]: !prev[section] }));
    };

    // ── Images States ──────────────────────────────────────────────────────
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
      image14: 0,
      image15: 0,
      image16: 0,
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

    // ── Image Input Refs ──────────────────────────────────────────────────
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

    // Auto-populate from orderData and context
    useEffect(() => {
      if (orderData) {
        const prop = orderData.property;
        const agent = orderData.agent;

        if (prop) {
          if (prop.listing_price) setAmount(prop.listing_price.toString());
          if (prop.bedrooms) setBedroom(prop.bedrooms.toString());
          if (prop.bathrooms) setBathroom(prop.bathrooms.toString());
          if (prop.square_footage) setSqft(prop.square_footage.toString());
          if (prop.year_constructed)
            setBuiltYear(prop.year_constructed.toString());
          if (prop.description) setDescription(prop.description);
          if (prop.mls_number) setMlsNumber(prop.mls_number);

          if (prop.suite) setAddressCode(prop.suite.toString());
          if (prop.address) setRoadName(prop.suite ?? "");

          let city = "";
          if (prop.city) city += prop.city;
          if (prop.province) city += (city ? ", " : "") + prop.province;
          if (prop.postal_code) city += (city ? " " : "") + prop.postal_code;
          if (city) setCityLine(prop.address || city);
        }

        if (agent) {
          if (agent.first_name || agent.last_name)
            setFullName(
              `${agent.first_name || ""} ${agent.last_name || ""}`.trim(),
            );
          if (agent.email) setEmail(agent.email);
          if (agent.company_name) setPropertyName(agent.company_name);
        }
      }

      if (formData) {
        const s = (val: any) =>
          typeof val === "string" ? val : val?.value || "";

        if (formData.byLawRestrictions)
          setByLawRestrictions(s(formData.byLawRestrictions));
        if (formData.maintenanceFees) setMaintFees(s(formData.maintenanceFees));
        if (formData.maintenanceFeesInclude)
          setMaintFeesInclude(s(formData.maintenanceFeesInclude));
        if (formData.featuresIncluded)
          setFeaturesIncluded(s(formData.featuresIncluded));
        if (formData.siteInfluences)
          setSiteInfluences(s(formData.siteInfluences));
        if (formData.amenities) setAmenities(s(formData.amenities));
        if (formData.view) setView(s(formData.view));
        if (formData.description) setDescription(s(formData.description));
        if (formData.fullName) setFullName(s(formData.fullName));
        if (formData.email) setEmail(s(formData.email));
        if (formData.propertyName) setPropertyName(s(formData.propertyName));
        if (formData.amount) setAmount(s(formData.amount));
        if (formData.number) setNumber(s(formData.number));
        if (formData.addressCode) setAddressCode(s(formData.addressCode));
        if (formData.roadName) setRoadName(s(formData.roadName));
        if (formData.cityLine) setCityLine(s(formData.cityLine));
        if (formData.mlsNumber) setMlsNumber(s(formData.mlsNumber));
        if (formData.bedroom) setBedroom(s(formData.bedroom));
        if (formData.bathroom) setBathroom(s(formData.bathroom));
        if (formData.sqft) setSqft(s(formData.sqft));
        if (formData.builtYear) setBuiltYear(s(formData.builtYear));

        if (formData.images) {
          setImages((prev) => ({
            ...prev,
            ...(formData.images as typeof images),
          }));
        }
        if (formData.imageScales) {
          setScale((prev) => ({
            ...prev,
            ...(formData.imageScales as typeof scale),
          }));
        }
        if (formData.imagePositions) {
          setPosition((prev) => ({
            ...prev,
            ...(formData.imagePositions as typeof position),
          }));
        }
        if (formData.imageRotations) {
          setRotation((prev) => ({
            ...prev,
            ...(formData.imageRotations as typeof rotation),
          }));
        }
        if (formData.fieldPositions) {
          setFieldPositions(formData.fieldPositions);
        }
        if (formData.deletedDetailFields) {
          setDeletedDetailFields(formData.deletedDetailFields);
        }
        if (formData.deletedStandardFieldIds) {
          setDeletedStandardFieldIds(formData.deletedStandardFieldIds);
        }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orderData]);

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
        images,
        imageScales: scale,
        imagePositions: position,
        imageRotations: rotation,
        fieldPositions,
        deletedStandardFieldIds,
        deletedDetailFields,
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
      images,
      scale,
      position,
      rotation,
      fieldPositions,
      deletedStandardFieldIds,
      deletedDetailFields,
      updateFormData,
    ]);

    // ── Image Handlers ────────────────────────────────────────────────────
    const handleMouseDown = (key: keyof typeof images, e: React.MouseEvent) => {
      if (e.altKey) return;
      setDragging((prev) => ({ ...prev, [key]: true }));
      lastPosition.current[key] = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (key: keyof typeof images, e: React.MouseEvent) => {
      if (!dragging[key]) return;
      const dx = (e.clientX - lastPosition.current[key].x) / 0.55;
      const dy = (e.clientY - lastPosition.current[key].y) / 0.55;
      setPosition((prev) => ({
        ...prev,
        [key]: { x: prev[key].x + dx, y: prev[key].y + dy },
      }));
      lastPosition.current[key] = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = (key: keyof typeof images) =>
      setDragging((prev) => ({ ...prev, [key]: false }));
    const handleMouseLeave = (key: keyof typeof images) =>
      setDragging((prev) => ({ ...prev, [key]: false }));

    const handleZoom = (key: keyof typeof images, direction: "in" | "out") => {
      setScale((prev) => {
        const newScale = direction === "in" ? prev[key] + 0.1 : prev[key] - 0.1;
        return { ...prev, [key]: Math.min(Math.max(newScale, 0.1), 5) };
      });
    };

    const handleRotate = (key: keyof typeof images) => {
      setRotation((prev) => ({ ...prev, [key]: (prev[key] + 90) % 360 }));
    };

    const handleDelete = (
      key: keyof typeof images,
      ref: React.RefObject<HTMLInputElement | null>,
    ) => {
      setImages((prev) => ({ ...prev, [key]: null }));
      setScale((prev) => ({ ...prev, [key]: 1 }));
      setPosition((prev) => ({ ...prev, [key]: { x: 0, y: 0 } }));
      setRotation((prev) => ({ ...prev, [key]: 0 }));
      if (ref.current) ref.current.value = "";
    };

    const handleImageChange = (
      key: keyof typeof images,
      e: React.ChangeEvent<HTMLInputElement>,
    ) => {
      if (e.target.files && e.target.files[0]) {
        setImages((prev) => ({
          ...prev,
          [key]: URL.createObjectURL(e.target.files![0]),
        }));
      }
    };

    const handleGalleryImageSelect = (imageUrl: string) => {
      if (!currentImageSlot) return;
      setImages((prev) => ({ ...prev, [currentImageSlot]: imageUrl }));
      setShowGallery(false);
      setCurrentImageSlot(null);
    };

    const openImageSourceModal = (imageSlot: string, e?: React.MouseEvent) => {
      if (e?.altKey) return;
      setCurrentImageSlot(imageSlot);
      setShowGallery(true);
    };

    // ── Expose imperative methods to parent ──────────────────────────────
    useImperativeHandle(ref, () => ({
      exportToPayload: async () => {
        const payload = await featureSheetService.buildPayload({
          orderUuid: orderData?.uuid || "",
          templateKey: "BCFPStandard4",
          uploadedBy: "admin",
          type: "template",
          primaryColor: "#416173",
          offeredAtPrice: {
            value: amount,
            style: {
              ...fieldStyles.amount,
              fontSize: fieldStyles.amount?.fontSize || "30px",
            },
          },
          realtorName: {
            value: fullName,
            style: {
              ...fieldStyles.fullName,
              fontSize: fieldStyles.fullName?.fontSize || "11px",
            },
          },
          emailLink: {
            value: email,
            style: {
              ...fieldStyles.email,
              fontSize: fieldStyles.email?.fontSize || "11px",
            },
          },
          propertyNotesTitle: {
            value: propertyName,
            style: {
              ...fieldStyles.propertyName,
              fontSize: fieldStyles.propertyName?.fontSize || "11px",
            },
          },
          propertyNotesDescription: {
            value: description,
            style: {
              ...fieldStyles.description,
              fontSize: fieldStyles.description?.fontSize || "14px",
            },
          },
          expandedDetail1Title: "By-law Restrictions",
          expandedDetail1Description: {
            value: byLawRestrictions,
            style: {
              ...fieldStyles.byLawRestrictions,
              fontSize: fieldStyles.byLawRestrictions?.fontSize || "10px",
            },
          },
          expandedDetail2Title: "Maintenance Fees",
          expandedDetail2Description: {
            value: maintFees,
            style: {
              ...fieldStyles.maintFees,
              fontSize: fieldStyles.maintFees?.fontSize || "10px",
            },
          },
          expandedDetail3Title: "Maintenance Fee Includes",
          expandedDetail3Description: {
            value: maintFeesInclude,
            style: {
              ...fieldStyles.maintFeesInclude,
              fontSize: fieldStyles.maintFeesInclude?.fontSize || "10px",
            },
          },
          expandedDetail4Title: "Amenities",
          expandedDetail4Description: {
            value: amenities,
            style: {
              ...fieldStyles.amenities,
              fontSize: fieldStyles.amenities?.fontSize || "10px",
            },
          },
          keyHighlightLabel: "Features Included",
          keyHighlights: featuresIncluded
            ? featuresIncluded.split("\n").filter(Boolean)
            : [],
          otherDetails: {
            view: {
              value: view,
              style: {
                ...fieldStyles.view,
                fontSize: fieldStyles.view?.fontSize || "10px",
              },
            },
            bedroom: {
              value: bedroom,
              style: {
                ...fieldStyles.bedroom,
                fontSize: fieldStyles.bedroom?.fontSize || "22px",
              },
            },
            bathroom: {
              value: bathroom,
              style: {
                ...fieldStyles.bathroom,
                fontSize: fieldStyles.bathroom?.fontSize || "22px",
              },
            },
            sqft: {
              value: sqft,
              style: {
                ...fieldStyles.sqft,
                fontSize: fieldStyles.sqft?.fontSize || "22px",
              },
            },
            builtYear: {
              value: builtYear,
              style: {
                ...fieldStyles.builtYear,
                fontSize: fieldStyles.builtYear?.fontSize || "22px",
              },
            },
            mlsNumber: {
              value: mlsNumber,
              style: {
                ...fieldStyles.mlsNumber,
                fontSize: fieldStyles.mlsNumber?.fontSize || "10px",
              },
            },
            siteInfluences: {
              value: siteInfluences,
              style: {
                ...fieldStyles.siteInfluences,
                fontSize: fieldStyles.siteInfluences?.fontSize || "10px",
              },
            },
            number: {
              value: number,
              style: {
                ...fieldStyles.number,
                fontSize: fieldStyles.number?.fontSize || "11px",
              },
            },
            addressCode: {
              value: addressCode,
              style: {
                ...fieldStyles.addressCode,
                fontSize: fieldStyles.addressCode?.fontSize || "30px",
              },
            },
            roadName: {
              value: roadName,
              style: {
                ...fieldStyles.roadName,
                fontSize: fieldStyles.roadName?.fontSize || "30px",
              },
            },
            cityLine: {
              value: cityLine,
              style: {
                ...fieldStyles.cityLine,
                fontSize: fieldStyles.cityLine?.fontSize || "13px",
              },
            },
            featuresIncluded: {
              value: featuresIncluded,
              style: {
                ...fieldStyles.featuresIncluded,
                fontSize: fieldStyles.featuresIncluded?.fontSize || "10px",
              },
            },
          },
          images,
          imageScales: scale,
          imagePositions: position,
          imageRotations: rotation,
        });
        return payload;
      },

      importFromPayload: (payload: FeatureSheetResponse) => {
        const state = featureSheetService.parsePayloadToState(payload);
        if (state.offeredAtPrice) setAmount(state.offeredAtPrice as string);
        if (state.realtorName) setFullName(state.realtorName as string);
        if (state.email) setEmail(state.email as string);
        if (state.propertyNotesTitle)
          setPropertyName(state.propertyNotesTitle as string);
        if (state.propertyNotesDescription)
          setDescription(state.propertyNotesDescription as string);
        if (state.expandedDetail1Description)
          setByLawRestrictions(state.expandedDetail1Description as string);
        if (state.expandedDetail2Description)
          setMaintFees(state.expandedDetail2Description as string);
        if (state.expandedDetail3Description)
          setMaintFeesInclude(state.expandedDetail3Description as string);
        if (state.expandedDetail4Description)
          setAmenities(state.expandedDetail4Description as string);
        if (state.keyHighlights)
          setFeaturesIncluded(state.keyHighlights.join("\n"));

        if (state.otherDetails) {
          const others = state.otherDetails as Record<string, any>;
          if (others.view) setView(others.view.value || others.view);
          if (others.bedroom)
            setBedroom(others.bedroom.value || others.bedroom);
          if (others.bathroom)
            setBathroom(others.bathroom.value || others.bathroom);
          if (others.sqft) setSqft(others.sqft.value || others.sqft);
          if (others.builtYear)
            setBuiltYear(others.builtYear.value || others.builtYear);
          if (others.mlsNumber)
            setMlsNumber(others.mlsNumber.value || others.mlsNumber);
          if (others.siteInfluences)
            setSiteInfluences(
              others.siteInfluences.value || others.siteInfluences,
            );
          if (others.number) setNumber(others.number.value || others.number);
          if (others.addressCode)
            setAddressCode(others.addressCode.value || others.addressCode);
          if (others.roadName)
            setRoadName(others.roadName.value || others.roadName);
          if (others.cityLine)
            setCityLine(others.cityLine.value || others.cityLine);
        }

        const styles: Record<string, TextStyle> = {};
        const c = payload.content;
        const st = (f: any) => (f as StyledTextField)?.style;

        if (st(c.offeredAtPrice)) styles.amount = st(c.offeredAtPrice);
        if (st(c.realtorName)) styles.fullName = st(c.realtorName);
        if (st(c.emailLink)) styles.email = st(c.emailLink);
        if (st(c.propertyNotesTitle))
          styles.propertyName = st(c.propertyNotesTitle);
        if (st(c.propertyNotesDescription))
          styles.description = st(c.propertyNotesDescription);
        if (st(c.expandedDetail1Description))
          styles.byLawRestrictions = st(c.expandedDetail1Description);
        if (st(c.expandedDetail2Description))
          styles.maintFees = st(c.expandedDetail2Description);
        if (st(c.expandedDetail3Description))
          styles.maintFeesInclude = st(c.expandedDetail3Description);
        if (st(c.expandedDetail4Description))
          styles.amenities = st(c.expandedDetail4Description);

        const od = c.otherDetails as Record<string, any>;
        if (od?.view?.style) styles.view = od.view.style;
        if (od?.bedroom?.style) styles.bedroom = od.bedroom.style;
        if (od?.bathroom?.style) styles.bathroom = od.bathroom.style;
        if (od?.sqft?.style) styles.sqft = od.sqft.style;
        if (od?.builtYear?.style) styles.builtYear = od.builtYear.style;
        if (od?.mlsNumber?.style) styles.mlsNumber = od.mlsNumber.style;
        if (od?.siteInfluences?.style)
          styles.siteInfluences = od.siteInfluences.style;
        if (od?.number?.style) styles.number = od.number.style;
        if (od?.addressCode?.style) styles.addressCode = od.addressCode.style;
        if (od?.roadName?.style) styles.roadName = od.roadName.style;
        if (od?.cityLine?.style) styles.cityLine = od.cityLine.style;
        if (od?.featuresIncluded?.style)
          styles.featuresIncluded = od.featuresIncluded.style;

        setFieldStyles(styles);

        if (state.images)
          setImages((prev) => ({
            ...prev,
            ...(state.images as unknown as typeof images),
          }));
        if (state.imageScales)
          setScale((prev) => ({
            ...prev,
            ...(state.imageScales as unknown as typeof scale),
          }));
        if (state.imagePositions)
          setPosition((prev) => ({
            ...prev,
            ...(state.imagePositions as unknown as typeof position),
          }));
        if (state.imageRotations)
          setRotation((prev) => ({
            ...prev,
            ...(state.imageRotations as unknown as typeof rotation),
          }));
      },
    }));

    return (
      <>
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

        <div className="w-full flex flex-col items-center justify-center font-alexandria py-8 gap-0">
          {/* TOP SHEET BANNERS (PAGE 4 | PAGE 1) */}
          <div
            data-html2canvas-ignore="true"
            className="flex items-center justify-between gap-6 select-none"
            style={{
              width: showBleed ? "17.25in" : "17in",
              zoom: 0.55,
              margin: "0 auto 32px auto",
            }}
          >
            <div className="w-1/2 text-center text-gray-500 font-semibold text-[20px] tracking-widest uppercase">
              PAGE 4
            </div>
            <div className="w-1/2 text-center text-gray-500 font-semibold text-[20px] tracking-widest uppercase">
              PAGE 1
            </div>
          </div>

          {/* pdf-page 1 */}
          <div
            className="flex items-stretch pdf-page bg-white shadow-[6px_6px_12px_rgba(0,0,0,0.85)] relative overflow-hidden"
            style={{
              width: showBleed ? "17.25in" : "17in",
              height: showBleed ? "11.25in" : "11in",
              zoom: 0.55,
              margin: "0 auto",
              marginBottom: "40px",
            }}
          >
            <SafeZoneWrapper showBleed={showBleed} showGuide={showGuide}>
              <div className="w-full flex justify-center font-alexandria h-full relative z-10">
                {/* Page 1 Left Column */}
                <div className="w-1/2 flex flex-col justify-between relative h-full">
                  <div
                    className="p-[50px] flex-1 flex flex-col justify-center items-center bg-[#416173]"
                    style={{
                      marginTop: showBleed ? "-0.375in" : "-0.25in",
                      marginLeft: showBleed ? "-0.375in" : "-0.25in",
                      marginRight: showBleed ? "-0.375in" : "-0.25in",
                      width: showBleed
                        ? "calc(100% + 0.375in)"
                        : "calc(100% + 0.25in)",
                    }}
                  >
                    {/* image1 */}
                    <div
                      data-image-slot="true"
                      className="w-full h-full mb-[20px] place-self-center relative overflow-hidden group pb-2 cursor-pointer shadow-[6px_6px_12px_rgba(0,0,0,0.85)]"
                      onMouseEnter={() => setHoveredSlot("image1")}
                      onMouseLeave={() => setHoveredSlot(null)}
                      onClick={(e) => {
                        if (e.altKey) return;
                        e.stopPropagation();
                        setActiveSlot("image1");
                      }}
                    >
                      <BoxIndicator isVisible={isSlotActive("image1")} />
                      <div
                        className="w-full h-full relative overflow-hidden flex items-center justify-center"
                        onMouseMove={(e) => handleMouseMove("image1", e)}
                        onMouseUp={() => handleMouseUp("image1")}
                        onMouseLeave={() => handleMouseLeave("image1")}
                      >
                        {images.image1 ? (
                          <>
                            <div
                              className="w-full h-full cursor-grab active:cursor-grabbing"
                              onMouseDown={(e) => handleMouseDown("image1", e)}
                            >
                              <ImageEditor
                                src={images.image1}
                                scale={scale.image1}
                                position={position.image1}
                                rotation={rotation.image1}
                              />
                            </div>

                            {/* Zoom Controls */}
                            <div className="absolute bottom-1 left-1 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto z-20">
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

                            {/* Rotate */}
                            <button
                              type="button"
                              onClick={() => handleRotate("image1")}
                              className="absolute top-2 right-[72px] z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                              title="Rotate image"
                            >
                              <RotateCw className="w-4 h-4 text-gray-700" />
                            </button>

                            {/* Edit */}
                            <button
                              type="button"
                              onClick={(e) => openImageSourceModal("image1", e)}
                              className="absolute top-2 right-10 z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                              title="Edit image"
                            >
                              <Pencil className="w-4 h-4 text-gray-700" />
                            </button>

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() =>
                                handleDelete("image1", fileInputRef1)
                              }
                              className="absolute top-2 right-2 z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                              title="Delete image"
                            >
                              <Trash className="w-4 h-4 text-red-500" />
                            </button>
                          </>
                        ) : (
                          <div
                            data-html2canvas-ignore="true"
                            onClick={(e) => openImageSourceModal("image1", e)}
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
                  </div>

                  <div
                    className="relative shrink-0 mt-[-65px] z-10"
                    style={{
                      marginLeft: showBleed ? "-0.375in" : "-0.25in",
                      marginBottom: showBleed ? "-0.375in" : "-0.25in",
                      width: showBleed
                        ? "calc(100% + 0.375in)"
                        : "calc(100% + 0.25in)",
                    }}
                  >
                    {/* SVG Wave in DOM flow for html2canvas PDF capture */}
                    <svg
                      viewBox="163 79 631 114"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-full h-[75px] block pointer-events-none relative z-10"
                      preserveAspectRatio="none"
                    >
                      <path
                        d="M793.592 138.135C793.592 138.135 655.583 191.415 440.821 116.535C226.06 41.6551 163 128.055 163 128.055V193H477.5H794L793.592 139.575"
                        fill="white"
                      />
                      <path
                        opacity={0.350006}
                        d="M794 115.5C794 115.5 656.323 173.19 441.12 104.904C225.916 36.6177 166 124.936 166 124.936L167.5 192.5H794V117.5"
                        fill="white"
                      />
                    </svg>

                    {/* Solid white card below wave curve with section lock */}
                    <div
                      data-safezone-container="true"
                      className={`bg-white relative z-10 text-black pr-6 mt-[-35px] transition-all duration-150 group/sec rounded-lg border-[3.5px] border-solid border-transparent ${
                        lockedSections.contact
                          ? "hover:border-amber-400 hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(245,158,11,0.4)] hover:bg-amber-500/5"
                          : "hover:border-[#8B3DFF] hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(139,61,255,0.4)] hover:bg-[#8B3DFF]/5"
                      }`}
                      style={{
                        paddingLeft: showBleed
                          ? "calc(0.375in + 12px)"
                          : "24px",
                        paddingBottom: showBleed
                          ? "calc(0.375in + 12px)"
                          : "24px",
                      }}
                    >
                      {/* Lock / Unlock Toggle Button */}
                      <button
                        type="button"
                        data-html2canvas-ignore="true"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSectionLock("contact");
                        }}
                        className={`absolute top-2 right-2 z-30 p-1 rounded-md transition-all duration-150 shadow-sm flex items-center gap-1 text-[8px] font-medium cursor-pointer opacity-0 group-hover/sec:opacity-100 ${
                          lockedSections.contact
                            ? "bg-amber-500 text-white shadow-amber-500/30 hover:bg-amber-600"
                            : "bg-white/90 text-gray-700 hover:bg-white border border-gray-200"
                        }`}
                        title={
                          lockedSections.contact
                            ? "Unlock Contact Section (enable dragging)"
                            : "Lock Contact Section (disable dragging)"
                        }
                      >
                        {lockedSections.contact ? (
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

                      {!isFieldDeleted("fullName") && (
                        <DraggableBox
                          id="fullName"
                          position={fieldPositions.fullName}
                          onPositionChange={updateFieldPosition}
                          label="Agent Name"
                          zoom={0.55}
                          disabled={lockedSections.contact}
                          onDelete={() =>
                            removeStandardField(
                              "fullName",
                              "Agent Name",
                              fullName,
                              "Page 1 - Contact",
                              fieldStyles.fullName,
                            )
                          }
                          deleteTitle="Remove Agent Name"
                        >
                          <div className="font-bold text-[11px] pt-1 flex items-center gap-1">
                            <span className="font-normal shrink-0">
                              CONTACT:
                            </span>
                            <StyledInput
                              value={fullName}
                              onChange={(e) => setFullName(e.target.value)}
                              onChangeStyle={(s) =>
                                updateFieldStyle("fullName", s)
                              }
                              inputStyle={fieldStyles.fullName}
                              className="text-[11px] text-[#B3B394] h-[18px] bg-transparent text-left w-full focus:outline-none border-none placeholder-black placeholder:font-[500]"
                              placeholder="FIRSTNAME LASTNAME"
                            />
                          </div>
                        </DraggableBox>
                      )}

                      {!isFieldDeleted("propertyName") && (
                        <DraggableBox
                          id="propertyName"
                          position={fieldPositions.propertyName}
                          onPositionChange={updateFieldPosition}
                          label="Brokerage"
                          zoom={0.55}
                          disabled={lockedSections.contact}
                          onDelete={() =>
                            removeStandardField(
                              "propertyName",
                              "Brokerage",
                              propertyName,
                              "Page 1 - Contact",
                              fieldStyles.propertyName,
                            )
                          }
                          deleteTitle="Remove Brokerage"
                        >
                          <StyledInput
                            value={propertyName}
                            onChange={(e) => setPropertyName(e.target.value)}
                            onChangeStyle={(s) =>
                              updateFieldStyle("propertyName", s)
                            }
                            inputStyle={fieldStyles.propertyName}
                            className="text-[11px] font-thin h-[18px] bg-transparent text-left text-black w-full focus:outline-none border-none placeholder-black placeholder:font-[200]"
                            placeholder="MACDONALD Realty"
                          />
                        </DraggableBox>
                      )}

                      <div className="flex gap-2">
                        {!isFieldDeleted("number") && (
                          <DraggableBox
                            id="number"
                            position={fieldPositions.number}
                            onPositionChange={updateFieldPosition}
                            label="Phone"
                            zoom={0.55}
                            disabled={lockedSections.contact}
                            onDelete={() =>
                              removeStandardField(
                                "number",
                                "Phone",
                                number,
                                "Page 1 - Contact",
                                fieldStyles.number,
                              )
                            }
                            deleteTitle="Remove Phone"
                          >
                            <div className="flex gap-1 text-black text-[11px] items-center">
                              <span className="shrink-0">PHONE:</span>
                              <StyledInput
                                value={number}
                                onChange={(e) => setNumber(e.target.value)}
                                onChangeStyle={(s) =>
                                  updateFieldStyle("number", s)
                                }
                                inputStyle={fieldStyles.number}
                                className="font-thin text-[11px] h-[22px] bg-transparent text-left w-[100px] focus:outline-none border-none placeholder-black placeholder:font-[500]"
                                placeholder="604.000.0000"
                              />
                            </div>
                          </DraggableBox>
                        )}

                        {!isFieldDeleted("email") && (
                          <DraggableBox
                            id="email"
                            position={fieldPositions.email}
                            onPositionChange={updateFieldPosition}
                            label="Email"
                            zoom={0.55}
                            disabled={lockedSections.contact}
                            onDelete={() =>
                              removeStandardField(
                                "email",
                                "Email",
                                email,
                                "Page 1 - Contact",
                                fieldStyles.email,
                              )
                            }
                            deleteTitle="Remove Email"
                          >
                            <div className="flex gap-1 text-black text-[11px] items-center">
                              <span className="shrink-0">EMAIL:</span>
                              <StyledInput
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                onChangeStyle={(s) =>
                                  updateFieldStyle("email", s)
                                }
                                inputStyle={fieldStyles.email}
                                className="font-thin text-[11px] h-[22px] bg-transparent text-left w-[150px] focus:outline-none border-none placeholder-black placeholder:font-[500]"
                                placeholder="FIRST@LAST.COM"
                              />
                            </div>
                          </DraggableBox>
                        )}
                      </div>

                      {!isFieldDeleted("contactDisclaimer") && (
                        <DraggableBox
                          id="contactDisclaimer"
                          position={fieldPositions.contactDisclaimer}
                          onPositionChange={updateFieldPosition}
                          label="Disclaimer"
                          zoom={0.55}
                          disabled={lockedSections.contact}
                          onDelete={() =>
                            removeStandardField(
                              "contactDisclaimer",
                              "Disclaimer",
                              "All information deemed reliable...",
                              "Page 1 - Contact",
                            )
                          }
                          deleteTitle="Remove Disclaimer"
                        >
                          <p className="text-[6px] w-[67%] leading-tight">
                            All information deemed reliable but not guaranteed
                            and should be independently verified. All properties
                            are subject to prior sale, change or withdrawal.
                            Neither listing broker(s) nor BC Floor Plans shall
                            be responsible for any typographical errors,
                            misinformation, misprints and shall be held totally
                            harmless.
                          </p>
                        </DraggableBox>
                      )}

                      <p className="font-bold text-[10px]">
                        DESIGNED AND PRINTED BY BC FLOOR PLANS
                      </p>
                    </div>

                    {/* image2 */}
                    <div
                      data-image-slot="true"
                      className="absolute top-[10px] right-[55px] z-20 group cursor-pointer shadow-[6px_6px_12px_rgba(0,0,0,0.85)]"
                      onMouseEnter={() => setHoveredSlot("image2")}
                      onMouseLeave={() => setHoveredSlot(null)}
                      onClick={(e) => {
                        if (e.altKey) return;
                        e.stopPropagation();
                        setActiveSlot("image2");
                      }}
                    >
                      <div className="w-[200px] h-[110px] relative bg-white shadow-md group overflow-hidden">
                        <BoxIndicator isVisible={isSlotActive("image2")} />
                        <div
                          className="w-full h-full relative overflow-hidden flex items-center justify-center"
                          onMouseMove={(e) => handleMouseMove("image2", e)}
                          onMouseUp={() => handleMouseUp("image2")}
                          onMouseLeave={() => handleMouseLeave("image2")}
                        >
                          {images.image2 ? (
                            <>
                              <div
                                className="w-full h-full cursor-grab active:cursor-grabbing"
                                onMouseDown={(e) =>
                                  handleMouseDown("image2", e)
                                }
                              >
                                <ImageEditor
                                  src={images.image2}
                                  scale={scale.image2}
                                  position={position.image2}
                                  rotation={rotation.image2}
                                />
                              </div>

                              {/* Zoom Controls */}
                              <div className="absolute bottom-1 left-1 flex gap-1 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto z-20">
                                <button
                                  type="button"
                                  onClick={() => handleZoom("image2", "in")}
                                  className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                                  title="Zoom In"
                                >
                                  <ZoomIn className="w-4 h-4 text-gray-700" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleZoom("image2", "out")}
                                  className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                                  title="Zoom Out"
                                >
                                  <ZoomOut className="w-4 h-4 text-gray-700" />
                                </button>
                              </div>

                              {/* Rotate */}
                              <button
                                type="button"
                                onClick={() => handleRotate("image2")}
                                className="absolute top-2 right-[72px] z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                                title="Rotate image"
                              >
                                <RotateCw className="w-4 h-4 text-gray-700" />
                              </button>

                              {/* Edit */}
                              <button
                                type="button"
                                onClick={(e) =>
                                  openImageSourceModal("image2", e)
                                }
                                className="absolute top-2 right-10 z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                                title="Edit image"
                              >
                                <Pencil className="w-4 h-4 text-gray-700" />
                              </button>

                              {/* Delete */}
                              <button
                                type="button"
                                onClick={() =>
                                  handleDelete("image2", fileInputRef2)
                                }
                                className="absolute top-2 right-2 z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                                title="Delete image"
                              >
                                <Trash className="w-4 h-4 text-red-500" />
                              </button>
                            </>
                          ) : (
                            <div
                              data-html2canvas-ignore="true"
                              onClick={(e) => openImageSourceModal("image2", e)}
                              className="w-[200px] h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
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
                  </div>
                </div>

                {/* Page 1 Right Column */}
                <div
                  className="bg-[#416173] flex flex-col relative shrink-0"
                  style={{
                    width: showBleed
                      ? "calc(50% + 0.375in)"
                      : "calc(50% + 0.25in)",
                    marginRight: showBleed ? "-0.375in" : "-0.25in",
                    marginTop: showBleed ? "-0.375in" : "-0.25in",
                    marginBottom: showBleed ? "-0.375in" : "-0.25in",
                  }}
                >
                  <div className="relative z-10">
                    <svg
                      viewBox="163 83 631 114"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="absolute top-0 right-0 left-0 w-full h-[220px]"
                      preserveAspectRatio="none"
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
                          <feFlood
                            floodOpacity={0}
                            result="BackgroundImageFix"
                          />
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

                    {/* image3 */}
                    <div
                      data-image-slot="true"
                      className="absolute top-[60px] left-[68px] group cursor-pointer z-20 shadow-[6px_6px_12px_rgba(0,0,0,0.85)]"
                      onMouseEnter={() => setHoveredSlot("image3")}
                      onMouseLeave={() => setHoveredSlot(null)}
                      onClick={(e) => {
                        if (e.altKey) return;
                        e.stopPropagation();
                        setActiveSlot("image3");
                      }}
                    >
                      <div className="w-[170px] h-[94px] relative bg-white shadow-md group overflow-hidden">
                        <BoxIndicator isVisible={isSlotActive("image3")} />
                        <div
                          className="w-full h-full relative overflow-hidden flex items-center justify-center"
                          onMouseMove={(e) => handleMouseMove("image3", e)}
                          onMouseUp={() => handleMouseUp("image3")}
                          onMouseLeave={() => handleMouseLeave("image3")}
                        >
                          {images.image3 ? (
                            <>
                              <div
                                className="w-full h-full cursor-grab active:cursor-grabbing"
                                onMouseDown={(e) =>
                                  handleMouseDown("image3", e)
                                }
                              >
                                <ImageEditor
                                  src={images.image3}
                                  scale={scale.image3}
                                  position={position.image3}
                                  rotation={rotation.image3}
                                />
                              </div>

                              {/* Zoom Controls */}
                              <div className="absolute bottom-1 left-1 flex gap-1 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto z-20">
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

                              {/* Rotate */}
                              <button
                                type="button"
                                onClick={() => handleRotate("image3")}
                                className="absolute top-2 right-[72px] z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                                title="Rotate image"
                              >
                                <RotateCw className="w-4 h-4 text-gray-700" />
                              </button>

                              {/* Edit */}
                              <button
                                type="button"
                                onClick={(e) =>
                                  openImageSourceModal("image3", e)
                                }
                                className="absolute top-2 right-10 z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                                title="Edit image"
                              >
                                <Pencil className="w-4 h-4 text-gray-700" />
                              </button>

                              {/* Delete */}
                              <button
                                type="button"
                                onClick={() =>
                                  handleDelete("image3", fileInputRef3)
                                }
                                className="absolute top-2 right-2 z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                                title="Delete image"
                              >
                                <Trash className="w-4 h-4 text-red-500" />
                              </button>
                            </>
                          ) : (
                            <div
                              data-html2canvas-ignore="true"
                              onClick={(e) => openImageSourceModal("image3", e)}
                              className="w-[170px] h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
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
                    </div>
                  </div>

                  {/* image4 */}
                  <div
                    data-image-slot="true"
                      className="w-full h-[580px] mt-[35px] place-self-center relative overflow-hidden group cursor-pointer shadow-[6px_6px_12px_rgba(0,0,0,0.85)]"
                    onMouseEnter={() => setHoveredSlot("image4")}
                    onMouseLeave={() => setHoveredSlot(null)}
                    onClick={(e) => {
                      if (e.altKey) return;
                      e.stopPropagation();
                      setActiveSlot("image4");
                    }}
                  >
                    <BoxIndicator isVisible={isSlotActive("image4")} />
                    <div
                      className="w-full h-full relative overflow-hidden flex items-center justify-center"
                      onMouseMove={(e) => handleMouseMove("image4", e)}
                      onMouseUp={() => handleMouseUp("image4")}
                      onMouseLeave={() => handleMouseLeave("image4")}
                    >
                      {images.image4 ? (
                        <>
                          <div
                            className="w-full h-full cursor-grab active:cursor-grabbing"
                            onMouseDown={(e) => handleMouseDown("image4", e)}
                          >
                            <ImageEditor
                              src={images.image4}
                              scale={scale.image4}
                              position={position.image4}
                              rotation={rotation.image4}
                            />
                          </div>

                          {/* Zoom Controls */}
                          <div className="absolute bottom-1 left-1 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto z-20">
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

                          {/* Rotate */}
                          <button
                            type="button"
                            onClick={() => handleRotate("image4")}
                            className="absolute top-24 right-[72px] z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                            title="Rotate image"
                          >
                            <RotateCw className="w-4 h-4 text-gray-700" />
                          </button>

                          {/* Edit */}
                          <button
                            type="button"
                            onClick={(e) => openImageSourceModal("image4", e)}
                            className="absolute top-24 right-10 z-20 bg-white p-1 rounded-full hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                            title="Edit image"
                          >
                            <Pencil className="w-4 h-4 text-gray-700" />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() =>
                              handleDelete("image4", fileInputRef4)
                            }
                            className="absolute top-24 right-2 z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                            title="Delete image"
                          >
                            <Trash className="w-4 h-4 text-red-500" />
                          </button>
                        </>
                      ) : (
                        <div
                          data-html2canvas-ignore="true"
                          onClick={(e) => openImageSourceModal("image4", e)}
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
                  </div>

                  {/* 4 Bottom Grid Photos (image5, image6, image7, image8) */}
                  <div className="grid grid-cols-4">
                    {/* image5 */}
                    <div
                      data-image-slot="true"
                      className="h-[150px] relative group overflow-hidden cursor-pointer shadow-[6px_6px_12px_rgba(0,0,0,0.85)]"
                      onMouseEnter={() => setHoveredSlot("image5")}
                      onMouseLeave={() => setHoveredSlot(null)}
                      onClick={(e) => {
                        if (e.altKey) return;
                        e.stopPropagation();
                        setActiveSlot("image5");
                      }}
                    >
                      <BoxIndicator isVisible={isSlotActive("image5")} />
                      <div
                        className="w-full h-full relative overflow-hidden flex items-center justify-center"
                        onMouseMove={(e) => handleMouseMove("image5", e)}
                        onMouseUp={() => handleMouseUp("image5")}
                        onMouseLeave={() => handleMouseLeave("image5")}
                      >
                        {images.image5 ? (
                          <>
                            <div
                              className="w-full h-full cursor-grab active:cursor-grabbing"
                              onMouseDown={(e) => handleMouseDown("image5", e)}
                            >
                              <ImageEditor
                                src={images.image5}
                                scale={scale.image5}
                                position={position.image5}
                                rotation={rotation.image5}
                              />
                            </div>

                            {/* Zoom Controls */}
                            <div className="absolute bottom-1 left-1 flex gap-1 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto z-20">
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

                            {/* Rotate */}
                            <button
                              type="button"
                              onClick={() => handleRotate("image5")}
                              className="absolute top-2 right-[72px] z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                              title="Rotate image"
                            >
                              <RotateCw className="w-4 h-4 text-gray-700" />
                            </button>

                            {/* Edit */}
                            <button
                              type="button"
                              onClick={(e) => openImageSourceModal("image5", e)}
                              className="absolute top-2 right-10 z-20 bg-white p-1 rounded-full hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                              title="Edit image"
                            >
                              <Pencil className="w-4 h-4 text-gray-700" />
                            </button>

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() =>
                                handleDelete("image5", fileInputRef5)
                              }
                              className="absolute top-2 right-2 z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                              title="Delete image"
                            >
                              <Trash className="w-4 h-4 text-red-500" />
                            </button>
                          </>
                        ) : (
                          <div
                            data-html2canvas-ignore="true"
                            onClick={(e) => openImageSourceModal("image5", e)}
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

                    {/* image6 */}
                    <div
                      data-image-slot="true"
                      className="h-[150px] relative group overflow-hidden cursor-pointer shadow-[6px_6px_12px_rgba(0,0,0,0.85)]"
                      onMouseEnter={() => setHoveredSlot("image6")}
                      onMouseLeave={() => setHoveredSlot(null)}
                      onClick={(e) => {
                        if (e.altKey) return;
                        e.stopPropagation();
                        setActiveSlot("image6");
                      }}
                    >
                      <BoxIndicator isVisible={isSlotActive("image6")} />
                      <div
                        className="w-full h-full relative overflow-hidden flex items-center justify-center"
                        onMouseMove={(e) => handleMouseMove("image6", e)}
                        onMouseUp={() => handleMouseUp("image6")}
                        onMouseLeave={() => handleMouseLeave("image6")}
                      >
                        {images.image6 ? (
                          <>
                            <div
                              className="w-full h-full cursor-grab active:cursor-grabbing"
                              onMouseDown={(e) => handleMouseDown("image6", e)}
                            >
                              <ImageEditor
                                src={images.image6}
                                scale={scale.image6}
                                position={position.image6}
                                rotation={rotation.image6}
                              />
                            </div>

                            {/* Zoom Controls */}
                            <div className="absolute bottom-1 left-1 flex gap-1 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto z-20">
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

                            {/* Rotate */}
                            <button
                              type="button"
                              onClick={() => handleRotate("image6")}
                              className="absolute top-2 right-[72px] z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                              title="Rotate image"
                            >
                              <RotateCw className="w-4 h-4 text-gray-700" />
                            </button>

                            {/* Edit */}
                            <button
                              type="button"
                              onClick={(e) => openImageSourceModal("image6", e)}
                              className="absolute top-2 right-10 z-20 bg-white p-1 rounded-full hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                              title="Edit image"
                            >
                              <Pencil className="w-4 h-4 text-gray-700" />
                            </button>

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() =>
                                handleDelete("image6", fileInputRef6)
                              }
                              className="absolute top-2 right-2 z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                              title="Delete image"
                            >
                              <Trash className="w-4 h-4 text-red-500" />
                            </button>
                          </>
                        ) : (
                          <div
                            data-html2canvas-ignore="true"
                            onClick={(e) => openImageSourceModal("image6", e)}
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

                    {/* image7 */}
                    <div
                      data-image-slot="true"
                      className="h-[150px] relative group overflow-hidden cursor-pointer shadow-[6px_6px_12px_rgba(0,0,0,0.85)]"
                      onMouseEnter={() => setHoveredSlot("image7")}
                      onMouseLeave={() => setHoveredSlot(null)}
                      onClick={(e) => {
                        if (e.altKey) return;
                        e.stopPropagation();
                        setActiveSlot("image7");
                      }}
                    >
                      <BoxIndicator isVisible={isSlotActive("image7")} />
                      <div
                        className="w-full h-full relative overflow-hidden flex items-center justify-center"
                        onMouseMove={(e) => handleMouseMove("image7", e)}
                        onMouseUp={() => handleMouseUp("image7")}
                        onMouseLeave={() => handleMouseLeave("image7")}
                      >
                        {images.image7 ? (
                          <>
                            <div
                              className="w-full h-full cursor-grab active:cursor-grabbing"
                              onMouseDown={(e) => handleMouseDown("image7", e)}
                            >
                              <ImageEditor
                                src={images.image7}
                                scale={scale.image7}
                                position={position.image7}
                                rotation={rotation.image7}
                              />
                            </div>

                            {/* Zoom Controls */}
                            <div className="absolute bottom-1 left-1 flex gap-1 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto z-20">
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

                            {/* Rotate */}
                            <button
                              type="button"
                              onClick={() => handleRotate("image7")}
                              className="absolute top-2 right-[72px] z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                              title="Rotate image"
                            >
                              <RotateCw className="w-4 h-4 text-gray-700" />
                            </button>

                            {/* Edit */}
                            <button
                              type="button"
                              onClick={(e) => openImageSourceModal("image7", e)}
                              className="absolute top-2 right-10 z-20 bg-white p-1 rounded-full hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                              title="Edit image"
                            >
                              <Pencil className="w-4 h-4 text-gray-700" />
                            </button>

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() =>
                                handleDelete("image7", fileInputRef7)
                              }
                              className="absolute top-2 right-2 z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                              title="Delete image"
                            >
                              <Trash className="w-4 h-4 text-red-500" />
                            </button>
                          </>
                        ) : (
                          <div
                            data-html2canvas-ignore="true"
                            onClick={(e) => openImageSourceModal("image7", e)}
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

                    {/* image8 */}
                    <div
                      data-image-slot="true"
                      className="h-[150px] relative group overflow-hidden cursor-pointer shadow-[6px_6px_12px_rgba(0,0,0,0.85)]"
                      onMouseEnter={() => setHoveredSlot("image8")}
                      onMouseLeave={() => setHoveredSlot(null)}
                      onClick={(e) => {
                        if (e.altKey) return;
                        e.stopPropagation();
                        setActiveSlot("image8");
                      }}
                    >
                      <BoxIndicator isVisible={isSlotActive("image8")} />
                      <div
                        className="w-full h-full relative overflow-hidden flex items-center justify-center"
                        onMouseMove={(e) => handleMouseMove("image8", e)}
                        onMouseUp={() => handleMouseUp("image8")}
                        onMouseLeave={() => handleMouseLeave("image8")}
                      >
                        {images.image8 ? (
                          <>
                            <div
                              className="w-full h-full cursor-grab active:cursor-grabbing"
                              onMouseDown={(e) => handleMouseDown("image8", e)}
                            >
                              <ImageEditor
                                src={images.image8}
                                scale={scale.image8}
                                position={position.image8}
                                rotation={rotation.image8}
                              />
                            </div>

                            {/* Zoom Controls */}
                            <div className="absolute bottom-1 left-1 flex gap-1 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto z-20">
                              <button
                                type="button"
                                onClick={() => handleZoom("image8", "in")}
                                className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                                title="Zoom In"
                              >
                                <ZoomIn className="w-4 h-4 text-gray-700" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleZoom("image8", "out")}
                                className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                                title="Zoom Out"
                              >
                                <ZoomOut className="w-4 h-4 text-gray-700" />
                              </button>
                            </div>

                            {/* Rotate */}
                            <button
                              type="button"
                              onClick={() => handleRotate("image8")}
                              className="absolute top-2 right-[72px] z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                              title="Rotate image"
                            >
                              <RotateCw className="w-4 h-4 text-gray-700" />
                            </button>

                            {/* Edit */}
                            <button
                              type="button"
                              onClick={(e) => openImageSourceModal("image8", e)}
                              className="absolute top-2 right-10 z-20 bg-white p-1 rounded-full hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                              title="Edit image"
                            >
                              <Pencil className="w-4 h-4 text-gray-700" />
                            </button>

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() =>
                                handleDelete("image8", fileInputRef8)
                              }
                              className="absolute top-2 right-2 z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                              title="Delete image"
                            >
                              <Trash className="w-4 h-4 text-red-500" />
                            </button>
                          </>
                        ) : (
                          <div
                            data-html2canvas-ignore="true"
                            onClick={(e) => openImageSourceModal("image8", e)}
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
                    </div>
                  </div>

                  {/* Text Info Section (Address & Price) with Section Lock */}
                  <div
                    data-safezone-container="true"
                    className={`text-white flex flex-col items-center justify-center py-10 gap-2 relative transition-all duration-150 group/sec rounded-lg border-[3.5px] border-solid border-transparent ${
                      lockedSections.address
                        ? "hover:border-amber-400 hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(245,158,11,0.4)] hover:bg-amber-500/5"
                        : "hover:border-[#8B3DFF] hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(139,61,255,0.4)] hover:bg-[#8B3DFF]/5"
                    }`}
                  >
                    {/* Lock / Unlock Toggle Button */}
                    <button
                      type="button"
                      data-html2canvas-ignore="true"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSectionLock("address");
                      }}
                      className={`absolute top-2 right-2 z-30 p-1 rounded-md transition-all duration-150 shadow-sm flex items-center gap-1 text-[8px] font-medium cursor-pointer opacity-0 group-hover/sec:opacity-100 ${
                        lockedSections.address
                          ? "bg-amber-500 text-white shadow-amber-500/30 hover:bg-amber-600"
                          : "bg-white/90 text-gray-700 hover:bg-white border border-gray-200"
                      }`}
                      title={
                        lockedSections.address
                          ? "Unlock Address Section (enable dragging)"
                          : "Lock Address Section (disable dragging)"
                      }
                    >
                      {lockedSections.address ? (
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

                    {!isFieldDeleted("addressCode") && (
                      <DraggableBox
                        id="addressCode"
                        position={fieldPositions.addressCode}
                        onPositionChange={updateFieldPosition}
                        label="MLS / Suite"
                        zoom={0.55}
                        disabled={lockedSections.address}
                        onDelete={() =>
                          removeStandardField(
                            "addressCode",
                            "MLS / Suite",
                            addressCode,
                            "Page 1 - Address",
                            fieldStyles.addressCode,
                          )
                        }
                        deleteTitle="Remove MLS / Suite"
                      >
                        <div className="tracking-wide mt-0 flex items-center">
                          <span className="shrink-0">#</span>
                          <StyledInput
                            value={addressCode}
                            onChange={(e) => setAddressCode(e.target.value)}
                            onChangeStyle={(s) =>
                              updateFieldStyle("addressCode", s)
                            }
                            inputStyle={fieldStyles.addressCode}
                            className="font-light text-[30px] h-[30px] w-[180px] leading-none mt-0 bg-transparent text-[#FFF] text-left focus:outline-none border-none placeholder-[#FFF] placeholder:font-[200]"
                            placeholder="0000-0000"
                          />
                        </div>
                      </DraggableBox>
                    )}

                    {!isFieldDeleted("roadName") && (
                      <DraggableBox
                        id="roadName"
                        position={fieldPositions.roadName}
                        onPositionChange={updateFieldPosition}
                        label="Road Name"
                        zoom={0.55}
                        disabled={lockedSections.address}
                        onDelete={() =>
                          removeStandardField(
                            "roadName",
                            "Road Name",
                            roadName,
                            "Page 1 - Address",
                            fieldStyles.roadName,
                          )
                        }
                        deleteTitle="Remove Road Name"
                      >
                        <div className="text-[60px] font-light leading-none mt-0 flex items-center">
                          <span className="shrink-0">Number</span>
                          <StyledInput
                            value={roadName}
                            onChange={(e) => setRoadName(e.target.value)}
                            onChangeStyle={(s) =>
                              updateFieldStyle("roadName", s)
                            }
                            inputStyle={fieldStyles.roadName}
                            className="font-light text-[30px] h-[30px] leading-none mt-0 bg-transparent text-[#fff] text-center w-[65px] focus:outline-none border-none placeholder-[#fff] placeholder:font-[200]"
                            placeholder="0"
                          />
                          <span className="shrink-0">Road</span>
                        </div>
                      </DraggableBox>
                    )}

                    {!isFieldDeleted("cityLine") && (
                      <DraggableBox
                        id="cityLine"
                        position={fieldPositions.cityLine}
                        onPositionChange={updateFieldPosition}
                        label="City Line"
                        zoom={0.55}
                        disabled={lockedSections.address}
                        onDelete={() =>
                          removeStandardField(
                            "cityLine",
                            "City Line",
                            cityLine,
                            "Page 1 - Address",
                            fieldStyles.cityLine,
                          )
                        }
                        deleteTitle="Remove City Line"
                      >
                        <div className="tracking-[2px] uppercase mt-0 flex justify-center">
                          <StyledInput
                            value={cityLine}
                            onChange={(e) => setCityLine(e.target.value)}
                            onChangeStyle={(s) =>
                              updateFieldStyle("cityLine", s)
                            }
                            inputStyle={fieldStyles.cityLine}
                            className="text-white text-[13px] h-[20px] bg-transparent text-center w-[300px] focus:outline-none border-none placeholder-[#FFF] placeholder:font-[200]"
                            placeholder="BRIGHOUSE SOUTH, RICHMOND"
                          />
                        </div>
                      </DraggableBox>
                    )}

                    {!isFieldDeleted("amount") && (
                      <DraggableBox
                        id="amount"
                        position={fieldPositions.amount}
                        onPositionChange={updateFieldPosition}
                        label="Price"
                        zoom={0.55}
                        disabled={lockedSections.address}
                        onDelete={() =>
                          removeStandardField(
                            "amount",
                            "Price",
                            amount,
                            "Page 1 - Address",
                            fieldStyles.amount,
                          )
                        }
                        deleteTitle="Remove Price"
                      >
                        <div className="text-[30px] font-light mt-0">
                          <StyledInput
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            onChangeStyle={(s) => updateFieldStyle("amount", s)}
                            inputStyle={fieldStyles.amount}
                            className="font-semibold text-center text-[#fff] text-[30px] h-[40px] bg-transparent w-[150px] focus:outline-none border-none placeholder-[#fff] placeholder:font-[500]"
                            placeholder="$000,000"
                          />
                        </div>
                      </DraggableBox>
                    )}
                  </div>
                </div>
              </div>
            </SafeZoneWrapper>
          </div>

          {/* BOTTOM SHEET BANNERS (PAGE 2 | PAGE 3) */}
          <div
            data-html2canvas-ignore="true"
            className="flex items-center justify-between gap-6 select-none"
            style={{
              width: showBleed ? "17.25in" : "17in",
              zoom: 0.55,
              margin: "48px auto 32px auto",
            }}
          >
            <div className="w-1/2 text-center text-gray-500 font-semibold text-[20px] tracking-widest uppercase">
              PAGE 2
            </div>
            <div className="w-1/2 text-center text-gray-500 font-semibold text-[20px] tracking-widest uppercase">
              PAGE 3
            </div>
          </div>

          {/* pdf-page 2 */}
          <div
            className="flex items-stretch pdf-page bg-white shadow-[0_10px_25px_rgba(0,0,0,0.15)] relative overflow-hidden"
            style={{
              width: showBleed ? "17.25in" : "17in",
              height: showBleed ? "11.25in" : "11in",
              zoom: 0.55,
              margin: "0 auto",
              marginBottom: "40px",
            }}
          >
            {/* Page 2 background color in parent bleed container for edge-to-edge coverage */}
            <div className="absolute inset-0 bg-[#416173] pointer-events-none z-0" />

            <SafeZoneWrapper showBleed={showBleed} showGuide={showGuide}>
              <div className="w-full flex flex-col justify-between font-alexandria relative z-10 h-full p-0">
                <div className="flex gap-6 flex-1 items-stretch min-h-0">
                  {/* Page 2 Left Column */}
                  <div className="w-1/2 flex flex-col justify-between gap-6 h-full">
                    {/* image9 */}
                    <div
                      data-image-slot="true"
                      className="w-full flex-1 place-self-center z-10 relative overflow-hidden group shadow-[6px_6px_12px_rgba(0,0,0,0.85)] cursor-pointer"
                      onMouseEnter={() => setHoveredSlot("image9")}
                      onMouseLeave={() => setHoveredSlot(null)}
                      onClick={(e) => {
                        if (e.altKey) return;
                        e.stopPropagation();
                        setActiveSlot("image9");
                      }}
                    >
                      <BoxIndicator isVisible={isSlotActive("image9")} />
                      <div
                        className="w-full h-full relative overflow-hidden flex items-center justify-center"
                        onMouseMove={(e) => handleMouseMove("image9", e)}
                        onMouseUp={() => handleMouseUp("image9")}
                        onMouseLeave={() => handleMouseLeave("image9")}
                      >
                        {images.image9 ? (
                          <>
                            <div
                              className="w-full h-full cursor-grab active:cursor-grabbing"
                              onMouseDown={(e) => handleMouseDown("image9", e)}
                            >
                              <ImageEditor
                                src={images.image9}
                                scale={scale.image9}
                                position={position.image9}
                                rotation={rotation.image9}
                              />
                            </div>

                            {/* Zoom Controls */}
                            <div className="absolute bottom-1 left-1 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto z-20">
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

                            {/* Rotate */}
                            <button
                              type="button"
                              onClick={() => handleRotate("image9")}
                              className="absolute top-24 right-[72px] z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                              title="Rotate image"
                            >
                              <RotateCw className="w-4 h-4 text-gray-700" />
                            </button>

                            {/* Edit */}
                            <button
                              type="button"
                              onClick={(e) => openImageSourceModal("image9", e)}
                              className="absolute top-24 right-10 z-20 bg-white p-1 rounded-full hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                              title="Edit image"
                            >
                              <Pencil className="w-4 h-4 text-gray-700" />
                            </button>

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() =>
                                handleDelete("image9", fileInputRef9)
                              }
                              className="absolute top-24 right-2 z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                              title="Delete image"
                            >
                              <Trash className="w-4 h-4 text-red-500" />
                            </button>
                          </>
                        ) : (
                          <div
                            data-html2canvas-ignore="true"
                            onClick={(e) => openImageSourceModal("image9", e)}
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
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* image10 */}
                      <div
                        data-image-slot="true"
                        className="h-[210px] relative z-10 group overflow-hidden shadow-[6px_6px_12px_rgba(0,0,0,0.85)] cursor-pointer"
                        onMouseEnter={() => setHoveredSlot("image10")}
                        onMouseLeave={() => setHoveredSlot(null)}
                        onClick={(e) => {
                          if (e.altKey) return;
                          e.stopPropagation();
                          setActiveSlot("image10");
                        }}
                      >
                        <BoxIndicator isVisible={isSlotActive("image10")} />
                        <div
                          className="w-full h-full relative overflow-hidden flex items-center justify-center"
                          onMouseMove={(e) => handleMouseMove("image10", e)}
                          onMouseUp={() => handleMouseUp("image10")}
                          onMouseLeave={() => handleMouseLeave("image10")}
                        >
                          {images.image10 ? (
                            <>
                              <div
                                className="w-full h-full cursor-grab active:cursor-grabbing"
                                onMouseDown={(e) =>
                                  handleMouseDown("image10", e)
                                }
                              >
                                <ImageEditor
                                  src={images.image10}
                                  scale={scale.image10}
                                  position={position.image10}
                                  rotation={rotation.image10}
                                />
                              </div>

                              {/* Zoom Controls */}
                              <div className="absolute bottom-1 left-1 flex gap-1 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto z-20">
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

                              {/* Rotate */}
                              <button
                                type="button"
                                onClick={() => handleRotate("image10")}
                                className="absolute top-2 right-[72px] z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                                title="Rotate image"
                              >
                                <RotateCw className="w-4 h-4 text-gray-700" />
                              </button>

                              {/* Edit */}
                              <button
                                type="button"
                                onClick={(e) =>
                                  openImageSourceModal("image10", e)
                                }
                                className="absolute top-2 right-10 z-20 bg-white p-1 rounded-full hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                                title="Edit image"
                              >
                                <Pencil className="w-4 h-4 text-gray-700" />
                              </button>

                              {/* Delete */}
                              <button
                                type="button"
                                onClick={() =>
                                  handleDelete("image10", fileInputRef10)
                                }
                                className="absolute top-2 right-2 z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                                title="Delete image"
                              >
                                <Trash className="w-4 h-4 text-red-500" />
                              </button>
                            </>
                          ) : (
                            <div
                              data-html2canvas-ignore="true"
                              onClick={(e) =>
                                openImageSourceModal("image10", e)
                              }
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

                      {/* image11 */}
                      <div
                        data-image-slot="true"
                        className="h-[210px] relative z-10 group overflow-hidden shadow-[6px_6px_12px_rgba(0,0,0,0.85)] cursor-pointer"
                        onMouseEnter={() => setHoveredSlot("image11")}
                        onMouseLeave={() => setHoveredSlot(null)}
                        onClick={(e) => {
                          if (e.altKey) return;
                          e.stopPropagation();
                          setActiveSlot("image11");
                        }}
                      >
                        <BoxIndicator isVisible={isSlotActive("image11")} />
                        <div
                          className="w-full h-full relative overflow-hidden flex items-center justify-center"
                          onMouseMove={(e) => handleMouseMove("image11", e)}
                          onMouseUp={() => handleMouseUp("image11")}
                          onMouseLeave={() => handleMouseLeave("image11")}
                        >
                          {images.image11 ? (
                            <>
                              <div
                                className="w-full h-full cursor-grab active:cursor-grabbing"
                                onMouseDown={(e) =>
                                  handleMouseDown("image11", e)
                                }
                              >
                                <ImageEditor
                                  src={images.image11}
                                  scale={scale.image11}
                                  position={position.image11}
                                  rotation={rotation.image11}
                                />
                              </div>

                              {/* Zoom Controls */}
                              <div className="absolute bottom-1 left-1 flex gap-1 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto z-20">
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

                              {/* Rotate */}
                              <button
                                type="button"
                                onClick={() => handleRotate("image11")}
                                className="absolute top-2 right-[72px] z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                                title="Rotate image"
                              >
                                <RotateCw className="w-4 h-4 text-gray-700" />
                              </button>

                              {/* Edit */}
                              <button
                                type="button"
                                onClick={(e) =>
                                  openImageSourceModal("image11", e)
                                }
                                className="absolute top-2 right-10 z-20 bg-white p-1 rounded-full hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                                title="Edit image"
                              >
                                <Pencil className="w-4 h-4 text-gray-700" />
                              </button>

                              {/* Delete */}
                              <button
                                type="button"
                                onClick={() =>
                                  handleDelete("image11", fileInputRef11)
                                }
                                className="absolute top-2 right-2 z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                                title="Delete image"
                              >
                                <Trash className="w-4 h-4 text-red-500" />
                              </button>
                            </>
                          ) : (
                            <div
                              data-html2canvas-ignore="true"
                              onClick={(e) =>
                                openImageSourceModal("image11", e)
                              }
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
                    </div>

                    {/* Description Section with Section Lock */}
                    <div
                      data-safezone-container="true"
                      className={`text-[10px] font-normal text-white italic relative z-10 transition-all duration-150 group/sec rounded-lg border-[3.5px] border-solid border-transparent ${
                        lockedSections.description
                          ? "hover:border-amber-400 hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(245,158,11,0.4)] hover:bg-amber-500/5"
                          : "hover:border-[#8B3DFF] hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(139,61,255,0.4)] hover:bg-[#8B3DFF]/5"
                      }`}
                    >
                      {/* Lock / Unlock Toggle Button */}
                      <button
                        type="button"
                        data-html2canvas-ignore="true"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSectionLock("description");
                        }}
                        className={`absolute top-2 right-2 z-30 p-1 rounded-md transition-all duration-150 shadow-sm flex items-center gap-1 text-[8px] font-medium cursor-pointer opacity-0 group-hover/sec:opacity-100 ${
                          lockedSections.description
                            ? "bg-amber-500 text-white shadow-amber-500/30 hover:bg-amber-600"
                            : "bg-white/90 text-gray-700 hover:bg-white border border-gray-200"
                        }`}
                        title={
                          lockedSections.description
                            ? "Unlock Description Section (enable dragging)"
                            : "Lock Description Section (disable dragging)"
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

                      {!isFieldDeleted("description") && (
                        <DraggableBox
                          id="description"
                          position={fieldPositions.description}
                          onPositionChange={updateFieldPosition}
                          label="Description"
                          zoom={0.55}
                          disabled={lockedSections.description}
                          onDelete={() =>
                            removeStandardField(
                              "description",
                              "Description",
                              description,
                              "Page 2 - Description",
                              fieldStyles.description,
                            )
                          }
                          deleteTitle="Remove Description"
                        >
                          <StyledInput
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            onChangeStyle={(s) =>
                              updateFieldStyle("description", s)
                            }
                            inputStyle={fieldStyles.description}
                            className="font-normal text-[14px] min-h-[100px] z-20 text-white leading-[1.6] italic bg-transparent text-left focus:outline-none border-none placeholder-white placeholder:font-[500]"
                            placeholder="Enter description here..."
                          />
                        </DraggableBox>
                      )}
                    </div>
                  </div>

                  {/* Page 2 Right Column */}
                  <div className="w-1/2 flex gap-6 h-full">
                    <div className="w-[40%] flex flex-col justify-between gap-2 h-full">
                      <div className="grid grid-rows-4 gap-6 flex-1 h-full">
                        {/* image12 */}
                        <div
                          data-image-slot="true"
                          className="w-full h-full relative z-10 group overflow-hidden shadow-[6px_6px_12px_rgba(0,0,0,0.85)] cursor-pointer"
                          onMouseEnter={() => setHoveredSlot("image12")}
                          onMouseLeave={() => setHoveredSlot(null)}
                          onClick={(e) => {
                            if (e.altKey) return;
                            e.stopPropagation();
                            setActiveSlot("image12");
                          }}
                        >
                          <BoxIndicator isVisible={isSlotActive("image12")} />
                          <div
                            className="w-full h-full relative overflow-hidden flex items-center justify-center"
                            onMouseMove={(e) => handleMouseMove("image12", e)}
                            onMouseUp={() => handleMouseUp("image12")}
                            onMouseLeave={() => handleMouseLeave("image12")}
                          >
                            {images.image12 ? (
                              <>
                                <div
                                  className="w-full h-full cursor-grab active:cursor-grabbing"
                                  onMouseDown={(e) =>
                                    handleMouseDown("image12", e)
                                  }
                                >
                                  <ImageEditor
                                    src={images.image12}
                                    scale={scale.image12}
                                    position={position.image12}
                                    rotation={rotation.image12}
                                  />
                                </div>

                                {/* Zoom Controls */}
                                <div className="absolute bottom-1 left-1 flex gap-1 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto z-20">
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

                                {/* Rotate */}
                                <button
                                  type="button"
                                  onClick={() => handleRotate("image12")}
                                  className="absolute top-2 right-[72px] z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                                  title="Rotate image"
                                >
                                  <RotateCw className="w-4 h-4 text-gray-700" />
                                </button>

                                {/* Edit */}
                                <button
                                  type="button"
                                  onClick={() =>
                                    openImageSourceModal("image12")
                                  }
                                  className="absolute top-2 right-10 z-20 bg-white p-1 rounded-full hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                                  title="Edit image"
                                >
                                  <Pencil className="w-4 h-4 text-gray-700" />
                                </button>

                                {/* Delete */}
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDelete("image12", fileInputRef12)
                                  }
                                  className="absolute top-2 right-2 z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                                  title="Delete image"
                                >
                                  <Trash className="w-4 h-4 text-red-500" />
                                </button>
                              </>
                            ) : (
                              <div
                                data-html2canvas-ignore="true"
                                onClick={(e) =>
                                  openImageSourceModal("image12", e)
                                }
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
                        </div>

                        {/* image13 */}
                        <div
                          data-image-slot="true"
                          className="w-full h-full relative z-10 group overflow-hidden shadow-[6px_6px_12px_rgba(0,0,0,0.85)] cursor-pointer"
                          onMouseEnter={() => setHoveredSlot("image13")}
                          onMouseLeave={() => setHoveredSlot(null)}
                          onClick={(e) => {
                            if (e.altKey) return;
                            e.stopPropagation();
                            setActiveSlot("image13");
                          }}
                        >
                          <BoxIndicator isVisible={isSlotActive("image13")} />
                          <div
                            className="w-full h-full relative overflow-hidden flex items-center justify-center"
                            onMouseMove={(e) => handleMouseMove("image13", e)}
                            onMouseUp={() => handleMouseUp("image13")}
                            onMouseLeave={() => handleMouseLeave("image13")}
                          >
                            {images.image13 ? (
                              <>
                                <div
                                  className="w-full h-full cursor-grab active:cursor-grabbing"
                                  onMouseDown={(e) =>
                                    handleMouseDown("image13", e)
                                  }
                                >
                                  <ImageEditor
                                    src={images.image13}
                                    scale={scale.image13}
                                    position={position.image13}
                                    rotation={rotation.image13}
                                  />
                                </div>

                                {/* Zoom Controls */}
                                <div className="absolute bottom-1 left-1 flex gap-1 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto z-20">
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

                                {/* Rotate */}
                                <button
                                  type="button"
                                  onClick={() => handleRotate("image13")}
                                  className="absolute top-2 right-[72px] z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                                  title="Rotate image"
                                >
                                  <RotateCw className="w-4 h-4 text-gray-700" />
                                </button>

                                {/* Edit */}
                                <button
                                  type="button"
                                  onClick={() =>
                                    openImageSourceModal("image13")
                                  }
                                  className="absolute top-2 right-10 z-20 bg-white p-1 rounded-full hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                                  title="Edit image"
                                >
                                  <Pencil className="w-4 h-4 text-gray-700" />
                                </button>

                                {/* Delete */}
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDelete("image13", fileInputRef13)
                                  }
                                  className="absolute top-2 right-2 z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                                  title="Delete image"
                                >
                                  <Trash className="w-4 h-4 text-red-500" />
                                </button>
                              </>
                            ) : (
                              <div
                                data-html2canvas-ignore="true"
                                onClick={(e) =>
                                  openImageSourceModal("image13", e)
                                }
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

                        {/* image14 */}
                        <div
                          data-image-slot="true"
                          className="w-full h-full relative z-10 group overflow-hidden shadow-[6px_6px_12px_rgba(0,0,0,0.85)] cursor-pointer"
                          onMouseEnter={() => setHoveredSlot("image14")}
                          onMouseLeave={() => setHoveredSlot(null)}
                          onClick={(e) => {
                            if (e.altKey) return;
                            e.stopPropagation();
                            setActiveSlot("image14");
                          }}
                        >
                          <BoxIndicator isVisible={isSlotActive("image14")} />
                          <div
                            className="w-full h-full relative overflow-hidden flex items-center justify-center"
                            onMouseMove={(e) => handleMouseMove("image14", e)}
                            onMouseUp={() => handleMouseUp("image14")}
                            onMouseLeave={() => handleMouseLeave("image14")}
                          >
                            {images.image14 ? (
                              <>
                                <div
                                  className="w-full h-full cursor-grab active:cursor-grabbing"
                                  onMouseDown={(e) =>
                                    handleMouseDown("image14", e)
                                  }
                                >
                                  <ImageEditor
                                    src={images.image14}
                                    scale={scale.image14}
                                    position={position.image14}
                                    rotation={rotation.image14}
                                  />
                                </div>

                                {/* Zoom Controls */}
                                <div className="absolute bottom-1 left-1 flex gap-1 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto z-20">
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

                                {/* Rotate */}
                                <button
                                  type="button"
                                  onClick={() => handleRotate("image14")}
                                  className="absolute top-2 right-[72px] z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                                  title="Rotate image"
                                >
                                  <RotateCw className="w-4 h-4 text-gray-700" />
                                </button>

                                {/* Edit */}
                                <button
                                  type="button"
                                  onClick={() =>
                                    openImageSourceModal("image14")
                                  }
                                  className="absolute top-2 right-10 z-20 bg-white p-1 rounded-full hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                                  title="Edit image"
                                >
                                  <Pencil className="w-4 h-4 text-gray-700" />
                                </button>

                                {/* Delete */}
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDelete("image14", fileInputRef14)
                                  }
                                  className="absolute top-2 right-2 z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                                  title="Delete image"
                                >
                                  <Trash className="w-4 h-4 text-red-500" />
                                </button>
                              </>
                            ) : (
                              <div
                                data-html2canvas-ignore="true"
                                onClick={(e) =>
                                  openImageSourceModal("image14", e)
                                }
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

                        {/* image15 */}
                        <div
                          data-image-slot="true"
                          className="w-full h-full relative z-10 group overflow-hidden shadow-[6px_6px_12px_rgba(0,0,0,0.85)] cursor-pointer"
                          onMouseEnter={() => setHoveredSlot("image15")}
                          onMouseLeave={() => setHoveredSlot(null)}
                          onClick={(e) => {
                            if (e.altKey) return;
                            e.stopPropagation();
                            setActiveSlot("image15");
                          }}
                        >
                          <BoxIndicator isVisible={isSlotActive("image15")} />
                          <div
                            className="w-full h-full relative overflow-hidden flex items-center justify-center"
                            onMouseMove={(e) => handleMouseMove("image15", e)}
                            onMouseUp={() => handleMouseUp("image15")}
                            onMouseLeave={() => handleMouseLeave("image15")}
                          >
                            {images.image15 ? (
                              <>
                                <div
                                  className="w-full h-full cursor-grab active:cursor-grabbing"
                                  onMouseDown={(e) =>
                                    handleMouseDown("image15", e)
                                  }
                                >
                                  <ImageEditor
                                    src={images.image15}
                                    scale={scale.image15}
                                    position={position.image15}
                                    rotation={rotation.image15}
                                  />
                                </div>

                                {/* Zoom Controls */}
                                <div className="absolute bottom-1 left-1 flex gap-1 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto z-20">
                                  <button
                                    type="button"
                                    onClick={() => handleZoom("image15", "in")}
                                    className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                                    title="Zoom In"
                                  >
                                    <ZoomIn className="w-4 h-4 text-gray-700" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleZoom("image15", "out")}
                                    className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                                    title="Zoom Out"
                                  >
                                    <ZoomOut className="w-4 h-4 text-gray-700" />
                                  </button>
                                </div>

                                {/* Rotate */}
                                <button
                                  type="button"
                                  onClick={() => handleRotate("image15")}
                                  className="absolute top-2 right-[72px] z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                                  title="Rotate image"
                                >
                                  <RotateCw className="w-4 h-4 text-gray-700" />
                                </button>

                                {/* Edit */}
                                <button
                                  type="button"
                                  onClick={() =>
                                    openImageSourceModal("image15")
                                  }
                                  className="absolute top-2 right-10 z-20 bg-white p-1 rounded-full hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                                  title="Edit image"
                                >
                                  <Pencil className="w-4 h-4 text-gray-700" />
                                </button>

                                {/* Delete */}
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDelete("image15", fileInputRef15)
                                  }
                                  className="absolute top-2 right-2 z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                                  title="Delete image"
                                >
                                  <Trash className="w-4 h-4 text-red-500" />
                                </button>
                              </>
                            ) : (
                              <div
                                data-html2canvas-ignore="true"
                                onClick={(e) =>
                                  openImageSourceModal("image15", e)
                                }
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
                    </div>

                    <div className="w-[60%] flex flex-col justify-between gap-4 h-full">
                      {/* Details section with section lock */}
                      <div
                        data-safezone-container="true"
                        className={`flex gap-4 text-white text-[12px] leading-relaxed relative transition-all duration-150 group/sec rounded-lg border-[3.5px] border-solid border-transparent ${
                          lockedSections.details
                            ? "hover:border-amber-400 hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(245,158,11,0.4)] hover:bg-amber-500/5"
                            : "hover:border-[#8B3DFF] hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(139,61,255,0.4)] hover:bg-[#8B3DFF]/5"
                        }`}
                      >
                        {/* Lock / Unlock Toggle Button */}
                        <button
                          type="button"
                          data-html2canvas-ignore="true"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSectionLock("details");
                          }}
                          className={`absolute top-0 right-0 z-30 p-1 rounded-md transition-all duration-150 shadow-sm flex items-center gap-1 text-[8px] font-medium cursor-pointer opacity-0 group-hover/sec:opacity-100 ${
                            lockedSections.details
                              ? "bg-amber-500 text-white shadow-amber-500/30 hover:bg-amber-600"
                              : "bg-white/90 text-gray-700 hover:bg-white border border-gray-200"
                          }`}
                          title={
                            lockedSections.details
                              ? "Unlock Details Section (enable dragging)"
                              : "Lock Details Section (disable dragging)"
                          }
                        >
                          {lockedSections.details ? (
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

                        <div className="space-y-2 text-[10px] w-1/2">
                          {!isFieldDeleted("byLawRestrictions") && (
                            <DraggableBox
                              id="byLawRestrictions"
                              position={fieldPositions.byLawRestrictions}
                              onPositionChange={updateFieldPosition}
                              label="By-law Restrictions"
                              zoom={0.55}
                              disabled={lockedSections.details}
                              onDelete={() =>
                                removeStandardField(
                                  "byLawRestrictions",
                                  "By-law Restrictions",
                                  byLawRestrictions,
                                  "Page 2 - Details",
                                  fieldStyles.byLawRestrictions,
                                )
                              }
                              deleteTitle="Remove By-law Restrictions"
                            >
                              <div>
                                <span className="font-bold">
                                  BY-LAW RESTRICTIONS:
                                </span>{" "}
                                <StyledInput
                                  value={byLawRestrictions}
                                  onChange={(e) =>
                                    setByLawRestrictions(e.target.value)
                                  }
                                  onChangeStyle={(s) =>
                                    updateFieldStyle("byLawRestrictions", s)
                                  }
                                  inputStyle={fieldStyles.byLawRestrictions}
                                  className="font-semibold text-[10px] bg-transparent text-left w-full focus:outline-none border-none placeholder-[#FFFFFF] placeholder:font-[500]"
                                  placeholder="Pets Allowed w/Rest., Rentals Allowed"
                                />
                              </div>
                            </DraggableBox>
                          )}

                          {!isFieldDeleted("maintFees") && (
                            <DraggableBox
                              id="maintFees"
                              position={fieldPositions.maintFees}
                              onPositionChange={updateFieldPosition}
                              label="Maint. Fees"
                              zoom={0.55}
                              disabled={lockedSections.details}
                              onDelete={() =>
                                removeStandardField(
                                  "maintFees",
                                  "Maint. Fees",
                                  maintFees,
                                  "Page 2 - Details",
                                  fieldStyles.maintFees,
                                )
                              }
                              deleteTitle="Remove Maint. Fees"
                            >
                              <div>
                                <span className="font-bold">MAINT. FEES:</span>{" "}
                                <StyledInput
                                  value={maintFees}
                                  onChange={(e) => setMaintFees(e.target.value)}
                                  onChangeStyle={(s) =>
                                    updateFieldStyle("maintFees", s)
                                  }
                                  inputStyle={fieldStyles.maintFees}
                                  className="font-semibold text-[10px] bg-transparent text-left w-full focus:outline-none border-none placeholder-[#FFFFFF] placeholder:font-[500]"
                                  placeholder="$000.00"
                                />
                              </div>
                            </DraggableBox>
                          )}

                          {!isFieldDeleted("maintFeesInclude") && (
                            <DraggableBox
                              id="maintFeesInclude"
                              position={fieldPositions.maintFeesInclude}
                              onPositionChange={updateFieldPosition}
                              label="Maint. Fees Include"
                              zoom={0.55}
                              disabled={lockedSections.details}
                              onDelete={() =>
                                removeStandardField(
                                  "maintFeesInclude",
                                  "Maint. Fees Include",
                                  maintFeesInclude,
                                  "Page 2 - Details",
                                  fieldStyles.maintFeesInclude,
                                )
                              }
                              deleteTitle="Remove Maint. Fees Include"
                            >
                              <div>
                                <span className="font-bold">
                                  MAINT. FEES INCLUDE:
                                </span>
                                <StyledInput
                                  value={maintFeesInclude}
                                  onChange={(e) =>
                                    setMaintFeesInclude(e.target.value)
                                  }
                                  onChangeStyle={(s) =>
                                    updateFieldStyle("maintFeesInclude", s)
                                  }
                                  inputStyle={fieldStyles.maintFeesInclude}
                                  className="font-semibold text-[10px] bg-transparent text-left w-full focus:outline-none border-none placeholder-[#ffffff] placeholder:font-[500]"
                                  placeholder="Gardening, Garbage Pickup, Gas, Hot Water..."
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
                              zoom={0.55}
                              disabled={lockedSections.details}
                              onDelete={() =>
                                removeStandardField(
                                  "featuresIncluded",
                                  "Features Included",
                                  featuresIncluded,
                                  "Page 2 - Details",
                                  fieldStyles.featuresIncluded,
                                )
                              }
                              deleteTitle="Remove Features Included"
                            >
                              <div>
                                <span className="font-bold">
                                  FEATURES INCLUDED:
                                </span>
                                <StyledInput
                                  value={featuresIncluded}
                                  onChange={(e) =>
                                    setFeaturesIncluded(e.target.value)
                                  }
                                  onChangeStyle={(s) =>
                                    updateFieldStyle("featuresIncluded", s)
                                  }
                                  inputStyle={fieldStyles.featuresIncluded}
                                  className="font-semibold text-[10px] bg-transparent text-left w-full focus:outline-none border-none placeholder-[#fff] placeholder:font-[500]"
                                  placeholder="Clothes Washer/Dryer/ Fridge/Stove/DW..."
                                />
                              </div>
                            </DraggableBox>
                          )}
                        </div>

                        <div className="space-y-2 text-[10px] w-1/2">
                          {!isFieldDeleted("siteInfluences") && (
                            <DraggableBox
                              id="siteInfluences"
                              position={fieldPositions.siteInfluences}
                              onPositionChange={updateFieldPosition}
                              label="Site Influences"
                              zoom={0.55}
                              disabled={lockedSections.details}
                              onDelete={() =>
                                removeStandardField(
                                  "siteInfluences",
                                  "Site Influences",
                                  siteInfluences,
                                  "Page 2 - Details",
                                  fieldStyles.siteInfluences,
                                )
                              }
                              deleteTitle="Remove Site Influences"
                            >
                              <div>
                                <span className="font-bold">
                                  SITE INFLUENCES:
                                </span>
                                <StyledInput
                                  value={siteInfluences}
                                  onChange={(e) =>
                                    setSiteInfluences(e.target.value)
                                  }
                                  onChangeStyle={(s) =>
                                    updateFieldStyle("siteInfluences", s)
                                  }
                                  inputStyle={fieldStyles.siteInfluences}
                                  className="font-semibold text-[10px] bg-transparent text-left w-full focus:outline-none border-none placeholder-[#FFFFFF] placeholder:font-[500]"
                                  placeholder="Central Location, Golf Course Nearby..."
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
                              zoom={0.55}
                              disabled={lockedSections.details}
                              onDelete={() =>
                                removeStandardField(
                                  "amenities",
                                  "Amenities",
                                  amenities,
                                  "Page 2 - Details",
                                  fieldStyles.amenities,
                                )
                              }
                              deleteTitle="Remove Amenities"
                            >
                              <div>
                                <span className="font-bold">AMENITIES:</span>
                                <StyledInput
                                  value={amenities}
                                  onChange={(e) => setAmenities(e.target.value)}
                                  onChangeStyle={(s) =>
                                    updateFieldStyle("amenities", s)
                                  }
                                  inputStyle={fieldStyles.amenities}
                                  className="font-semibold text-[10px] bg-transparent text-left w-full focus:outline-none border-none placeholder-[#FFFFFF] placeholder:font-[500]"
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
                              zoom={0.55}
                              disabled={lockedSections.details}
                              onDelete={() =>
                                removeStandardField(
                                  "view",
                                  "View",
                                  view,
                                  "Page 2 - Details",
                                  fieldStyles.view,
                                )
                              }
                              deleteTitle="Remove View"
                            >
                              <div>
                                <span className="font-bold">VIEW:</span>{" "}
                                <StyledInput
                                  value={view}
                                  onChange={(e) => setView(e.target.value)}
                                  onChangeStyle={(s) =>
                                    updateFieldStyle("view", s)
                                  }
                                  inputStyle={fieldStyles.view}
                                  className="font-semibold text-[10px] bg-transparent text-left w-full focus:outline-none border-none placeholder-[#FFFFFF] placeholder:font-[500]"
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
                              label="MLS Number"
                              zoom={0.55}
                              disabled={lockedSections.details}
                              onDelete={() =>
                                removeStandardField(
                                  "mlsNumber",
                                  "MLS Number",
                                  mlsNumber,
                                  "Page 2 - Details",
                                  fieldStyles.mlsNumber,
                                )
                              }
                              deleteTitle="Remove MLS Number"
                            >
                              <div className="mt-0">
                                <StyledInput
                                  value={mlsNumber}
                                  onChange={(e) => setMlsNumber(e.target.value)}
                                  onChangeStyle={(s) =>
                                    updateFieldStyle("mlsNumber", s)
                                  }
                                  inputStyle={fieldStyles.mlsNumber}
                                  className="font-semibold text-[10px] bg-transparent text-left w-full focus:outline-none border-none placeholder-[#FFFFFF] placeholder:font-[500]"
                                  placeholder="Enter MLS here"
                                />
                              </div>
                            </DraggableBox>
                          )}
                        </div>
                      </div>

                      {/* image16 */}
                      <div
                        data-image-slot="true"
                        className="w-full h-[650px] place-self-center border-2 z-10 border-[#fff] relative overflow-hidden group shadow-[6px_6px_12px_rgba(0,0,0,0.85)] cursor-pointer"
                        onMouseEnter={() => setHoveredSlot("image16")}
                        onMouseLeave={() => setHoveredSlot(null)}
                        onClick={(e) => {
                          if (e.altKey) return;
                          e.stopPropagation();
                          setActiveSlot("image16");
                        }}
                      >
                        <BoxIndicator isVisible={isSlotActive("image16")} />
                        <div
                          className="w-full h-full relative overflow-hidden flex items-center justify-center"
                          onMouseMove={(e) => handleMouseMove("image16", e)}
                          onMouseUp={() => handleMouseUp("image16")}
                          onMouseLeave={() => handleMouseLeave("image16")}
                        >
                          {images.image16 ? (
                            <>
                              <div
                                className="w-full h-full cursor-grab active:cursor-grabbing"
                                onMouseDown={(e) =>
                                  handleMouseDown("image16", e)
                                }
                              >
                                <ImageEditor
                                  src={images.image16}
                                  scale={scale.image16}
                                  position={position.image16}
                                  rotation={rotation.image16}
                                />
                              </div>

                              {/* Zoom Controls */}
                              <div className="absolute bottom-1 left-1 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto z-20">
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

                              {/* Rotate */}
                              <button
                                type="button"
                                onClick={() => handleRotate("image16")}
                                className="absolute top-2 right-[72px] z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                                title="Rotate image"
                              >
                                <RotateCw className="w-4 h-4 text-gray-700" />
                              </button>

                              {/* Edit */}
                              <button
                                type="button"
                                onClick={(e) =>
                                  openImageSourceModal("image16", e)
                                }
                                className="absolute top-2 right-10 z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                                title="Edit image"
                              >
                                <Pencil className="w-4 h-4 text-gray-700" />
                              </button>

                              {/* Delete */}
                              <button
                                type="button"
                                onClick={() =>
                                  handleDelete("image16", fileInputRef16)
                                }
                                className="absolute top-2 right-2 z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                                title="Delete image"
                              >
                                <Trash className="w-4 h-4 text-red-500" />
                              </button>
                            </>
                          ) : (
                            <div
                              data-html2canvas-ignore="true"
                              onClick={(e) =>
                                openImageSourceModal("image16", e)
                              }
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
                </div>

                {/* Property Specs Bar Section with Section Lock */}
                <div
                  data-safezone-container="true"
                  className={`font-bold text-white text-[27px] tracking-[4px] h-[80px] relative z-10 pt-4 pb-1 shrink-0 flex items-center transition-all duration-150 group/sec rounded-lg border-[3.5px] border-solid border-transparent ${
                    lockedSections.specs
                      ? "hover:border-amber-400 hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(245,158,11,0.4)] hover:bg-amber-500/5"
                      : "hover:border-[#8B3DFF] hover:shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_0_12px_rgba(139,61,255,0.4)] hover:bg-[#8B3DFF]/5"
                  }`}
                >
                  {/* Lock / Unlock Toggle Button */}
                  <button
                    type="button"
                    data-html2canvas-ignore="true"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSectionLock("specs");
                    }}
                    className={`absolute top-0 right-2 z-30 p-1 rounded-md transition-all duration-150 shadow-sm flex items-center gap-1 text-[8px] font-medium cursor-pointer opacity-0 group-hover/sec:opacity-100 ${
                      lockedSections.specs
                        ? "bg-amber-500 text-white shadow-amber-500/30 hover:bg-amber-600"
                        : "bg-white/90 text-gray-700 hover:bg-white border border-gray-200"
                    }`}
                    title={
                      lockedSections.specs
                        ? "Unlock Specs Section (enable dragging)"
                        : "Lock Specs Section (disable dragging)"
                    }
                  >
                    {lockedSections.specs ? (
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

                  {!isFieldDeleted("bedroom") && (
                    <DraggableBox
                      id="bedroom"
                      position={fieldPositions.bedroom}
                      onPositionChange={updateFieldPosition}
                      label="Bedrooms"
                      zoom={0.55}
                      disabled={lockedSections.specs}
                      onDelete={() =>
                        removeStandardField(
                          "bedroom",
                          "Bedrooms",
                          bedroom,
                          "Page 2 - Specs",
                          fieldStyles.bedroom,
                        )
                      }
                      deleteTitle="Remove Bedrooms"
                    >
                      <div className="flex items-center gap-1.5 shrink-0">
                        <StyledInput
                          value={bedroom}
                          onChange={(e) => setBedroom(e.target.value)}
                          onChangeStyle={(s) => updateFieldStyle("bedroom", s)}
                          inputStyle={fieldStyles.bedroom}
                          className="font-semibold text-[22px] bg-transparent text-left w-[40px] h-[30px] focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
                          placeholder="0"
                        />
                        <span className="shrink-0">
                          BEDROOM {!isFieldDeleted("bathroom") && "•"}
                        </span>
                      </div>
                    </DraggableBox>
                  )}

                  {!isFieldDeleted("bathroom") && (
                    <DraggableBox
                      id="bathroom"
                      position={fieldPositions.bathroom}
                      onPositionChange={updateFieldPosition}
                      label="Bathrooms"
                      zoom={0.55}
                      disabled={lockedSections.specs}
                      onDelete={() =>
                        removeStandardField(
                          "bathroom",
                          "Bathrooms",
                          bathroom,
                          "Page 2 - Specs",
                          fieldStyles.bathroom,
                        )
                      }
                      deleteTitle="Remove Bathrooms"
                    >
                      <div className="flex items-center gap-1.5 shrink-0">
                        <StyledInput
                          value={bathroom}
                          onChange={(e) => setBathroom(e.target.value)}
                          onChangeStyle={(s) => updateFieldStyle("bathroom", s)}
                          inputStyle={fieldStyles.bathroom}
                          className="font-semibold text-[22px] bg-transparent text-left w-[40px] h-[30px] focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
                          placeholder="0"
                        />
                        <span className="shrink-0">
                          BATHROOM {!isFieldDeleted("sqft") && "•"}
                        </span>
                      </div>
                    </DraggableBox>
                  )}

                  {!isFieldDeleted("sqft") && (
                    <DraggableBox
                      id="sqft"
                      position={fieldPositions.sqft}
                      onPositionChange={updateFieldPosition}
                      label="Sq Ft"
                      zoom={0.55}
                      disabled={lockedSections.specs}
                      onDelete={() =>
                        removeStandardField(
                          "sqft",
                          "Sq Ft",
                          sqft,
                          "Page 2 - Specs",
                          fieldStyles.sqft,
                        )
                      }
                      deleteTitle="Remove Sq Ft"
                    >
                      <div className="flex items-center gap-1.5 shrink-0">
                        <StyledInput
                          value={sqft}
                          onChange={(e) => setSqft(e.target.value)}
                          onChangeStyle={(s) => updateFieldStyle("sqft", s)}
                          inputStyle={fieldStyles.sqft}
                          className="font-semibold text-[22px] bg-transparent text-left h-[30px] w-[90px] focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
                          placeholder="000"
                        />
                        <span className="shrink-0">
                          SQ FT {!isFieldDeleted("builtYear") && "•"}
                        </span>
                      </div>
                    </DraggableBox>
                  )}

                  {!isFieldDeleted("builtYear") && (
                    <DraggableBox
                      id="builtYear"
                      position={fieldPositions.builtYear}
                      onPositionChange={updateFieldPosition}
                      label="Built Year"
                      zoom={0.55}
                      disabled={lockedSections.specs}
                      onDelete={() =>
                        removeStandardField(
                          "builtYear",
                          "Built Year",
                          builtYear,
                          "Page 2 - Specs",
                          fieldStyles.builtYear,
                        )
                      }
                      deleteTitle="Remove Built Year"
                    >
                      <div className="flex items-center gap-1.5 shrink-0">
                        <StyledInput
                          value={builtYear}
                          onChange={(e) => setBuiltYear(e.target.value)}
                          onChangeStyle={(s) =>
                            updateFieldStyle("builtYear", s)
                          }
                          inputStyle={fieldStyles.builtYear}
                          className="font-semibold text-[22px] mr-[5px] bg-transparent text-left h-[30px] w-[90px] focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
                          placeholder="0000"
                        />
                        <span className="shrink-0">BUILT IN</span>
                      </div>
                    </DraggableBox>
                  )}
                </div>

                <svg
                  viewBox="164 80 628 81.73"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="absolute bottom-[30%] pointer-events-none z-0"
                  preserveAspectRatio="none"
                  style={{
                    marginLeft: showBleed ? "-0.375in" : "-0.25in",
                    marginRight: showBleed ? "-0.375in" : "-0.25in",
                    width: showBleed
                      ? "calc(100% + 0.75in)"
                      : "calc(100% + 0.5in)",
                  }}
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
                      <feFlood
                        floodOpacity="0"
                        result="BackgroundImageFix"
                      ></feFlood>
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
            </SafeZoneWrapper>
          </div>
        </div>
      </>
    );
  },
);

BcfpStandard4.displayName = "BcfpStandard4";

export default BcfpStandard4;
